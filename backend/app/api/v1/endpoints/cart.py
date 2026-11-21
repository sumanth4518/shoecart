from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.entities import Cart, CartItem, Product, ProductVariant, Inventory, User
from app.schemas.all_schemas import CartItemAdd
from app.services.storage_service import storage_service

router = APIRouter()

@router.get("")
@router.get("/")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches user cart with eager loading to prevent N+1 queries."""
    cart = (
        db.query(Cart)
        .options(
            selectinload(Cart.items)
            .joinedload(CartItem.variant)
            .joinedload(ProductVariant.product)
            .selectinload(Product.images),
            selectinload(Cart.items)
            .joinedload(CartItem.variant)
            .joinedload(ProductVariant.inventory)
        )
        .filter(Cart.user_id == current_user.id)
        .first()
    )
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    cart_items = []
    for item in cart.items:
        variant = item.variant
        product = variant.product if variant else None
        if not product:
            continue

        primary_img = next((storage_service.get_presigned_url(img.image_url) for img in product.images if img.is_primary), None)
        if not primary_img and product.images:
            primary_img = storage_service.get_presigned_url(product.images[0].image_url)
        if not primary_img:
            primary_img = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"

        price = float(variant.price_override if variant.price_override else (product.discount_price if product.discount_price else product.base_price))
        stock = variant.inventory.stock_quantity if variant.inventory else 0

        cart_items.append({
            "id": item.id,
            "product_id": product.id,
            "variant_id": variant.id,
            "name": product.name,
            "size": variant.size,
            "colour": variant.colour_name,
            "price": price,
            "image": primary_img,
            "stock": stock,
            "quantity": item.quantity
        })

    return cart_items

@router.post("/add")
def add_to_cart(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a product variant (with size/colour) to cart or increments quantity."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    product = db.query(Product).filter(Product.id == payload.productId).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Resolve variant
    variant = None
    if payload.variantId:
        variant = db.query(ProductVariant).filter(ProductVariant.id == payload.variantId).first()
    elif payload.size:
        variant = db.query(ProductVariant).filter(
            ProductVariant.product_id == payload.productId,
            ProductVariant.size == payload.size
        ).first()

    # Fallback to first available active variant
    if not variant:
        variant = db.query(ProductVariant).filter(
            ProductVariant.product_id == payload.productId,
            ProductVariant.is_active == True
        ).first()

    if not variant:
        # Create a default variant if none exists yet
        variant = ProductVariant(
            product_id=product.id,
            sku=f"{product.id}-DEFAULT-BLK",
            size="UK 8",
            colour_name="Onyx Black"
        )
        db.add(variant)
        db.commit()
        db.refresh(variant)

    # Check inventory
    stock = variant.inventory.stock_quantity if variant.inventory else 100
    if stock <= 0:
        raise HTTPException(status_code=400, detail="Selected size is out of stock")

    # Check if variant already exists in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.variant_id == variant.id
    ).first()

    if existing_item:
        new_qty = existing_item.quantity + payload.quantity
        if new_qty > stock:
            raise HTTPException(status_code=400, detail=f"Cannot add more than {stock} available units")
        existing_item.quantity = new_qty
    else:
        if payload.quantity > stock:
            raise HTTPException(status_code=400, detail=f"Cannot add more than {stock} available units")
        new_item = CartItem(
            cart_id=cart.id,
            variant_id=variant.id,
            quantity=payload.quantity
        )
        db.add(new_item)

    db.commit()
    return {"message": "Item added to cart"}

@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes an item or all variants of a product from the user's cart."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return {"message": "Cart is empty"}

    # Find items belonging to this product or variant
    items = db.query(CartItem).join(CartItem.variant).filter(
        CartItem.cart_id == cart.id,
        ProductVariant.product_id == product_id
    ).all()

    # Also check if product_id was actually a variant_id
    if not items:
        items = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.variant_id == product_id
        ).all()

    for item in items:
        db.delete(item)

    db.commit()
    return {"message": "Item removed from cart"}

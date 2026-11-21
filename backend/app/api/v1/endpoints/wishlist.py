from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.entities import Wishlist, WishlistItem, Product, Cart, CartItem, ProductVariant, User
from app.schemas.all_schemas import WishlistItemAdd
from app.api.v1.endpoints.products import serialize_product, get_product_eager_options

router = APIRouter()

@router.get("")
@router.get("/")
def get_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches user's saved wishlist products with eager loading."""
    wishlist = (
        db.query(Wishlist)
        .options(
            selectinload(Wishlist.items)
            .joinedload(WishlistItem.product)
            .options(*get_product_eager_options())
        )
        .filter(Wishlist.user_id == current_user.id)
        .first()
    )
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)

    products = []
    if wishlist.items:
        for item in wishlist.items:
            if item.product and item.product.is_active:
                products.append(serialize_product(item.product))

    return products

@router.post("/add")
def add_to_wishlist(
    payload: WishlistItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a product to customer's wishlist."""
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)

    product = db.query(Product).filter(Product.id == payload.productId).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == payload.productId
    ).first()

    if not existing:
        item = WishlistItem(wishlist_id=wishlist.id, product_id=payload.productId)
        db.add(item)
        db.commit()

    return {"message": "Product saved to wishlist"}

@router.delete("/remove/{product_id}")
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes a product from wishlist."""
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if wishlist:
        db.query(WishlistItem).filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        ).delete()
        db.commit()

    return {"message": "Product removed from wishlist"}

@router.post("/move-to-cart/{product_id}")
def move_to_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Moves an item from wishlist to active cart."""
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if wishlist:
        db.query(WishlistItem).filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        ).delete()
        db.commit()

    # Add to cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    variant = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active == True
    ).first()

    if variant:
        existing = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.variant_id == variant.id
        ).first()
        if existing:
            existing.quantity += 1
        else:
            db.add(CartItem(cart_id=cart.id, variant_id=variant.id, quantity=1))
        db.commit()

    return {"message": "Moved to cart"}

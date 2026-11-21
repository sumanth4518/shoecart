import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.entities import Order, OrderItem, Product, ProductVariant, Inventory, Cart, CartItem, Address, User, Role
from app.schemas.all_schemas import OrderCreate, OrderStatusUpdate
from app.services.storage_service import storage_service

router = APIRouter()

def serialize_order(o: Order) -> dict:
    items_list = []
    for item in o.items:
        raw_img = None
        if isinstance(item.variant_snapshot, dict):
            candidate = item.variant_snapshot.get("image")
            if candidate and isinstance(candidate, str) and candidate.strip() not in ("", "null", "undefined", "None"):
                raw_img = candidate.strip()

        if not raw_img and item.variant and item.variant.product:
            prod = item.variant.product
            if prod.images:
                raw_img = next((i.image_url for i in prod.images if i.is_primary), prod.images[0].image_url)

        # Generate fresh 7-day presigned URL for Neon S3 or return clean direct link
        resolved_img = storage_service.get_presigned_url(raw_img) if raw_img else "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"

        items_list.append({
            "id": item.id,
            "product_id": item.variant.product_id if item.variant else 0,
            "variant_id": item.variant_id,
            "name": item.product_name,
            "size": item.variant_snapshot.get("size") if isinstance(item.variant_snapshot, dict) else (item.variant.size if item.variant else "UK 8"),
            "colour": item.variant_snapshot.get("colour") if isinstance(item.variant_snapshot, dict) else (item.variant.colour_name if item.variant else None),
            "price": float(item.unit_price),
            "quantity": item.quantity,
            "image": resolved_img
        })

    return {
        "id": o.id,
        "order_number": o.order_number,
        "user_id": o.user_id,
        "user_name": o.user.full_name if o.user else "Customer",
        "user_email": o.user.email if o.user else "",
        "address": o.shipping_address_snapshot.get("formatted_address") if isinstance(o.shipping_address_snapshot, dict) else str(o.shipping_address_snapshot),
        "total_price": float(o.total_amount),
        "subtotal": float(o.subtotal),
        "discount_amount": float(o.discount_amount),
        "delivery_fee": float(o.delivery_fee),
        "status": o.order_status,
        "payment_status": o.payment_status,
        "payment_method": o.payment_method,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "items": items_list
    }

@router.post("")
@router.post("/")
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates an order with transactional inventory reduction and cart clearing.
    Validates size availability and snapshots address details.
    """
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    # Determine items to order: from payload or active cart
    items_to_process = []
    if payload.orderItems and len(payload.orderItems) > 0:
        items_to_process = payload.orderItems
    elif cart and cart.items:
        for ci in cart.items:
            variant = ci.variant
            product = variant.product
            price = float(variant.price_override if variant.price_override else (product.discount_price if product.discount_price else product.base_price))
            img = next((i.image_url for i in product.images if i.is_primary), product.images[0].image_url if product.images else "")
            if img and "?" in img:
                img = img.split("?")[0]
            items_to_process.append({
                "product_id": product.id,
                "variant_id": variant.id,
                "name": product.name,
                "quantity": ci.quantity,
                "price": price,
                "size": variant.size,
                "colour": variant.colour_name,
                "image": img
            })

    if not items_to_process:
        raise HTTPException(status_code=400, detail="Cannot create an empty order")

    # Address snapshotting
    address_str = payload.address or "Standard Delivery Address"
    address_snapshot = {
        "formatted_address": address_str,
        "recipient_name": current_user.full_name,
        "phone_number": current_user.phone_number or ""
    }

    subtotal = Decimal("0.00")
    order_items_records = []

    # Process items and validate inventory inside a database transaction
    for item in items_to_process:
        p_id = item.get("product_id") or item.get("productId")
        v_id = item.get("variant_id") or item.get("variantId")
        qty = int(item.get("quantity", 1))

        # Find variant
        variant = None
        if v_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == v_id).first()
        elif p_id:
            variant = db.query(ProductVariant).filter(ProductVariant.product_id == p_id).first()

        if not variant:
            raise HTTPException(status_code=400, detail=f"Footwear variant not found for item {p_id}")

        product = variant.product
        
        # Verify size inventory
        if variant.inventory:
            if variant.inventory.stock_quantity < qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name} (Size: {variant.size}). Only {variant.inventory.stock_quantity} left."
                )
            # Deduct stock
            variant.inventory.stock_quantity -= qty

        unit_price = Decimal(str(item.get("price", product.base_price)))
        item_total = unit_price * qty
        subtotal += item_total

        primary_img = next((i.image_url for i in product.images if i.is_primary), product.images[0].image_url if product.images else "")
        if primary_img and "?" in primary_img:
            primary_img = primary_img.split("?")[0]
        
        snapshot_img = item.get("image", primary_img)
        if snapshot_img and "?" in snapshot_img:
            snapshot_img = snapshot_img.split("?")[0]

        order_items_records.append(
            OrderItem(
                variant_id=variant.id,
                product_name=product.name,
                variant_snapshot={
                    "size": variant.size,
                    "colour": variant.colour_name,
                    "sku": variant.sku,
                    "image": snapshot_img
                },
                unit_price=unit_price,
                quantity=qty,
                total_price=item_total
            )
        )

    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    discount_amount = Decimal("0.00")
    delivery_fee = Decimal("0.00") if subtotal >= Decimal("1500.00") else Decimal("99.00")
    final_total = subtotal - discount_amount + delivery_fee

    new_order = Order(
        order_number=order_number,
        user_id=current_user.id,
        shipping_address_snapshot=address_snapshot,
        subtotal=subtotal,
        discount_amount=discount_amount,
        delivery_fee=delivery_fee,
        total_amount=final_total,
        order_status="pending",
        payment_status="payment_pending",
        payment_method=payload.payment_method or "cod"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Attach order items
    for oi in order_items_records:
        oi.order_id = new_order.id
        db.add(oi)

    # Clear user's cart
    if cart:
        for ci in cart.items:
            db.delete(ci)

    db.commit()
    db.refresh(new_order)

    return {
        "message": "Order placed successfully",
        "orderId": new_order.id,
        "orderNumber": new_order.order_number,
        "totalAmount": float(new_order.total_amount)
    }

@router.get("")
@router.get("/")
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves orders with eager loading for user and items to prevent N+1 queries."""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = role and role.name == "admin"

    eager_opts = [
        joinedload(Order.user),
        selectinload(Order.items)
        .joinedload(OrderItem.variant)
        .joinedload(ProductVariant.product)
        .selectinload(Product.images)
    ]

    if is_admin:
        orders = db.query(Order).options(*eager_opts).order_by(Order.created_at.desc()).all()
    else:
        orders = db.query(Order).options(*eager_opts).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

    return [serialize_order(o) for o in orders]

@router.get("/{order_id}")
def get_order_by_id(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches details for a specific order with eager relationships."""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = role and role.name == "admin"

    eager_opts = [
        joinedload(Order.user),
        selectinload(Order.items)
        .joinedload(OrderItem.variant)
        .joinedload(ProductVariant.product)
        .selectinload(Product.images)
    ]

    query = db.query(Order).options(*eager_opts).filter(Order.id == order_id)
    if not is_admin:
        query = query.filter(Order.user_id == current_user.id)

    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return serialize_order(order)

@router.put("/{order_id}")
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update order status."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.order_status = payload.status
    if payload.status == "delivered":
        order.payment_status = "paid"
    elif payload.status == "cancelled":
        # Restore inventory
        for item in order.items:
            if item.variant and item.variant.inventory:
                item.variant.inventory.stock_quantity += item.quantity

    db.commit()
    return {"message": "Order status updated successfully"}

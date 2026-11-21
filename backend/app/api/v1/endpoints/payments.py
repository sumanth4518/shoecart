import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, selectinload
import stripe

from app.database.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.entities import (
    User, Order, OrderItem, Payment, Cart, CartItem,
    ProductVariant, Product, Coupon, Role
)
from app.schemas.all_schemas import (
    CheckoutSessionCreate, CheckoutSessionResponse, PaymentVerifyResponse
)
from app.services.storage_service import storage_service

router = APIRouter()

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates cart items and availability, calculates database-backed prices,
    creates a pending order and payment record inside a transaction,
    and returns a hosted Stripe Checkout Session URL.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe Payment Gateway is not configured. Please set STRIPE_SECRET_KEY in backend environment."
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # 0. Safely clean up any abandoned PENDING Stripe checkouts for this user to release previously locked stock
    stale_pending_orders = (
        db.query(Order)
        .options(selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.inventory))
        .filter(
            Order.user_id == current_user.id,
            Order.payment_method == "stripe",
            Order.payment_status == "PENDING"
        )
        .all()
    )
    for stale_order in stale_pending_orders:
        stale_order.payment_status = "CANCELLED"
        stale_order.order_status = "cancelled"
        for oi in stale_order.items:
            if oi.variant and oi.variant.inventory:
                oi.variant.inventory.stock_quantity += oi.quantity
        stale_payment = db.query(Payment).filter(Payment.order_id == stale_order.id).first()
        if stale_payment and stale_payment.payment_status == "PENDING":
            stale_payment.payment_status = "CANCELLED"
    db.flush()

    # 1. Fetch user's cart from database
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

    items_to_process = []
    if payload.orderItems and len(payload.orderItems) > 0:
        items_to_process = payload.orderItems
    elif cart and cart.items:
        for ci in cart.items:
            variant = ci.variant
            if not variant or not variant.product:
                continue
            items_to_process.append({
                "product_id": variant.product_id,
                "variant_id": variant.id,
                "quantity": ci.quantity
            })

    if not items_to_process:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create checkout session for an empty cart."
        )

    # 2. Validate availability and recalculate prices from database values
    subtotal = Decimal("0.00")
    order_items_records = []
    stripe_line_items = []

    for item in items_to_process:
        v_id = item.get("variant_id") or item.get("variantId")
        p_id = item.get("product_id") or item.get("productId")
        qty = int(item.get("quantity", 1))

        if qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid quantity {qty} for item."
            )

        variant = None
        if v_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == v_id).first()
        elif p_id:
            variant = db.query(ProductVariant).filter(ProductVariant.product_id == p_id).first()

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Footwear variant not found for item."
            )

        product = variant.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name if product else 'Unknown'}' is currently inactive."
            )

        # Inventory check
        if variant.inventory:
            if variant.inventory.stock_quantity < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}' (Size: {variant.size}). Available: {variant.inventory.stock_quantity} units."
                )
            # Deduct inventory for pending order (will be restored if session expires/cancels)
            variant.inventory.stock_quantity -= qty

        # Price calculation from DB (never trusted from frontend)
        db_price = variant.price_override if variant.price_override else (
            product.discount_price if product.discount_price else product.base_price
        )
        unit_price = Decimal(str(db_price))
        item_total = unit_price * qty
        subtotal += item_total

        # Primary image resolution
        primary_img = ""
        if product.images:
            primary_img = next((i.image_url for i in product.images if i.is_primary), product.images[0].image_url)
        if primary_img and "?" in primary_img:
            primary_img = primary_img.split("?")[0]

        order_items_records.append(
            OrderItem(
                variant_id=variant.id,
                product_name=product.name,
                variant_snapshot={
                    "size": variant.size,
                    "colour": variant.colour_name,
                    "sku": variant.sku,
                    "image": primary_img
                },
                unit_price=unit_price,
                quantity=qty,
                total_price=item_total
            )
        )

        # Stripe line item (Stripe requires amount in smallest currency unit: paise for INR)
        stripe_img_urls = []
        if primary_img:
            presigned_img = storage_service.get_presigned_url(primary_img)
            if presigned_img and presigned_img.startswith("http"):
                stripe_img_urls.append(presigned_img)

        stripe_line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {
                    "name": product.name,
                    "description": f"Size: {variant.size} | Color: {variant.colour_name}",
                    "images": stripe_img_urls[:1] if stripe_img_urls else []
                },
                "unit_amount": int(unit_price * 100),
            },
            "quantity": qty,
        })

    # 3. Calculate delivery fee & discounts
    discount_amount = Decimal("0.00")
    coupon_record = None
    if payload.coupon_code:
        coupon_record = (
            db.query(Coupon)
            .filter(Coupon.code == payload.coupon_code.upper().strip(), Coupon.is_active == True)
            .first()
        )
        if coupon_record:
            if coupon_record.discount_type == "percentage":
                pct_discount = subtotal * (coupon_record.discount_value / Decimal("100.00"))
                if coupon_record.max_discount_amount:
                    discount_amount = min(pct_discount, coupon_record.max_discount_amount)
                else:
                    discount_amount = pct_discount
            elif coupon_record.discount_type == "fixed":
                discount_amount = min(coupon_record.discount_value, subtotal)

    # Free delivery on orders >= ₹1500
    delivery_fee = Decimal("0.00") if subtotal >= Decimal("1500.00") else Decimal("99.00")
    if delivery_fee > Decimal("0.00"):
        stripe_line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {
                    "name": "Express Footwear Delivery",
                    "description": "Standard door-to-door insured transit"
                },
                "unit_amount": int(delivery_fee * 100),
            },
            "quantity": 1,
        })

    final_total = max(Decimal("0.00"), subtotal - discount_amount + delivery_fee)

    # 4. Address snapshotting
    address_str = payload.address or "Standard Shipping Address"
    address_snapshot = {
        "formatted_address": address_str,
        "recipient_name": current_user.full_name,
        "phone_number": current_user.phone_number or ""
    }

    # 5. Create Order record in DB
    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    new_order = Order(
        order_number=order_number,
        user_id=current_user.id,
        address_id=payload.address_id,
        shipping_address_snapshot=address_snapshot,
        coupon_id=coupon_record.id if coupon_record else None,
        subtotal=subtotal,
        discount_amount=discount_amount,
        delivery_fee=delivery_fee,
        total_amount=final_total,
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(new_order)
    db.flush()

    for oi in order_items_records:
        oi.order_id = new_order.id
        db.add(oi)

    # 6. Create initial Payment record in DB
    new_payment = Payment(
        order_id=new_order.id,
        customer_id=current_user.id,
        amount=final_total,
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(new_payment)
    db.flush()

    # 7. Create Stripe Checkout Session
    frontend_base = (settings.FRONTEND_URL or "http://localhost:3000").rstrip("/")
    success_url = f"{frontend_base}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_base}/payment/cancel?order_id={new_order.id}"

    try:
        session = stripe.checkout.Session.create(
            line_items=stripe_line_items,
            mode="payment",
            customer_email=current_user.email,
            client_reference_id=str(new_order.id),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "order_id": str(new_order.id),
                "order_number": new_order.order_number,
                "customer_id": str(current_user.id),
                "payment_id": str(new_payment.id)
            }
        )
    except stripe.error.StripeError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe Gateway Error: {str(e)}"
        )

    # Associate Stripe session ID with payment record and commit
    new_payment.stripe_checkout_session_id = session.id
    db.commit()

    return CheckoutSessionResponse(
        checkout_url=session.url,
        session_id=session.id,
        order_id=new_order.id,
        order_number=new_order.order_number
    )

@router.get("/verify-session/{session_id}", response_model=PaymentVerifyResponse)
def verify_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies that a Stripe Checkout Session belongs to the authenticated customer,
    checks live payment status from Stripe, and updates payment/order records if confirmed.
    """
    payment = (
        db.query(Payment)
        .filter(Payment.stripe_checkout_session_id == session_id)
        .first()
    )
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment session not found."
        )

    # Check authorization (must be order owner or admin)
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = role and role.name == "admin"
    if payment.customer_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to verify this payment session."
        )

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated order not found."
        )

    # Verify live session from Stripe if not already confirmed
    if payment.payment_status != "PAID" and settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe_session = stripe.checkout.Session.retrieve(session_id, expand=["payment_intent"])

            if stripe_session.payment_status == "paid":
                payment.payment_status = "PAID"
                pi = stripe_session.payment_intent
                if pi:
                    payment.stripe_payment_intent_id = pi.id if hasattr(pi, "id") else str(pi)

                order.payment_status = "PAID"
                order.order_status = "confirmed"

                # Clear user's cart in database
                cart = db.query(Cart).filter(Cart.user_id == payment.customer_id).first()
                if cart:
                    for ci in cart.items:
                        db.delete(ci)

                db.commit()
                db.refresh(payment)
                db.refresh(order)
            elif stripe_session.status == "expired":
                payment.payment_status = "CANCELLED"
                order.payment_status = "CANCELLED"
                order.order_status = "cancelled"

                # Restore inventory
                for oi in order.items:
                    if oi.variant and oi.variant.inventory:
                        oi.variant.inventory.stock_quantity += oi.quantity

                db.commit()
                db.refresh(payment)
                db.refresh(order)
        except stripe.error.StripeError as e:
            # Fall back to database status if Stripe cannot be queried
            pass

    return PaymentVerifyResponse(
        status=payment.payment_status,
        order_id=order.id,
        order_number=order.order_number,
        amount=float(payment.amount),
        currency=payment.currency,
        payment_method=payment.payment_method,
        stripe_session_id=payment.stripe_checkout_session_id,
        order_status=order.order_status,
        shipping_address=order.shipping_address_snapshot
    )

@router.post("/cancel/{order_id}")
def cancel_pending_checkout(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancels a pending Stripe checkout order and releases reserved inventory
    so the customer can safely retry or re-order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if order.payment_status == "PENDING":
        order.payment_status = "CANCELLED"
        order.order_status = "cancelled"

        # Restore inventory
        for oi in order.items:
            if oi.variant and oi.variant.inventory:
                oi.variant.inventory.stock_quantity += oi.quantity

        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        if payment and payment.payment_status == "PENDING":
            payment.payment_status = "CANCELLED"

        db.commit()

    return {"message": "Checkout safely cancelled. Items retained in cart.", "order_id": order_id}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Accepts raw Stripe webhook payloads, validates signature with STRIPE_WEBHOOK_SECRET,
    and idempotently updates payment and order statuses.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="STRIPE_WEBHOOK_SECRET is not configured on the server."
        )

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header in webhook request."
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload received in Stripe webhook."
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature on Stripe webhook payload."
        )

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    # 1. checkout.session.completed
    if event_type == "checkout.session.completed":
        session_id = data_object.get("id")
        payment = (
            db.query(Payment)
            .filter(Payment.stripe_checkout_session_id == session_id)
            .first()
        )

        if payment:
            # Idempotency check: prevent duplicate event processing
            if payment.payment_status == "PAID":
                return {"received": True, "notice": "Event already processed"}

            if data_object.get("payment_status") == "paid":
                payment.payment_status = "PAID"
                pi = data_object.get("payment_intent")
                if pi:
                    payment.stripe_payment_intent_id = pi if isinstance(pi, str) else pi.get("id")

                order = db.query(Order).filter(Order.id == payment.order_id).first()
                if order:
                    order.payment_status = "PAID"
                    order.order_status = "confirmed"

                # Clear customer's cart
                cart = db.query(Cart).filter(Cart.user_id == payment.customer_id).first()
                if cart:
                    for ci in cart.items:
                        db.delete(ci)

                db.commit()

    # 2. checkout.session.expired
    elif event_type == "checkout.session.expired":
        session_id = data_object.get("id")
        payment = (
            db.query(Payment)
            .filter(Payment.stripe_checkout_session_id == session_id)
            .first()
        )

        if payment and payment.payment_status == "PENDING":
            payment.payment_status = "CANCELLED"
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.payment_status = "CANCELLED"
                order.order_status = "cancelled"

                # Release reserved inventory back
                for oi in order.items:
                    if oi.variant and oi.variant.inventory:
                        oi.variant.inventory.stock_quantity += oi.quantity

            db.commit()

    # 3. payment_intent.payment_failed
    elif event_type == "payment_intent.payment_failed":
        pi_id = data_object.get("id")
        payment = (
            db.query(Payment)
            .filter(Payment.stripe_payment_intent_id == pi_id)
            .first()
        )

        if not payment:
            # Attempt lookup by metadata order_id
            order_id = data_object.get("metadata", {}).get("order_id")
            if order_id:
                try:
                    payment = db.query(Payment).filter(Payment.order_id == int(order_id)).first()
                except (ValueError, TypeError):
                    pass

        if payment and payment.payment_status != "PAID":
            payment.payment_status = "FAILED"
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.payment_status = "FAILED"

            db.commit()

    return {"received": True}

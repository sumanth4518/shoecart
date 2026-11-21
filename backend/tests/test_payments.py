import pytest
import uuid
from unittest.mock import patch, MagicMock
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.models.entities import User, Order, OrderItem, Payment, Cart, CartItem, ProductVariant, Inventory, Product
from app.core.config import settings
from app.core.security import get_password_hash
import stripe

client = TestClient(app)

@pytest.fixture(autouse=True)
def ensure_stripe_keys(monkeypatch):
    """Ensure test stripe keys are configured for test suite."""
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock_secret_key_123")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock_webhook_secret_123")

def get_auth_token(email="john@example.com", password="admin123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.json()["token"]

def test_unauthorized_checkout():
    """Ensure unauthenticated users cannot initiate checkout session."""
    response = client.post("/api/payments/create-checkout-session", json={
        "address": "123 Street"
    })
    assert response.status_code == 401

def test_create_checkout_session_empty_cart():
    """Ensure checkout session fails when cart is empty."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure cart is empty
    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if cart:
        for ci in cart.items:
            db.delete(ci)
        db.commit()
    db.close()

    response = client.post(
        "/api/payments/create-checkout-session",
        json={"address": "123 Sneaker Boulevard, Bangalore"},
        headers=headers
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_create_checkout_session_success():
    """Ensure valid cart creates pending order and Stripe Checkout Session with DB price recalculation."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch available product and variant
    products = client.get("/api/products").json()
    product = products[0]
    variant = product["variants"][0]

    # 2. Add to cart
    add_res = client.post(
        "/api/cart/add",
        json={"productId": product["id"], "variantId": variant["id"], "quantity": 1},
        headers=headers
    )
    assert add_res.status_code == 200

    # 3. Mock Stripe Session.create with unique session ID
    mock_id = f"cs_test_mock_{uuid.uuid4().hex}"
    mock_session = MagicMock()
    mock_session.id = mock_id
    mock_session.url = f"https://checkout.stripe.com/c/pay/{mock_id}"

    with patch("stripe.checkout.Session.create", return_value=mock_session):
        response = client.post(
            "/api/payments/create-checkout-session",
            json={"address": "Penthouse 9, MG Road, Bangalore - 560001"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == mock_id
        assert data["checkout_url"] == f"https://checkout.stripe.com/c/pay/{mock_id}"
        assert "order_id" in data
        assert "order_number" in data

        # Verify DB records
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == data["order_id"]).first()
        assert order is not None
        assert order.payment_status == "PENDING"
        assert order.order_status == "pending"
        assert order.payment_method == "stripe"

        payment = db.query(Payment).filter(Payment.stripe_checkout_session_id == mock_id).first()
        assert payment is not None
        assert payment.order_id == order.id
        assert payment.payment_status == "PENDING"
        db.close()

def test_verify_session_paid():
    """Ensure verify-session endpoint retrieves live Stripe state and updates records."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    test_session_id = f"cs_test_verify_{uuid.uuid4().hex}"

    # Setup a pending payment in DB
    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        shipping_address_snapshot={"formatted_address": "Test Address"},
        subtotal=Decimal("2999.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("2999.00"),
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    payment = Payment(
        order_id=order.id,
        customer_id=user.id,
        stripe_checkout_session_id=test_session_id,
        amount=Decimal("2999.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.close()

    # Mock stripe retrieve
    mock_stripe_session = MagicMock()
    mock_stripe_session.payment_status = "paid"
    mock_stripe_session.status = "complete"
    mock_pi = MagicMock()
    mock_pi.id = f"pi_mock_{uuid.uuid4().hex[:10]}"
    mock_stripe_session.payment_intent = mock_pi

    with patch("stripe.checkout.Session.retrieve", return_value=mock_stripe_session):
        res = client.get(f"/api/payments/verify-session/{test_session_id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "PAID"
        assert data["order_status"] == "confirmed"

        # Verify DB updated
        db = SessionLocal()
        p = db.query(Payment).filter(Payment.stripe_checkout_session_id == test_session_id).first()
        assert p.payment_status == "PAID"
        assert p.stripe_payment_intent_id == mock_pi.id
        o = db.query(Order).filter(Order.id == p.order_id).first()
        assert o.payment_status == "PAID"
        assert o.order_status == "confirmed"
        db.close()

def test_verify_session_ownership_protection():
    """Ensure another customer cannot inspect or verify an order they do not own."""
    db = SessionLocal()
    # Ensure second user exists in DB with known credentials
    second_user = db.query(User).filter(User.email == "jane_owner_test@example.com").first()
    if not second_user:
        second_user = User(
            full_name="Jane Owner Test",
            email="jane_owner_test@example.com",
            password_hash=get_password_hash("password123"),
            is_email_verified=True,
            is_active=True,
            role_id=1
        )
        db.add(second_user)
        db.commit()
        db.refresh(second_user)

    john = db.query(User).filter(User.email == "john@example.com").first()
    test_session_id = f"cs_test_owner_{uuid.uuid4().hex}"
    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=john.id,
        shipping_address_snapshot={"formatted_address": "John's House"},
        subtotal=Decimal("1999.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("1999.00"),
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    payment = Payment(
        order_id=order.id,
        customer_id=john.id,
        stripe_checkout_session_id=test_session_id,
        amount=Decimal("1999.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.close()

    token_jane = get_auth_token("jane_owner_test@example.com", "password123")

    # Jane attempts to verify John's session -> must be forbidden (403)
    res = client.get(
        f"/api/payments/verify-session/{test_session_id}",
        headers={"Authorization": f"Bearer {token_jane}"}
    )
    assert res.status_code == 403

def test_webhook_invalid_signature():
    """Ensure webhook rejects requests with invalid signatures."""
    res = client.post(
        "/api/payments/webhook",
        content=b'{"type": "checkout.session.completed"}',
        headers={"stripe-signature": "invalid_sig_abc"}
    )
    assert res.status_code == 400

def test_webhook_checkout_session_completed():
    """Ensure checkout.session.completed updates payment and order status to PAID."""
    test_session_id = f"cs_test_wh_{uuid.uuid4().hex}"
    pi_id = f"pi_wh_{uuid.uuid4().hex[:10]}"

    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        shipping_address_snapshot={"formatted_address": "Webhook Road"},
        subtotal=Decimal("3500.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("3500.00"),
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    payment = Payment(
        order_id=order.id,
        customer_id=user.id,
        stripe_checkout_session_id=test_session_id,
        amount=Decimal("3500.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.close()

    mock_event = {
        "id": f"evt_{uuid.uuid4().hex[:12]}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": test_session_id,
                "payment_status": "paid",
                "payment_intent": pi_id
            }
        }
    }

    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        res = client.post(
            "/api/payments/webhook",
            content=b'{"id": "evt_test"}',
            headers={"stripe-signature": "valid_signature_header"}
        )
        assert res.status_code == 200
        assert res.json()["received"] is True

        # Check DB
        db = SessionLocal()
        p = db.query(Payment).filter(Payment.stripe_checkout_session_id == test_session_id).first()
        assert p.payment_status == "PAID"
        assert p.stripe_payment_intent_id == pi_id
        o = db.query(Order).filter(Order.id == p.order_id).first()
        assert o.payment_status == "PAID"
        assert o.order_status == "confirmed"
        db.close()

def test_webhook_duplicate_event_prevention():
    """Ensure duplicate webhook events are handled idempotently without re-processing."""
    test_session_id = f"cs_test_dup_{uuid.uuid4().hex}"
    pi_id = f"pi_dup_{uuid.uuid4().hex[:10]}"

    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        shipping_address_snapshot={"formatted_address": "Dup Road"},
        subtotal=Decimal("1200.00"),
        delivery_fee=Decimal("99.00"),
        total_amount=Decimal("1299.00"),
        order_status="confirmed",
        payment_status="PAID",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    payment = Payment(
        order_id=order.id,
        customer_id=user.id,
        stripe_checkout_session_id=test_session_id,
        stripe_payment_intent_id=pi_id,
        amount=Decimal("1299.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PAID"
    )
    db.add(payment)
    db.commit()
    db.close()

    mock_event = {
        "id": f"evt_dup_{uuid.uuid4().hex[:10]}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": test_session_id,
                "payment_status": "paid",
                "payment_intent": pi_id
            }
        }
    }

    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        res = client.post(
            "/api/payments/webhook",
            content=b'{"id": "evt_test_dup"}',
            headers={"stripe-signature": "valid_signature_header"}
        )
        assert res.status_code == 200
        assert res.json().get("notice") == "Event already processed"

def test_webhook_checkout_session_expired_restores_inventory():
    """Ensure session expiry marks order cancelled and restores variant inventory."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    variant = db.query(ProductVariant).first()
    if not variant.inventory:
        inv = Inventory(variant_id=variant.id, stock_quantity=10)
        db.add(inv)
        db.commit()
        db.refresh(variant)

    variant_id = variant.id
    initial_stock = variant.inventory.stock_quantity

    test_session_id = f"cs_test_expired_{uuid.uuid4().hex}"

    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        shipping_address_snapshot={"formatted_address": "Expiry Road"},
        subtotal=Decimal("1500.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("1500.00"),
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    oi = OrderItem(
        order_id=order.id,
        variant_id=variant_id,
        product_name="Test Sneaker",
        variant_snapshot={"size": "UK 8"},
        unit_price=Decimal("1500.00"),
        quantity=2,
        total_price=Decimal("3000.00")
    )
    db.add(oi)

    # Simulate stock was deducted during checkout
    variant.inventory.stock_quantity -= 2

    payment = Payment(
        order_id=order.id,
        customer_id=user.id,
        stripe_checkout_session_id=test_session_id,
        amount=Decimal("1500.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.close()

    mock_event = {
        "id": f"evt_exp_{uuid.uuid4().hex[:10]}",
        "type": "checkout.session.expired",
        "data": {
            "object": {
                "id": test_session_id
            }
        }
    }

    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        res = client.post(
            "/api/payments/webhook",
            content=b'{"id": "evt_test_expired"}',
            headers={"stripe-signature": "valid_signature_header"}
        )
        assert res.status_code == 200

        # Check DB updated and inventory restored
        db = SessionLocal()
        p = db.query(Payment).filter(Payment.stripe_checkout_session_id == test_session_id).first()
        assert p.payment_status == "CANCELLED"
        o = db.query(Order).filter(Order.id == p.order_id).first()
        assert o.payment_status == "CANCELLED"
        assert o.order_status == "cancelled"

        v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        assert v.inventory.stock_quantity == initial_stock
        db.close()

def test_cancel_pending_checkout_endpoint():
    """Ensure customer can cancel a pending checkout and release reserved stock."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    user = db.query(User).filter(User.email == "john@example.com").first()
    variant = db.query(ProductVariant).first()
    variant_id = variant.id
    initial_stock = variant.inventory.stock_quantity if variant.inventory else 10

    test_session_id = f"cs_test_cancel_{uuid.uuid4().hex}"

    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        shipping_address_snapshot={"formatted_address": "Cancel API Road"},
        subtotal=Decimal("2000.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("2000.00"),
        order_status="pending",
        payment_status="PENDING",
        payment_method="stripe"
    )
    db.add(order)
    db.flush()

    oi = OrderItem(
        order_id=order.id,
        variant_id=variant_id,
        product_name="Cancel Test Sneaker",
        variant_snapshot={"size": "UK 8"},
        unit_price=Decimal("2000.00"),
        quantity=1,
        total_price=Decimal("2000.00")
    )
    db.add(oi)
    if variant.inventory:
        variant.inventory.stock_quantity -= 1

    payment = Payment(
        order_id=order.id,
        customer_id=user.id,
        stripe_checkout_session_id=test_session_id,
        amount=Decimal("2000.00"),
        currency="inr",
        payment_method="stripe",
        payment_status="PENDING"
    )
    db.add(payment)
    db.commit()
    order_id = order.id
    db.close()

    res = client.post(f"/api/payments/cancel/{order_id}", headers=headers)
    assert res.status_code == 200
    assert "cancelled" in res.json()["message"].lower()

    db = SessionLocal()
    o = db.query(Order).filter(Order.id == order_id).first()
    assert o.payment_status == "CANCELLED"
    assert o.order_status == "cancelled"
    p = db.query(Payment).filter(Payment.order_id == order_id).first()
    assert p.payment_status == "CANCELLED"
    v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if v.inventory:
        assert v.inventory.stock_quantity == initial_stock
    db.close()

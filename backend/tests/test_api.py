import pytest
import app.models.entities
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine
from app.database.seed_data import run_seed

Base.metadata.create_all(bind=engine)
run_seed()

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_admin_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@blinkit.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"
    assert "token" in data

def test_customer_login():
    response = client.post("/api/auth/login", json={
        "email": "john@example.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "customer"
    assert "token" in data

def test_get_products_and_filters():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    first_product = products[0]
    assert "name" in first_product
    assert "price" in first_product
    assert "variants" in first_product
    assert len(first_product["variants"]) > 0

    # Test filtering by category
    cat_response = client.get("/api/products?category=Sneakers")
    assert cat_response.status_code == 200
    assert len(cat_response.json()) > 0

    # Test search
    search_response = client.get("/api/products?search=Nike")
    assert search_response.status_code == 200
    assert len(search_response.json()) > 0

def test_cart_and_checkout_flow():
    # 1. Login user
    login_res = client.post("/api/auth/login", json={
        "email": "john@example.com",
        "password": "admin123"
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get first product and variant
    products = client.get("/api/products").json()
    prod_id = products[0]["id"]
    variant = products[0]["variants"][0]
    variant_id = variant["id"]
    initial_stock = variant["stock"]

    # 3. Add to cart
    add_res = client.post(
        "/api/cart/add",
        json={"productId": prod_id, "variantId": variant_id, "quantity": 1},
        headers=headers
    )
    assert add_res.status_code == 200

    # 4. Fetch cart
    cart_res = client.get("/api/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_items = cart_res.json()
    assert len(cart_items) > 0

    # 5. Place order
    order_res = client.post(
        "/api/orders",
        json={
            "address": "42 Sneaker Street, Bangalore, Karnataka - 560001",
            "payment_method": "cod"
        },
        headers=headers
    )
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert "orderId" in order_data
    assert "orderNumber" in order_data

    # 6. Verify cart is cleared after order
    cart_after = client.get("/api/cart", headers=headers).json()
    assert len(cart_after) == 0

    # 7. Check user orders
    orders_res = client.get("/api/orders", headers=headers)
    assert orders_res.status_code == 200
    assert len(orders_res.json()) > 0

def test_wishlist_operations():
    login_res = client.post("/api/auth/login", json={
        "email": "john@example.com",
        "password": "admin123"
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    products = client.get("/api/products").json()
    prod_id = products[0]["id"]

    # Add to wishlist
    add_wish = client.post("/api/wishlist/add", json={"productId": prod_id}, headers=headers)
    assert add_wish.status_code == 200

    # Get wishlist
    get_wish = client.get("/api/wishlist", headers=headers)
    assert get_wish.status_code == 200
    assert any(p["id"] == prod_id for p in get_wish.json())

    # Remove from wishlist
    rem_wish = client.delete(f"/api/wishlist/remove/{prod_id}", headers=headers)
    assert rem_wish.status_code == 200

def test_admin_analytics_and_order_management():
    # Login admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@blinkit.com",
        "password": "admin123"
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch analytics
    analytics_res = client.get("/api/admin/analytics", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "total_products" in data
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "recent_orders" in data

    # Fetch customer list
    customers_res = client.get("/api/admin/customers", headers=headers)
    assert customers_res.status_code == 200
    assert len(customers_res.json()) > 0

def test_user_registration_and_otp_verification():
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    # 1. Register new customer
    reg_res = client.post("/api/auth/register", json={
        "name": "Jane Sneakerhead",
        "email": test_email,
        "password": "Password123!",
        "phone_number": "+919876543210"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["requiresOtp"] is True
    assert "token" not in reg_data

    # 2. Get OTP from database
    from app.models.entities import OtpVerification
    from app.database.session import SessionLocal
    db = SessionLocal()
    otp_record = db.query(OtpVerification).filter(OtpVerification.email == test_email).order_by(OtpVerification.created_at.desc()).first()
    assert otp_record is not None
    otp_code = otp_record.otp_code
    db.close()

    # 3. Verify OTP
    verify_res = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp_code": otp_code,
        "purpose": "registration"
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "token" in verify_data
    assert verify_data["email"] == test_email

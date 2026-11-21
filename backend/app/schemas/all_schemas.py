from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    token: str
    phone_number: Optional[str] = None
    profile_image_url: Optional[str] = None

class OtpRequest(BaseModel):
    email: EmailStr
    purpose: str = "registration"  # 'registration', 'login', 'password_reset'

class OtpVerify(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str = "registration"

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=6)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_image_url: Optional[str] = None

# --- ADDRESS SCHEMAS ---
class AddressBase(BaseModel):
    recipient_name: str
    phone_number: str
    street_address: str
    apartment_suite: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressOut(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- BRAND & CATEGORY SCHEMAS ---
class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandOut(BrandBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    slug: str
    banner_url: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    display_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# --- PRODUCT & VARIANT SCHEMAS ---
class VariantBase(BaseModel):
    sku: str
    size: str
    colour_name: str
    colour_hex: Optional[str] = None
    price_override: Optional[Decimal] = None
    stock_quantity: int = 0

class VariantOut(BaseModel):
    id: int
    product_id: int
    sku: str
    size: str
    colour_name: str
    colour_hex: Optional[str] = None
    price_override: Optional[Decimal] = None
    stock_quantity: int = 0
    is_active: bool

    class Config:
        from_attributes = True

class ProductImageOut(BaseModel):
    id: int
    image_key: str
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool
    display_order: int

    class Config:
        from_attributes = True

class ProductVideoOut(BaseModel):
    id: int
    video_key: str
    video_url: str
    poster_url: Optional[str] = None
    title: Optional[str] = None

    class Config:
        from_attributes = True

class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    category_id: int
    brand: Optional[str] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    base_price: Decimal
    discount_price: Optional[Decimal] = None
    image: Optional[str] = None  # primary image for backwards-compatibility with existing frontend
    images: List[ProductImageOut] = []
    videos: List[ProductVideoOut] = []
    variants: List[VariantOut] = []
    total_stock: int = 0
    is_featured: bool = False
    is_trending: bool = False
    is_new_arrival: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    category_id: int
    brand_id: Optional[int] = None
    description: Optional[str] = None
    base_price: Decimal
    discount_price: Optional[Decimal] = None
    specifications: Optional[Dict[str, Any]] = None
    is_featured: bool = False
    is_trending: bool = False
    is_new_arrival: bool = False
    sizes: List[str] = ["UK 7", "UK 8", "UK 9", "UK 10"]
    colours: List[str] = ["Default"]
    initial_stock_per_variant: int = 10
    image: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    discount_price: Optional[Decimal] = None
    is_featured: Optional[bool] = None
    is_trending: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_active: Optional[bool] = None
    image: Optional[str] = None

# --- CART SCHEMAS ---
class CartItemAdd(BaseModel):
    productId: int
    variantId: Optional[int] = None
    size: Optional[str] = None
    quantity: int = 1

class CartItemOut(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    name: str
    size: Optional[str] = None
    colour: Optional[str] = None
    price: Decimal
    image: Optional[str] = None
    stock: int
    quantity: int

    class Config:
        from_attributes = True

# --- WISHLIST SCHEMAS ---
class WishlistItemAdd(BaseModel):
    productId: int

class WishlistOut(BaseModel):
    id: int
    items: List[ProductOut] = []

# --- ORDER SCHEMAS ---
class OrderItemIn(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    size: Optional[str] = None
    quantity: int
    price: Decimal

class OrderCreate(BaseModel):
    orderItems: Optional[List[Dict[str, Any]]] = None
    address: Optional[str] = None
    address_id: Optional[int] = None
    totalPrice: Optional[Decimal] = None
    coupon_code: Optional[str] = None
    payment_method: str = "cod"

class OrderItemOut(BaseModel):
    id: int
    variant_id: int
    product_name: str
    size: Optional[str] = None
    colour: Optional[str] = None
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    image: Optional[str] = None

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    address: str
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    total_price: Decimal
    order_status: str
    payment_status: str
    payment_method: str
    items: List[OrderItemOut] = []
    created_at: datetime

class OrderStatusUpdate(BaseModel):
    status: str

# --- REVIEW SCHEMAS ---
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime

# --- ANALYTICS SCHEMAS ---
class AnalyticsSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    low_stock_products: int
    recent_orders: List[OrderOut] = []

# --- PAYMENT SCHEMAS ---
class CheckoutSessionCreate(BaseModel):
    address: Optional[str] = None
    address_id: Optional[int] = None
    coupon_code: Optional[str] = None
    orderItems: Optional[List[Dict[str, Any]]] = None

class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str
    order_id: int
    order_number: str

class PaymentVerifyResponse(BaseModel):
    status: str
    order_id: int
    order_number: str
    amount: float
    currency: str
    payment_method: str
    stripe_session_id: Optional[str] = None
    order_status: str
    shipping_address: Optional[Any] = None


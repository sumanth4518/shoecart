from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, case
from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.entities import Product, ProductVariant, Inventory, Order, OrderItem, User, Role
from app.api.v1.endpoints.orders import serialize_order

router = APIRouter()

@router.get("/analytics")
def get_dashboard_analytics(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Provides key performance indicators, revenue stats, order status breakdown, and sales trends with zero N+1 latency."""
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0
    total_customers = db.query(func.count(User.id)).scalar() or 0
    low_stock_count = db.query(func.count(Inventory.id)).filter(Inventory.stock_quantity <= 5).scalar() or 0

    # Aggregate all order statistics (counts and revenue) in ONE single round-trip GROUP BY query
    order_stats = (
        db.query(
            Order.order_status,
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue")
        )
        .group_by(Order.order_status)
        .all()
    )

    status_counts = {stat[0]: stat[1] for stat in order_stats}
    total_orders = sum(status_counts.values())
    total_revenue = float(sum(stat[2] for stat in order_stats if stat[0] != "cancelled"))

    pending_orders = status_counts.get("pending", 0)
    processing_orders = status_counts.get("processing", 0)
    shipped_orders = status_counts.get("shipped", 0)
    delivered_orders = status_counts.get("delivered", 0)
    cancelled_orders = status_counts.get("cancelled", 0)

    # Recent orders loaded with eager relationships to avoid N+1 queries
    recent_orders_list = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            selectinload(Order.items).joinedload(OrderItem.variant)
        )
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    # Low stock inventory items with details
    low_stock_variants = (
        db.query(Inventory, ProductVariant, Product)
        .join(ProductVariant, Inventory.variant_id == ProductVariant.id)
        .join(Product, ProductVariant.product_id == Product.id)
        .filter(Inventory.stock_quantity <= 5)
        .limit(10)
        .all()
    )

    low_stock_details = [
        {
            "variant_id": inv.variant_id,
            "product_name": prod.name,
            "size": var.size,
            "colour": var.colour_name,
            "stock": inv.stock_quantity,
            "sku": var.sku
        }
        for inv, var, prod in low_stock_variants
    ]

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "low_stock_products": low_stock_count,
        "low_stock_details": low_stock_details,
        "recent_orders": [serialize_order(o) for o in recent_orders_list]
    }

@router.get("/customers")
def get_all_customers(
    search: str = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists registered customer accounts with order counts and status in 2 round-trips total."""
    query = db.query(User).join(User.role).filter(Role.name != "admin")

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(User.full_name.ilike(s) | User.email.ilike(s))

    customers = query.order_by(User.created_at.desc()).all()

    # Pre-aggregate order counts and revenue in a single query across all customers
    stats = (
        db.query(
            Order.user_id,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(case((Order.order_status != "cancelled", Order.total_amount), else_=0)), 0).label("total_spent")
        )
        .group_by(Order.user_id)
        .all()
    )
    stats_map = {s[0]: {"order_count": s[1], "total_spent": float(s[2])} for s in stats}

    results = []
    for c in customers:
        c_stats = stats_map.get(c.id, {"order_count": 0, "total_spent": 0.0})
        results.append({
            "id": c.id,
            "name": c.full_name,
            "email": c.email,
            "phone": c.phone_number,
            "is_active": c.is_active,
            "is_email_verified": c.is_email_verified,
            "order_count": c_stats["order_count"],
            "total_spent": c_stats["total_spent"],
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return results

@router.put("/customers/{customer_id}/toggle-status")
def toggle_customer_status(customer_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin endpoint to activate or deactivate a customer account."""
    user = db.query(User).filter(User.id == customer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"Customer account {'activated' if user.is_active else 'deactivated'}"}

@router.put("/inventory/{variant_id}")
def update_variant_inventory(
    variant_id: int,
    stock: int = Query(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Updates inventory for a specific footwear size variant."""
    inv = db.query(Inventory).filter(Inventory.variant_id == variant_id).first()
    if not inv:
        inv = Inventory(variant_id=variant_id, stock_quantity=stock)
        db.add(inv)
    else:
        inv.stock_quantity = stock
    db.commit()
    return {"message": "Inventory updated successfully"}

@router.get("/email/test-smtp")
def test_smtp_diagnostic(
    recipient: str = Query(None),
    current_admin: User = Depends(get_current_admin)
):
    """
    Diagnostic endpoint for administrators to test the live SMTP email configuration.
    Returns the exact connection status, handshake result, and diagnostic information.
    """
    from app.services.email_service import email_service
    test_target = recipient.strip() if recipient else current_admin.email
    result = email_service.test_smtp_connection(test_recipient=test_target)
    return result

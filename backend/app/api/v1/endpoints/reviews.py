from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.entities import Review, Order, OrderItem, ProductVariant, User
from app.schemas.all_schemas import ReviewCreate, ReviewOut

router = APIRouter()

@router.get("/product/{product_id}")
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Fetches approved customer reviews and overall rating metrics for a product."""
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).order_by(Review.created_at.desc()).all()

    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 5.0

    return {
        "average_rating": avg_rating,
        "total_reviews": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "product_id": r.product_id,
                "user_name": r.user.full_name if r.user else "Verified Customer",
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "is_verified_purchase": r.is_verified_purchase,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reviews
        ]
    }

@router.post("")
@router.post("/")
def submit_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits a customer review for a footwear product, verifying purchase history."""
    existing = db.query(Review).filter(
        Review.product_id == payload.product_id,
        Review.user_id == current_user.id
    ).first()

    # Check verified purchase
    verified = db.query(OrderItem).join(Order).join(ProductVariant).filter(
        Order.user_id == current_user.id,
        ProductVariant.product_id == payload.product_id
    ).first() is not None

    if existing:
        existing.rating = payload.rating
        existing.title = payload.title
        existing.comment = payload.comment
        existing.is_verified_purchase = verified
    else:
        new_review = Review(
            product_id=payload.product_id,
            user_id=current_user.id,
            rating=payload.rating,
            title=payload.title,
            comment=payload.comment,
            is_verified_purchase=verified,
            is_approved=True
        )
        db.add(new_review)

    db.commit()
    return {"message": "Review submitted successfully"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.entities import Category, User
from app.schemas.all_schemas import CategoryCreate, CategoryOut

router = APIRouter()

@router.get("", response_model=list[CategoryOut])
@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """Retrieves all footwear categories."""
    return db.query(Category).filter(Category.is_active == True).order_by(Category.display_order.asc(), Category.name.asc()).all()

@router.post("", response_model=CategoryOut)
@router.post("/", response_model=CategoryOut)
def create_category(payload: CategoryCreate, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin endpoint to create a new category."""
    existing = db.query(Category).filter(Category.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    cat = Category(
        name=payload.name,
        slug=payload.slug,
        banner_url=payload.banner_url,
        description=payload.description,
        parent_id=payload.parent_id,
        display_order=payload.display_order
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.entities import Brand, User
from app.schemas.all_schemas import BrandCreate, BrandOut

router = APIRouter()

@router.get("", response_model=list[BrandOut])
@router.get("/", response_model=list[BrandOut])
def list_brands(db: Session = Depends(get_db)):
    """Retrieves all active footwear brands."""
    return db.query(Brand).filter(Brand.is_active == True).order_by(Brand.name.asc()).all()

@router.post("", response_model=BrandOut)
@router.post("/", response_model=BrandOut)
def create_brand(payload: BrandCreate, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin endpoint to register a new brand."""
    existing = db.query(Brand).filter(Brand.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand slug already exists")
    
    brand = Brand(
        name=payload.name,
        slug=payload.slug,
        logo_url=payload.logo_url,
        description=payload.description
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand

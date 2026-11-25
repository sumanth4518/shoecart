from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.entities import Address, User
from app.schemas.all_schemas import AddressCreate, AddressOut

router = APIRouter()

@router.get("", response_model=list[AddressOut])
@router.get("/", response_model=list[AddressOut])
def list_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves all saved delivery addresses for authenticated customer."""
    return db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()

@router.post("", response_model=AddressOut)
@router.post("/", response_model=AddressOut)
def add_address(payload: AddressCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Saves a new delivery address for the customer."""
    if payload.is_default:
        # Unset previous defaults
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        recipient_name=payload.recipient_name,
        phone_number=payload.phone_number,
        street_address=payload.street_address,
        apartment_suite=payload.apartment_suite,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        is_default=payload.is_default
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address

@router.put("/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing delivery address for customer."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    addr.recipient_name = payload.recipient_name
    addr.phone_number = payload.phone_number
    addr.street_address = payload.street_address
    addr.apartment_suite = payload.apartment_suite
    addr.city = payload.city
    addr.state = payload.state
    addr.postal_code = payload.postal_code
    addr.country = payload.country
    addr.is_default = payload.is_default

    db.commit()
    db.refresh(addr)
    return addr

@router.delete("/{address_id}")
def delete_address(address_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes an address owned by customer."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted"}

@router.put("/{address_id}/default")
def set_default_address(address_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sets the designated address as default shipping destination."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    
    db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    addr.is_default = True
    db.commit()
    return {"message": "Default address updated"}

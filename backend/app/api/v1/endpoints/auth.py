from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_otp_code
)
from app.core.dependencies import get_current_user
from app.models.entities import User, Role, OtpVerification, Cart, Wishlist
from app.schemas.all_schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    OtpRequest,
    OtpVerify,
    PasswordResetConfirm
)
from app.services.email_service import email_service

router = APIRouter()

@router.post("/register")
def register_user(
    user_in: UserRegister,
    db: Session = Depends(get_db)
):
    """Registers a new user and dispatches a 6-digit OTP verification code via custom SMTP."""
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if user and user.is_email_verified:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    customer_role = db.query(Role).filter(Role.name == "customer").first()
    if not customer_role:
        customer_role = Role(name="customer", description="Standard customer role")
        db.add(customer_role)
        db.flush()

    if not user:
        user = User(
            full_name=user_in.name,
            email=user_in.email.lower(),
            password_hash=get_password_hash(user_in.password),
            phone_number=user_in.phone_number,
            role_id=customer_role.id,
            is_email_verified=False,
            is_active=True
        )
        db.add(user)
        db.flush()
        db.add(Cart(user_id=user.id))
        db.add(Wishlist(user_id=user.id))
    else:
        # Update existing unverified user info & password
        user.full_name = user_in.name
        user.password_hash = get_password_hash(user_in.password)
        user.phone_number = user_in.phone_number

    # Generate 6-digit OTP code & dispatch email
    otp_code = generate_otp_code(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    otp_entry = OtpVerification(
        email=user.email,
        otp_code=otp_code,
        purpose="registration",
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()

    # Dispatches immediately in background daemon thread (non-blocking)
    email_service.dispatch_otp_background(user.email, otp_code, "registration")

    # Return response WITHOUT token so user is directed to the 6-digit OTP screen
    return {
        "email": user.email,
        "requiresOtp": True,
        "message": f"Verification code sent to {user.email}. Please verify to complete account activation."
    }

@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticates users directly against the database with secure bcrypt and JWT."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "customer"
    token = create_access_token({"id": user.id, "role": role_name, "email": user.email})

    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": role_name,
        "token": token,
        "phone_number": user.phone_number,
        "profile_image_url": user.profile_image_url
    }

@router.post("/forgot-password")
def forgot_password(
    payload: OtpRequest,
    db: Session = Depends(get_db)
):
    """Initiates password reset via custom SMTP OTP email."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        return {"message": "If this email is registered, a password reset code has been sent."}

    otp_code = generate_otp_code(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    otp_entry = OtpVerification(
        email=user.email,
        otp_code=otp_code,
        purpose="password_reset",
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()

    email_service.dispatch_otp_background(user.email, otp_code, "password_reset")
    return {"message": "Password reset code dispatched"}

@router.post("/reset-password")
def reset_password(
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Resets password via verified OTP."""
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.email == payload.email.lower(),
            OtpVerification.otp_code == payload.otp_code,
            OtpVerification.purpose == "password_reset",
            OtpVerification.is_used == False,
            OtpVerification.expires_at > now
        )
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    user.password_hash = get_password_hash(payload.new_password)
    otp_record.is_used = True
    db.commit()

    return {"message": "Password has been successfully reset. Please log in with your new password."}

@router.post("/verify-otp")
def verify_otp(payload: OtpVerify, db: Session = Depends(get_db)):
    """Verifies an OTP code for registration, login, or password reset."""
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.email == payload.email.lower(),
            OtpVerification.otp_code == payload.otp_code,
            OtpVerification.purpose == payload.purpose,
            OtpVerification.is_used == False,
            OtpVerification.expires_at > now
        )
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

    otp_record.is_used = True
    
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user and payload.purpose == "registration":
        user.is_email_verified = True

    db.commit()

    role = db.query(Role).filter(Role.id == user.role_id).first() if user else None
    role_name = role.name if role else "customer"
    token = create_access_token({"id": user.id, "role": role_name, "email": user.email}) if user else ""

    return {
        "id": user.id if user else None,
        "name": user.full_name if user else "",
        "email": user.email if user else payload.email,
        "role": role_name,
        "token": token,
        "phone_number": user.phone_number if user else None,
        "profile_image_url": user.profile_image_url if user else None,
        "message": "OTP verified successfully. Account activated!"
    }

@router.post("/resend-otp")
def resend_otp(
    payload: OtpRequest,
    db: Session = Depends(get_db)
):
    """Resends a new verification OTP code with expiration."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email")

    otp_code = generate_otp_code(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    otp_entry = OtpVerification(
        email=user.email,
        otp_code=otp_code,
        purpose=payload.purpose,
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()

    email_service.dispatch_otp_background(user.email, otp_code, payload.purpose)
    return {"message": "A new verification code has been dispatched"}

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves authenticated user's profile and active role."""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "role": role.name if role else "customer",
        "profile_image_url": current_user.profile_image_url,
        "is_email_verified": current_user.is_email_verified,
        "created_at": current_user.created_at
    }

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.entities import User, Role, Cart, Wishlist

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Authenticates Bearer token using Neon Auth sessions or fallback JWT."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials

    # 1. Check Neon Auth native session (Better Auth in PostgreSQL)
    try:
        neon_session = db.execute(text("""
            SELECT s.token, u.email, u.name, u.role, u."emailVerified"
            FROM neon_auth.session s 
            JOIN neon_auth.user u ON s."userId" = u.id 
            WHERE s.token = :token AND s."expiresAt" > NOW();
        """), {"token": token}).fetchone()

        if neon_session:
            _, email, name, role_name, is_verified = neon_session
            
            # Ensure corresponding public.users record exists
            user = db.query(User).filter(User.email == email.lower()).first()
            target_role = "admin" if role_name == "admin" else "customer"
            role = db.query(Role).filter(Role.name == target_role).first()
            if not role:
                role = Role(name=target_role, description=f"{target_role} role")
                db.add(role)
                db.commit()
                db.refresh(role)

            if not user:
                user = User(
                    full_name=name or email.split('@')[0],
                    email=email.lower(),
                    password_hash="[managed_by_neon_auth]",
                    role_id=role.id,
                    is_email_verified=bool(is_verified),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                db.add(Cart(user_id=user.id))
                db.add(Wishlist(user_id=user.id))
                db.commit()
            else:
                # Keep role in sync with Neon Auth
                if user.role_id != role.id:
                    user.role_id = role.id
                    db.commit()

            if not user.is_active:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

            return user
    except Exception:
        # If neon_auth schema not present in local test environments, continue to JWT fallback
        pass

    # 2. Fallback to standard JWT access token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        
    return user

def get_current_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Ensures the authenticated user has administrative privileges."""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role or role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user

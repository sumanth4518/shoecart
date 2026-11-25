import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AURA KICKS - Premium Footwear E-Commerce"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "supersecretkey_blinkit_clone_123_footwear_production_secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/blinkit_footwear"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aura-kicks-frontend.onrender.com",
        "https://aura-kicks-adminfront.onrender.com",
        "https://aura-kicks-backend.onrender.com",
        "*"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str or v_str == "*":
                return ["*"]
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    v_str = v_str.strip("[]")
            origins = []
            for item in v_str.split(","):
                cleaned = item.strip().strip("'\"")
                if cleaned:
                    origins.append(cleaned)
            return origins if origins else ["*"]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if item]
        return ["*"]

    # Neon Auth (Managed Better Auth)
    NEON_AUTH_URL: str = ""
    NEON_AUTH_SECRET: str = ""

    # Neon Object Storage / AWS S3 Compatible
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_ENDPOINT_URL_S3: str = ""
    AWS_REGION: str = "us-east-1"
    NEON_STORAGE_BUCKET: str = "premium-footwear"

    # Stripe Payment Gateway (Test Mode)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    # Email / OTP
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USER: str = os.getenv("EMAIL_USER", "sumanthguttireddy@gmail.com")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "qrgynzezrlchwzbn")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "sumanthguttireddy@gmail.com")
    OTP_EXPIRY_MINUTES: int = 10
    OTP_COOLDOWN_SECONDS: int = 60

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_REGISTER: str = "5/minute"
    RATE_LIMIT_OTP: str = "5/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

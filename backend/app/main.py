import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
# Import all models to ensure they are registered on Base.metadata
import app.models.entities
from app.models.entities import Product
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal, get_db
from app.api.v1.router import api_router
from app.database.seed_data import run_seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Fast, resilient startup lifespan for serverless and free-tier environments."""
    try:
        db = SessionLocal()
        # Fast non-blocking check: only seed if the product catalog is completely empty
        has_products = db.query(Product.id).first() is not None
        db.close()
        if not has_products:
            print("[Lifespan] Initializing database schema and seed data...")
            Base.metadata.create_all(bind=engine)
            run_seed()
            print("[Lifespan] Database initialization complete.")
        else:
            print("[Lifespan] Database is already initialized and seeded with products.")
    except Exception as e:
        print(f"[Lifespan Notice] DB check: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade API for Premium Footwear E-Commerce Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware with explicit origins and onrender regex matching
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse, Response
import boto3

# Serve uploaded static media files with on-demand Neon S3 fallback cache
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(uploads_dir, exist_ok=True)

@app.get("/uploads/{file_path:path}")
async def serve_upload_file(file_path: str):
    """Serves media files with automatic on-demand Neon S3 caching."""
    local_file = os.path.abspath(os.path.join(uploads_dir, file_path))
    # 1. If exists locally, serve instantly with client caching headers
    if os.path.exists(local_file) and os.path.isfile(local_file):
        return FileResponse(local_file, headers={"Cache-Control": "public, max-age=604800"})

    # 2. On-demand pull from Neon Object Storage if not cached locally
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and settings.AWS_ENDPOINT_URL_S3:
        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                endpoint_url=settings.AWS_ENDPOINT_URL_S3,
                region_name=settings.AWS_REGION
            )
            s3_obj = s3.get_object(Bucket=settings.NEON_STORAGE_BUCKET, Key=file_path)
            content = s3_obj['Body'].read()
            content_type = s3_obj.get('ContentType', 'image/jpeg')

            os.makedirs(os.path.dirname(local_file), exist_ok=True)
            with open(local_file, "wb") as f:
                f.write(content)

            return Response(content=content, media_type=content_type, headers={"Cache-Control": "public, max-age=604800"})
        except Exception as e:
            print(f"[Media Proxy] S3 fetch error for {file_path}: {e}")

    return Response(status_code=404, content="Media not found")

# Mount API V1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.api_route("/", methods=["GET", "HEAD"], tags=["Health"])
@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
@app.api_route("/api/health", methods=["GET", "HEAD"], tags=["Health"])
@app.api_route("/api/warmup", methods=["GET", "HEAD"], tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Fast warmup and health check endpoint to wake up serverless & free-tier cloud containers."""
    db_status = "idle"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "aura-kicks-backend",
        "database": db_status,
        "warm": True,
        "message": "FastAPI Footwear Engine is running",
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)

from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_admin
from app.models.entities import User
from app.services.storage_service import storage_service

router = APIRouter()

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin)
):
    """Uploads an image to Neon Object Storage (S3-compatible)."""
    key, url = await storage_service.upload_file(file, folder="products", is_video=False)
    return {"image_key": key, "image_url": url}

@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin)
):
    """Uploads a product video to Neon Object Storage (S3-compatible)."""
    key, url = await storage_service.upload_file(file, folder="videos", is_video=True)
    return {"video_key": key, "video_url": url}

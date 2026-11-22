import os
import uuid
import time
import boto3
from botocore.exceptions import ClientError
from botocore.client import Config
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class NeonStorageService:
    """Neon Object Storage (S3-compatible) service for handling media uploads."""

    def __init__(self):
        self.bucket_name = settings.NEON_STORAGE_BUCKET
        self.endpoint_url = settings.AWS_ENDPOINT_URL_S3
        self.access_key = settings.AWS_ACCESS_KEY_ID
        self.secret_key = settings.AWS_SECRET_ACCESS_KEY
        self.region = settings.AWS_REGION or 'us-east-1'
        self.is_configured = bool(self.access_key and self.secret_key and self.endpoint_url)
        self._url_cache = {}

        if self.is_configured:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                endpoint_url=self.endpoint_url,
                region_name=self.region,
                config=Config(signature_version='s3v4')
            )
        else:
            self.s3_client = None

        # Local storage fallback directory
        self.local_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))
        os.makedirs(self.local_upload_dir, exist_ok=True)

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
    MAX_IMAGE_SIZE_MB = 10
    MAX_VIDEO_SIZE_MB = 100

    def validate_file(self, file: UploadFile, is_video: bool = False) -> None:
        """Validates file mime type and extension."""
        allowed = self.ALLOWED_VIDEO_TYPES if is_video else self.ALLOWED_IMAGE_TYPES
        if file.content_type not in allowed:
            types_str = "video (mp4, webm)" if is_video else "image (jpeg, png, webp, gif)"
            raise HTTPException(status_code=400, detail=f"Invalid file type {file.content_type}. Only {types_str} allowed.")

    async def upload_file(self, file: UploadFile, folder: str = "products", is_video: bool = False) -> Tuple[str, str]:
        """
        Uploads file to Neon Object Storage if configured, or local static uploads folder with fallback.
        Returns: (object_key, public_url)
        """
        self.validate_file(file, is_video=is_video)
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        object_key = f"{folder}/{unique_name}"

        content = await file.read()
        max_bytes = (self.MAX_VIDEO_SIZE_MB if is_video else self.MAX_IMAGE_SIZE_MB) * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size.")

        # 1. Neon S3 Upload
        if self.is_configured and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=object_key,
                    Body=content,
                    ContentType=file.content_type
                )
                url = f"{self.endpoint_url.rstrip('/')}/{self.bucket_name}/{object_key}"
                return object_key, url
            except ClientError as e:
                print(f"[Neon Storage Warning] S3 upload error: {e}. Falling back to local storage.")

        # 2. Local Fallback (preserves zero-downtime development)
        local_folder = os.path.join(self.local_upload_dir, folder)
        os.makedirs(local_folder, exist_ok=True)
        local_path = os.path.join(local_folder, unique_name)
        with open(local_path, "wb") as f:
            f.write(content)

        public_url = f"/uploads/{folder}/{unique_name}"
        return object_key, public_url

    def delete_file(self, object_key: str) -> bool:
        """Deletes file from Neon Object Storage or local directory."""
        if self.is_configured and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_key)
                if object_key in self._url_cache:
                    del self._url_cache[object_key]
                return True
            except ClientError:
                pass
        
        # Check local path
        local_path = os.path.join(self.local_upload_dir, object_key)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
                return True
            except Exception:
                pass
        return False

    def get_presigned_url(self, object_key: str, expires_in: int = 604800) -> str:
        """Generates an AWS SigV4 presigned URL directly to Neon Object Storage (valid for 7 days) with in-memory caching."""
        if not object_key or not isinstance(object_key, str) or not object_key.strip():
            return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"

        object_key = object_key.strip()

        # Clean any query parameters from existing URLs (e.g. expired signatures)
        clean_target = object_key.split("?")[0]

        # Determine if this belongs to our Neon storage bucket
        is_neon_s3 = False
        clean_key = clean_target

        if f"/{self.bucket_name}/" in clean_target:
            is_neon_s3 = True
            clean_key = clean_target.split(f"/{self.bucket_name}/", 1)[-1]
        elif self.endpoint_url and self.endpoint_url in clean_target:
            is_neon_s3 = True
            clean_key = clean_target.replace(self.endpoint_url, "").lstrip("/")
            if clean_key.startswith(f"{self.bucket_name}/"):
                clean_key = clean_key[len(self.bucket_name) + 1:]
        elif "neon.tech" in clean_target and "/products/" in clean_target:
            is_neon_s3 = True
            clean_key = "products/" + clean_target.split("/products/", 1)[-1]
        elif clean_target.startswith("/uploads/"):
            clean_key = clean_target.replace("/uploads/", "")
        elif not clean_target.startswith("http://") and not clean_target.startswith("https://"):
            # Relative key like "products/uuid.jpg"
            is_neon_s3 = True
            clean_key = clean_target
        else:
            # External URL (e.g. Unsplash, external CDN) -> return as-is
            return object_key

        clean_key = clean_key.lstrip("/")

        # Check in-memory URL cache (1 hour TTL)
        now = time.time()
        cached = self._url_cache.get(clean_key)
        if cached and cached[1] > now:
            return cached[0]

        if is_neon_s3 and self.is_configured and self.s3_client:
            try:
                presigned = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': clean_key},
                    ExpiresIn=expires_in
                )
                self._url_cache[clean_key] = (presigned, now + 3600)
                return presigned
            except Exception as e:
                print(f"[Neon Storage Presign Warning] {e}")

        # If the original key was already a valid HTTP(S) URL, prefer returning it directly
        if object_key.startswith("http://") or object_key.startswith("https://"):
            return object_key

        # Local uploads fallback if file exists on disk
        local_path = os.path.join(self.local_upload_dir, clean_key)
        if os.path.exists(local_path):
            return f"/uploads/{clean_key}"

        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"

storage_service = NeonStorageService()

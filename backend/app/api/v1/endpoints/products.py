import time
import uuid
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, desc, asc
from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.entities import Product, ProductVariant, Inventory, ProductImage, ProductVideo, Category, Brand, User
from app.services.storage_service import storage_service

router = APIRouter()

# In-memory catalogue cache for near-instant sub-5ms responses
_catalog_cache = {}
_CACHE_TTL = 30  # seconds

def invalidate_catalog_cache():
    """Invalidates the in-memory catalogue cache across all endpoints."""
    global _catalog_cache
    _catalog_cache.clear()

def get_product_eager_options():
    """Returns standardized SQLAlchemy eager loading options to prevent N+1 query explosion."""
    return [
        selectinload(Product.category),
        selectinload(Product.brand),
        selectinload(Product.images),
        selectinload(Product.videos),
        selectinload(Product.variants).joinedload(ProductVariant.inventory)
    ]

def serialize_product(p: Product) -> dict:
    primary_img = None
    try:
        primary_img = next((storage_service.get_presigned_url(img.image_url) for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = storage_service.get_presigned_url(p.images[0].image_url)
    except Exception:
        primary_img = None

    if not primary_img:
        primary_img = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"

    total_stock = sum(v.inventory.stock_quantity for v in p.variants if v.inventory) if p.variants else 0

    serialized_images = []
    if p.images:
        for img in p.images:
            try:
                url = storage_service.get_presigned_url(img.image_url)
            except Exception:
                url = img.image_url or "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
            serialized_images.append({
                "id": img.id,
                "image_key": img.image_key,
                "image_url": url,
                "is_primary": img.is_primary,
                "display_order": img.display_order
            })

    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "description": p.description or "",
        "price": float(p.discount_price if p.discount_price else p.base_price),
        "base_price": float(p.base_price),
        "discount_price": float(p.discount_price) if p.discount_price else None,
        "discount_percent": round(((p.base_price - p.discount_price) / p.base_price) * 100) if p.discount_price and p.base_price > p.discount_price else 0,
        "category": p.category.name if p.category else "Footwear",
        "category_id": p.category_id,
        "brand": p.brand.name if p.brand else "AURA",
        "brand_id": p.brand_id,
        "stock": total_stock,
        "image": primary_img,
        "images": serialized_images,
        "videos": [
            {
                "id": v.id,
                "video_key": v.video_key,
                "video_url": v.video_url,
                "poster_url": v.poster_url,
                "title": v.title
            }
            for v in p.videos
        ],
        "variants": [
            {
                "id": v.id,
                "product_id": v.product_id,
                "sku": v.sku,
                "size": v.size,
                "colour_name": v.colour_name,
                "colour_hex": v.colour_hex,
                "price": float(v.price_override if v.price_override else (p.discount_price if p.discount_price else p.base_price)),
                "stock": v.inventory.stock_quantity if v.inventory else 0,
                "is_active": v.is_active
            }
            for v in p.variants if v.is_active
        ],
        "specifications": p.specifications or {},
        "is_featured": p.is_featured,
        "is_trending": p.is_trending,
        "is_new_arrival": p.is_new_arrival,
        "created_at": p.created_at.isoformat() if p.created_at else None
    }

@router.get("")
@router.get("/")
def get_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    colour: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_trending: Optional[bool] = Query(None),
    is_new_arrival: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"), # newest, price_asc, price_desc, name_asc
    db: Session = Depends(get_db)
):
    """Fetches footwear catalogue with multi-facet filters, eager loading, and in-memory caching."""
    # Normalize parameters for direct function invocation as well as FastAPI DI
    search = search if isinstance(search, str) else None
    category = category if isinstance(category, str) else None
    brand = brand if isinstance(brand, str) else None
    size = size if isinstance(size, str) else None
    colour = colour if isinstance(colour, str) else None
    min_price = min_price if isinstance(min_price, (int, float)) else None
    max_price = max_price if isinstance(max_price, (int, float)) else None
    is_featured = is_featured if isinstance(is_featured, bool) else None
    is_trending = is_trending if isinstance(is_trending, bool) else None
    is_new_arrival = is_new_arrival if isinstance(is_new_arrival, bool) else None
    sort_by = sort_by if isinstance(sort_by, str) else "newest"

    cache_key = f"{search}_{category}_{brand}_{size}_{colour}_{min_price}_{max_price}_{is_featured}_{is_trending}_{is_new_arrival}_{sort_by}"
    now = time.time()
    if cache_key in _catalog_cache:
        cached_data, exp = _catalog_cache[cache_key]
        if exp > now:
            return cached_data

    eager_opts = get_product_eager_options()
    query = db.query(Product).options(*eager_opts).filter(Product.is_active == True)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )

    if category and category.lower() != "all":
        cat_clean = category.strip()
        query = query.join(Product.category).filter(
            or_(
                Category.name.ilike(cat_clean),
                Category.name.ilike(f"%{cat_clean}%"),
                Category.slug == cat_clean.lower(),
                Category.slug.ilike(f"%{cat_clean.lower()}%")
            )
        )

    if brand:
        query = query.join(Product.brand).filter(
            or_(Brand.name.ilike(brand), Brand.slug == brand.lower())
        )

    if min_price is not None:
        query = query.filter(Product.base_price >= min_price)

    if max_price is not None:
        query = query.filter(Product.base_price <= max_price)

    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)

    if is_trending is not None:
        query = query.filter(Product.is_trending == is_trending)

    if is_new_arrival is not None:
        query = query.filter(Product.is_new_arrival == is_new_arrival)

    if size or colour:
        query = query.join(Product.variants)
        if size:
            size_clean = size.strip()
            size_patterns = [size_clean]
            if not size_clean.upper().startswith("UK") and size_clean.isdigit():
                size_patterns.append(f"UK {size_clean}")
                size_patterns.append(f"UK{size_clean}")
            elif size_clean.upper().startswith("UK"):
                num_part = size_clean[2:].strip()
                size_patterns.append(f"UK {num_part}")
                size_patterns.append(f"UK{num_part}")
                size_patterns.append(num_part)

            size_patterns = list(set(size_patterns))
            query = query.filter(
                or_(*[ProductVariant.size.ilike(p) for p in size_patterns])
            )
        if colour:
            query = query.filter(ProductVariant.colour_name.ilike(f"%{colour}%"))

    if size or colour:
        # Clear ORDER BY before SELECT DISTINCT to prevent PostgreSQL InvalidColumnReference
        product_ids = [pid for (pid,) in query.order_by(None).with_entities(Product.id).distinct().all()]
        if not product_ids:
            products = []
        else:
            base_query = db.query(Product).options(*eager_opts).filter(Product.id.in_(product_ids))
            if sort_by == "price_asc":
                products = base_query.order_by(asc(Product.base_price)).all()
            elif sort_by == "price_desc":
                products = base_query.order_by(desc(Product.base_price)).all()
            elif sort_by == "name_asc":
                products = base_query.order_by(asc(Product.name)).all()
            else:
                products = base_query.order_by(desc(Product.created_at)).all()
    else:
        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(asc(Product.base_price))
        elif sort_by == "price_desc":
            query = query.order_by(desc(Product.base_price))
        elif sort_by == "name_asc":
            query = query.order_by(asc(Product.name))
        else:
            query = query.order_by(desc(Product.created_at))
        products = query.distinct().all()

    result = [serialize_product(p) for p in products]
    _catalog_cache[cache_key] = (result, now + _CACHE_TTL)
    return result

@router.get("/{product_id}")
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    """Fetches a single product by ID with full variant and gallery details via eager loading."""
    product = (
        db.query(Product)
        .options(*get_product_eager_options())
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)

@router.post("")
@router.post("/")
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(""),
    price: float = Form(...),
    category: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    brand_id: Optional[int] = Form(None),
    brand: Optional[str] = Form(None),
    stock: int = Form(10),
    image: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to create a footwear product with auto-generated size variants and image upload."""
    # Resolve or create category
    resolved_category = None
    if category_id:
        resolved_category = db.query(Category).filter(Category.id == category_id).first()
    elif category:
        cat_slug = category.lower().replace(" ", "-")
        resolved_category = db.query(Category).filter(Category.slug == cat_slug).first()
        if not resolved_category:
            resolved_category = Category(name=category, slug=cat_slug)
            db.add(resolved_category)
            db.commit()
            db.refresh(resolved_category)
    
    if not resolved_category:
        resolved_category = db.query(Category).first()
        if not resolved_category:
            resolved_category = Category(name="Sneakers", slug="sneakers")
            db.add(resolved_category)
            db.commit()
            db.refresh(resolved_category)

    # Resolve or create brand
    resolved_brand = None
    if brand_id:
        resolved_brand = db.query(Brand).filter(Brand.id == brand_id).first()
    elif brand:
        brand_slug = brand.lower().replace(" ", "-")
        resolved_brand = db.query(Brand).filter(Brand.slug == brand_slug).first()
        if not resolved_brand:
            resolved_brand = Brand(name=brand, slug=brand_slug)
            db.add(resolved_brand)
            db.commit()
            db.refresh(resolved_brand)

    slug = f"{name.lower().replace(' ', '-')}-{int(price)}"

    new_prod = Product(
        name=name,
        slug=slug,
        description=description,
        base_price=Decimal(str(price)),
        discount_price=None,
        category_id=resolved_category.id,
        brand_id=resolved_brand.id if resolved_brand else None,
        is_active=True
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    # Handle image upload via Neon Object Storage
    img_url = image
    if image_file:
        key, public_url = await storage_service.upload_file(image_file, folder="products")
        img_url = public_url
        img_record = ProductImage(
            product_id=new_prod.id,
            image_key=key,
            image_url=public_url,
            is_primary=True,
            display_order=0
        )
        db.add(img_record)
    elif img_url:
        img_record = ProductImage(
            product_id=new_prod.id,
            image_key=f"external/{new_prod.id}",
            image_url=img_url,
            is_primary=True,
            display_order=0
        )
        db.add(img_record)

    # Handle optional video file
    if video_file:
        v_key, v_url = await storage_service.upload_file(video_file, folder="videos", is_video=True)
        video_record = ProductVideo(
            product_id=new_prod.id,
            video_key=v_key,
            video_url=v_url,
            title=f"{name} Showcase"
        )
        db.add(video_record)

    # Generate standard footwear size variants (UK 7, UK 8, UK 9, UK 10) in a single batch
    sizes = ["UK 7", "UK 8", "UK 9", "UK 10"]
    new_variants = []
    for s in sizes:
        sku = f"{new_prod.id}-{s.replace(' ', '')}-BLK"
        variant = ProductVariant(
            product_id=new_prod.id,
            sku=sku,
            size=s,
            colour_name="Onyx Black",
            colour_hex="#090909"
        )
        db.add(variant)
        new_variants.append(variant)

    db.flush()  # Assigns variant IDs in 1 round-trip

    for variant in new_variants:
        inv = Inventory(variant_id=variant.id, stock_quantity=stock)
        db.add(inv)

    db.commit()
    db.refresh(new_prod)
    invalidate_catalog_cache()

    return serialize_product(new_prod)

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    stock: Optional[int] = Form(None),
    image: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    target_image_id: Optional[int] = Form(None),
    image_action: Optional[str] = Form("replace"), # "replace" or "append"
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update footwear product with eager loading and multi-image gallery support."""
    product = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.brand),
            selectinload(Product.images),
            selectinload(Product.variants).joinedload(ProductVariant.inventory)
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.base_price = Decimal(str(price))
    if category_id:
        product.category_id = category_id
    elif category:
        cat_slug = category.lower().replace(" ", "-")
        cat = db.query(Category).filter(Category.slug == cat_slug).first()
        if not cat:
            cat = Category(name=category, slug=cat_slug)
            db.add(cat)
            db.flush()
        product.category_id = cat.id

    # Handle image upload or update
    if image_file:
        key, public_url = await storage_service.upload_file(image_file, folder="products")
        if image_action == "append":
            # Add as new gallery image
            db.add(ProductImage(
                product_id=product.id,
                image_key=key,
                image_url=public_url,
                is_primary=len(product.images) == 0,
                display_order=len(product.images)
            ))
        elif target_image_id:
            # Replace specific targeted image
            target = next((img for img in product.images if img.id == target_image_id), None)
            if target:
                target.image_key = key
                target.image_url = public_url
            else:
                db.add(ProductImage(product_id=product.id, image_key=key, image_url=public_url, is_primary=False))
        else:
            # Update primary image
            primary = next((img for img in product.images if img.is_primary), None)
            if primary:
                primary.image_key = key
                primary.image_url = public_url
            else:
                db.add(ProductImage(product_id=product.id, image_key=key, image_url=public_url, is_primary=True))
    elif image:
        if image_action == "append":
            db.add(ProductImage(
                product_id=product.id,
                image_key=f"external/{product.id}_{uuid.uuid4().hex[:6]}",
                image_url=image,
                is_primary=len(product.images) == 0,
                display_order=len(product.images)
            ))
        elif target_image_id:
            target = next((img for img in product.images if img.id == target_image_id), None)
            if target:
                target.image_url = image
            else:
                db.add(ProductImage(product_id=product.id, image_key=f"external/{product.id}", image_url=image, is_primary=False))
        else:
            primary = next((img for img in product.images if img.is_primary), None)
            if primary:
                primary.image_url = image
            else:
                db.add(ProductImage(product_id=product.id, image_key=f"external/{product.id}", image_url=image, is_primary=True))

    if stock is not None:
        # Update stock across variants
        for v in product.variants:
            if v.inventory:
                v.inventory.stock_quantity = stock

    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return {"message": "Product updated successfully", "product": serialize_product(product)}

@router.post("/{product_id}/images")
async def add_product_image(
    product_id: int,
    image_file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to add a new image angle to product gallery."""
    product = db.query(Product).options(*get_product_eager_options()).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    key = None
    url = None
    if image_file:
        key, url = await storage_service.upload_file(image_file, folder="products")
    elif image_url:
        url = image_url
        key = f"external/{product_id}_{uuid.uuid4().hex[:6]}"
    else:
        raise HTTPException(status_code=400, detail="Please provide an image file or URL")

    # If first image or marked as primary, reset previous primary
    if is_primary or len(product.images) == 0:
        for img in product.images:
            img.is_primary = False
        is_primary = True

    new_img = ProductImage(
        product_id=product.id,
        image_key=key,
        image_url=url,
        is_primary=is_primary,
        display_order=len(product.images)
    )
    db.add(new_img)
    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return serialize_product(product)

@router.put("/{product_id}/images/{image_id}/primary")
def set_primary_image(
    product_id: int,
    image_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to promote an existing gallery image to primary cover."""
    product = db.query(Product).options(*get_product_eager_options()).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    target_found = False
    for img in product.images:
        if img.id == image_id:
            img.is_primary = True
            target_found = True
        else:
            img.is_primary = False

    if not target_found:
        raise HTTPException(status_code=404, detail="Target image not found in product gallery")

    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return serialize_product(product)

@router.delete("/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: int,
    image_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to delete an image from product gallery."""
    product = db.query(Product).options(*get_product_eager_options()).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    img_to_delete = next((img for img in product.images if img.id == image_id), None)
    if not img_to_delete:
        raise HTTPException(status_code=404, detail="Image not found")

    was_primary = img_to_delete.is_primary
    key = img_to_delete.image_key
    db.delete(img_to_delete)
    db.flush()

    remaining = [img for img in product.images if img.id != image_id]
    if was_primary and remaining:
        remaining[0].is_primary = True

    if key:
        storage_service.delete_file(key)

    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return serialize_product(product)

@router.delete("/{product_id}")
def delete_product(product_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin endpoint to remove product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    invalidate_catalog_cache()
    return {"message": "Product removed"}

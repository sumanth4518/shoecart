import os
from decimal import Decimal
from app.database.session import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    Role,
    User,
    Brand,
    Category,
    Product,
    ProductVariant,
    Inventory,
    ProductImage,
    ProductVideo,
    Cart,
    Wishlist,
    Review
)

def run_seed():
    db = SessionLocal()
    try:
        # 1. Ensure Roles exist
        customer_role = db.query(Role).filter(Role.name == "customer").first()
        if not customer_role:
            customer_role = Role(name="customer", description="Standard customer account")
            db.add(customer_role)

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Store Administrator")
            db.add(admin_role)

        db.commit()
        db.refresh(customer_role)
        db.refresh(admin_role)

        # 2. Ensure Users exist (Preserving existing Blinkit credentials)
        # Hash for 'admin123'
        admin_pw_hash = get_password_hash("admin123")

        admin_user = db.query(User).filter(User.email == "admin@blinkit.com").first()
        if not admin_user:
            admin_user = User(
                full_name="Admin",
                email="admin@blinkit.com",
                password_hash=admin_pw_hash,
                role_id=admin_role.id,
                is_email_verified=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            db.add(Cart(user_id=admin_user.id))
            db.add(Wishlist(user_id=admin_user.id))

        demo_user = db.query(User).filter(User.email == "john@example.com").first()
        if not demo_user:
            demo_user = User(
                full_name="John Doe",
                email="john@example.com",
                password_hash=admin_pw_hash,
                role_id=customer_role.id,
                is_email_verified=True,
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            db.add(Cart(user_id=demo_user.id))
            db.add(Wishlist(user_id=demo_user.id))

        db.commit()

        # 3. Seed Footwear Brands
        brands_data = [
            {"name": "Nike", "slug": "nike", "description": "Just Do It. Innovating for athletes everywhere."},
            {"name": "Jordan", "slug": "jordan", "description": "Unrivaled heritage and iconic court silhouettes."},
            {"name": "Adidas", "slug": "adidas", "description": "Impossible is Nothing. Premium streetwear and performance."},
            {"name": "New Balance", "slug": "new-balance", "description": "Fearlessly independent since 1906."},
            {"name": "Puma", "slug": "puma", "description": "Forever Faster. Sleek motorsport and athletic design."}
        ]

        brand_map = {}
        for b_data in brands_data:
            brand = db.query(Brand).filter(Brand.slug == b_data["slug"]).first()
            if not brand:
                brand = Brand(**b_data)
                db.add(brand)
                db.commit()
                db.refresh(brand)
            brand_map[b_data["slug"]] = brand

        # 4. Seed Footwear Categories
        categories_data = [
            {"name": "Sneakers", "slug": "sneakers", "display_order": 1, "description": "Iconic high-heat lifestyle and streetwear sneakers."},
            {"name": "Running Shoes", "slug": "running-shoes", "display_order": 2, "description": "High-mileage responsive cushioning and race-day runners."},
            {"name": "Sports & Training", "slug": "sports-shoes", "display_order": 3, "description": "Gym, cross-training and court-ready agility footwear."},
            {"name": "Casual Shoes", "slug": "casual-shoes", "display_order": 4, "description": "Understated minimal silhouettes for effortless everyday wear."},
            {"name": "Premium Collections", "slug": "premium-collections", "display_order": 5, "description": "Limited-edition collaborative luxury drops."},
            {"name": "Slides & Sandals", "slug": "slides-sandals", "display_order": 6, "description": "Recovery slides and ergonomic slip-ons."}
        ]

        category_map = {}
        for c_data in categories_data:
            cat = db.query(Category).filter(Category.slug == c_data["slug"]).first()
            if not cat:
                cat = Category(**c_data)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            category_map[c_data["slug"]] = cat

        # 5. Check if products exist; if not, seed premium footwear
        existing_products_count = db.query(Product).count()
        if existing_products_count == 0:
            footwear_catalog = [
                {
                    "name": "Nike Air Max Pulse Cyber Orange",
                    "slug": "nike-air-max-pulse-cyber-orange",
                    "brand_slug": "nike",
                    "category_slug": "sneakers",
                    "description": "Inspired by the London music scene, the Air Max Pulse brings a tough, underground touch to the iconic Air Max line. Features vacuum-sealed accents and point-loaded cushioning tuned to the target bounce.",
                    "base_price": Decimal("13995.00"),
                    "discount_price": Decimal("11495.00"),
                    "is_featured": True,
                    "is_trending": True,
                    "is_new_arrival": True,
                    "images": [
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80",
                        "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&q=80",
                        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&q=80"
                    ],
                    "video": "https://assets.mixkit.co/videos/preview/mixkit-running-shoes-in-motion-42557-large.mp4",
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
                    "colour": "Cyber Orange / Carbon Black",
                    "hex": "#FF6B1A",
                    "stock_per_size": [8, 12, 15, 6, 4]
                },
                {
                    "name": "Air Jordan 1 Retro High OG 'Dark Concord'",
                    "slug": "air-jordan-1-retro-high-og-dark-concord",
                    "brand_slug": "jordan",
                    "category_slug": "sneakers",
                    "description": "Familiar yet fresh, the iconic Air Jordan 1 is remastered with full-grain leather, encapsulated Air cushioning and deep court-inspired contrast paneling.",
                    "base_price": Decimal("16995.00"),
                    "discount_price": Decimal("14995.00"),
                    "is_featured": True,
                    "is_trending": True,
                    "is_new_arrival": False,
                    "images": [
                        "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1000&q=80",
                        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10"],
                    "colour": "Concord White / Obsidian",
                    "hex": "#1E293B",
                    "stock_per_size": [5, 10, 8, 3]
                },
                {
                    "name": "Adidas Ultraboost Light Carbon Edition",
                    "slug": "adidas-ultraboost-light-carbon-edition",
                    "brand_slug": "adidas",
                    "category_slug": "running-shoes",
                    "description": "Experience epic energy return with our lightest BOOST ever. Engineered PRIMEKNIT upper hugs the foot while the Continental Rubber outsole provides unmatched grip.",
                    "base_price": Decimal("18999.00"),
                    "discount_price": Decimal("15499.00"),
                    "is_featured": True,
                    "is_trending": False,
                    "is_new_arrival": True,
                    "images": [
                        "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=1000&q=80",
                        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
                    "colour": "Stealth Black / Solar Orange",
                    "hex": "#FF6B1A",
                    "stock_per_size": [14, 20, 18, 10, 5]
                },
                {
                    "name": "New Balance 9060 Warp Runner",
                    "slug": "new-balance-9060-warp-runner",
                    "brand_slug": "new-balance",
                    "category_slug": "sneakers",
                    "description": "A new expression of refined style and innovation-led design. The 9060 reinterprets familiar elements from classic 99X models with a warped, Y2K aesthetic.",
                    "base_price": Decimal("15999.00"),
                    "discount_price": Decimal("13999.00"),
                    "is_featured": False,
                    "is_trending": True,
                    "is_new_arrival": True,
                    "images": [
                        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=1000&q=80",
                        "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10"],
                    "colour": "Rain Cloud / Sea Salt",
                    "hex": "#71717A",
                    "stock_per_size": [6, 9, 12, 4]
                },
                {
                    "name": "Puma Velocity NITRO 3 Neon",
                    "slug": "puma-velocity-nitro-3-neon",
                    "brand_slug": "puma",
                    "category_slug": "running-shoes",
                    "description": "An all-in-one daily runner delivering an optimum blend of cushioning and light responsiveness. Dual-layer NITRO foam keeps every stride explosive.",
                    "base_price": Decimal("11999.00"),
                    "discount_price": Decimal("8999.00"),
                    "is_featured": False,
                    "is_trending": True,
                    "is_new_arrival": False,
                    "images": [
                        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1000&q=80",
                        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
                    "colour": "Acid Lime / Ultra Orange",
                    "hex": "#FF6B1A",
                    "stock_per_size": [10, 15, 12, 8, 3]
                },
                {
                    "name": "Nike Metcon 9 Pro Training",
                    "slug": "nike-metcon-9-pro-training",
                    "brand_slug": "nike",
                    "category_slug": "sports-shoes",
                    "description": "The gold standard for lifting, conditioning and agility workouts. A larger Hyperlift plate in the heel delivers rock-solid stability during heavy sets.",
                    "base_price": Decimal("12995.00"),
                    "discount_price": Decimal("10995.00"),
                    "is_featured": True,
                    "is_trending": False,
                    "is_new_arrival": True,
                    "images": [
                        "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=1000&q=80",
                        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10"],
                    "colour": "Triple Matte Black",
                    "hex": "#171717",
                    "stock_per_size": [9, 14, 11, 7]
                },
                {
                    "name": "AURA HyperSlide Ergonomic Recovery",
                    "slug": "aura-hyperslide-ergonomic-recovery",
                    "brand_slug": "nike",
                    "category_slug": "slides-sandals",
                    "description": "Constructed from ultra-plush dual-density supercritical foam. Deep contoured footbed designed to accelerate post-race foot decompression.",
                    "base_price": Decimal("4999.00"),
                    "discount_price": Decimal("3999.00"),
                    "is_featured": False,
                    "is_trending": False,
                    "is_new_arrival": True,
                    "images": [
                        "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
                    "colour": "Volcanic Orange",
                    "hex": "#FF6B1A",
                    "stock_per_size": [20, 25, 30, 18, 12]
                },
                {
                    "name": "Jordan Luka 2 'Space Architect'",
                    "slug": "jordan-luka-2-space-architect",
                    "brand_slug": "jordan",
                    "category_slug": "sports-shoes",
                    "description": "Engineered for rapid step-backs and deceleration. Multi-directional cage wrapping gives total lateral containment on indoor and outdoor courts.",
                    "base_price": Decimal("11495.00"),
                    "discount_price": Decimal("9995.00"),
                    "is_featured": True,
                    "is_trending": True,
                    "is_new_arrival": False,
                    "images": [
                        "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=1000&q=80"
                    ],
                    "video": None,
                    "sizes": ["UK 8", "UK 9", "UK 10"],
                    "colour": "Metallic Pewter / Orange Blaze",
                    "hex": "#FF6B1A",
                    "stock_per_size": [12, 10, 4]
                }
            ]

            for item in footwear_catalog:
                brand_obj = brand_map.get(item["brand_slug"])
                cat_obj = category_map.get(item["category_slug"])

                prod = Product(
                    name=item["name"],
                    slug=item["slug"],
                    brand_id=brand_obj.id if brand_obj else None,
                    category_id=cat_obj.id if cat_obj else list(category_map.values())[0].id,
                    description=item["description"],
                    base_price=item["base_price"],
                    discount_price=item["discount_price"],
                    is_featured=item["is_featured"],
                    is_trending=item["is_trending"],
                    is_new_arrival=item["is_new_arrival"],
                    is_active=True
                )
                db.add(prod)
                db.commit()
                db.refresh(prod)

                # Add images
                for idx, img_url in enumerate(item["images"]):
                    db.add(
                        ProductImage(
                            product_id=prod.id,
                            image_key=f"seed/{prod.id}/{idx}",
                            image_url=img_url,
                            is_primary=(idx == 0),
                            display_order=idx
                        )
                    )

                # Add video if available
                if item.get("video"):
                    db.add(
                        ProductVideo(
                            product_id=prod.id,
                            video_key=f"seed/video/{prod.id}",
                            video_url=item["video"],
                            title=f"{prod.name} Motion"
                        )
                    )

                # Add size variants and inventory
                for s_idx, size_name in enumerate(item["sizes"]):
                    stock_qty = item["stock_per_size"][s_idx] if s_idx < len(item["stock_per_size"]) else 10
                    sku = f"{prod.id}-{size_name.replace(' ', '')}-BLK"
                    variant = ProductVariant(
                        product_id=prod.id,
                        sku=sku,
                        size=size_name,
                        colour_name=item["colour"],
                        colour_hex=item["hex"]
                    )
                    db.add(variant)
                    db.commit()
                    db.refresh(variant)

                    db.add(Inventory(variant_id=variant.id, stock_quantity=stock_qty))

                # Add customer review
                db.add(
                    Review(
                        product_id=prod.id,
                        user_id=demo_user.id,
                        rating=5,
                        title="Unmatched comfort and presence",
                        comment="Incredible silhouette and quality materials. Sizing fits true to size and the cushioning is next-level.",
                        is_verified_purchase=True,
                        is_approved=True
                    )
                )

                db.commit()

            print("👟 Footwear catalogue successfully seeded with authentic premium products and variants.")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()

# AURA KICKS &bull; Premium Footwear E-Commerce Platform

A production-grade footwear e-commerce application transformed from a local Blinkit clone into a high-performance, dark-luxury sneaker shopping experience.

---

## 1. System Architecture

```
                  ┌────────────────────────────────────────┐
                  │    Dual Portals (React 18 + Vite)      │
                  │  Customer Portal: http://localhost:3000 │
                  │  Admin Portal:    http://localhost:3001 │
                  │  Black & Orange Aesthetic (#FF6B1A)    │
                  └───────────────────┬────────────────────┘
                                      │ /api Proxy
                                      ▼
                  ┌────────────────────────────────────────┐
                  │             FastAPI Backend            │
                  │  Clean Architecture (V1 Routers)       │
                  │  JWT + Role-Based Access Control (RBAC)│
                  │  Bcrypt Passwords + Email OTP Flow     │
                  └───────────┬────────────────┬───────────┘
                              │                │
            SQLAlchemy + SSL  │                │ S3 Boto3 API
                              ▼                ▼
                  ┌──────────────────┐  ┌──────────────────┐
                  │ Neon PostgreSQL  │  │   Neon Object    │
                  │ Normalized (21T) │  │  Storage (Media) │
                  └──────────────────┘  └──────────────────┘
```

* **Customer Portal (`frontend`):** Dedicated customer storefront with luxury hero, 3D/video showcase, catalog browsing, UK size selection, inventory validation, cart, wishlist, address book, checkout, and order tracking. Runs on `http://localhost:3000`.
* **Admin Portal (`admin-frontend`):** Dedicated command console for store operators with analytics KPI cards, sales trends, product CRUD, inventory restock per size, order status transitions, and customer directory. Runs on `http://localhost:3001`.
* **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2, Uvicorn, SlowAPI, PyJWT, Bcrypt. Runs on `http://localhost:5000`.
* **Database:** Neon PostgreSQL with SSL connection pooling and 21 normalized tables.
* **Media Assets:** Neon Object Storage (S3-compatible) with presigned URLs and local fallback.
* **Containerization:** Multi-stage production Dockerfile (Backend + Nginx Frontend) and `docker-compose.yml`.

---

## 2. Default Seed Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@blinkit.com` | `admin123` | Admin dashboard, inventory restock, order fulfillment, product CRUD, customer management |
| **Verified Customer** | `john@example.com` | `admin123` | Browsing, size-specific cart, wishlist, address book, checkout, order tracking |

---

## 3. Quickstart & Local Execution

### Prerequisites
* **Node.js**: v18+ installed
* **Python**: v3.11+ installed

### Option A: Local Development (Concurrently)
From the root directory:

```bash
# 1. Start FastAPI Backend, Customer Frontend, and Admin Portal concurrently:
npm run dev

# Or run services individually:
npm run backend   # Starts FastAPI on http://localhost:5000
npm run frontend  # Starts Customer Portal on http://localhost:3000
npm run admin     # Starts Admin Portal on http://localhost:3001
```

* **Customer Storefront Portal:** [http://localhost:3000](http://localhost:3000)
* **Admin Command Console Portal:** [http://localhost:3001](http://localhost:3001)
* **Interactive Swagger Documentation:** [http://localhost:5000/docs](http://localhost:5000/docs)
* **Alternative ReDoc UI:** [http://localhost:5000/redoc](http://localhost:5000/redoc)

### Option B: Docker Deployment
```bash
# Build and run containers:
docker-compose up --build -d

# View service logs:
docker-compose logs -f
```

---

## 4. Neon PostgreSQL Setup Instructions

1. Log into your [Neon Console](https://console.neon.tech).
2. Create a new PostgreSQL Project (e.g. `aura-kicks-footwear`).
3. Copy the connection string from the Dashboard. Ensure `sslmode=require` is present.
4. Set the `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL=postgresql+psycopg2://<user>:<password>@<ep-project-id>.pooler.neon.tech/blinkit_footwear?sslmode=require
   ```
5. Apply database migrations:
   ```bash
   cd backend
   .\venv\Scripts\alembic upgrade head
   ```

---

## 5. Neon Object Storage Setup Instructions

1. In the Neon Console or S3-compatible storage settings, generate an **Access Key ID** and **Secret Access Key**.
2. Note your S3 Endpoint URL (e.g. `https://<account-id>.r2.cloudflarestorage.com` or `https://<project-id>.s3.neon.tech`).
3. Populate `backend/.env`:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_ENDPOINT_URL_S3=https://your-project.s3.neon.tech
   AWS_REGION=us-east-1
   NEON_STORAGE_BUCKET=premium-footwear
   ```
4. The backend automatically uploads images/videos to Neon Storage. If credentials are not configured, it gracefully stores media in `/uploads/` with zero downtime.

---

## 6. Environment Variables Documentation

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://user:pass@ep-xyz.neon.tech/footwear?sslmode=require` |
| `SECRET_KEY` | JWT signing secret | `supersecretkey_production_secret` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `10080` (7 days) |
| `AWS_ENDPOINT_URL_S3` | Neon Storage endpoint | `https://your-project.s3.neon.tech` |
| `AWS_ACCESS_KEY_ID` | Storage access key | `xyz...` |
| `AWS_SECRET_ACCESS_KEY` | Storage secret key | `abc...` |
| `NEON_STORAGE_BUCKET` | Storage bucket identifier | `premium-footwear` |
| `EMAIL_HOST` | SMTP server for OTPs | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `noreply@aurakicks.com` |
| `EMAIL_PASSWORD` | SMTP app password | `app_password` |
| `PORT` | Backend port | `5000` |
| `ALLOWED_ORIGINS` | Permitted CORS origins | `["http://localhost:3000","http://127.0.0.1:3000","*"]` |

---

## 7. Automated Test Suite

Run backend automated verification:
```bash
npm run test:backend
```

**Results:**
```
tests/test_api.py::test_health_check PASSED                              [ 14%]
tests/test_api.py::test_admin_login PASSED                               [ 28%]
tests/test_api.py::test_customer_login PASSED                            [ 42%]
tests/test_api.py::test_get_products_and_filters PASSED                  [ 57%]
tests/test_api.py::test_cart_and_checkout_flow PASSED                    [ 71%]
tests/test_api.py::test_wishlist_operations PASSED                       [ 85%]
tests/test_api.py::test_admin_analytics_and_order_management PASSED      [100%]
======================= 7 passed, 10 warnings in 7.86s ========================
```

"""add payments table

Revision ID: 0002_add_payments
Revises: 
Create Date: 2026-11-22 00:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_payments'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Use if_not_exists logic to be safe if table already created by Base.metadata.create_all
    op.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_checkout_session_id VARCHAR(255) UNIQUE,
        stripe_payment_intent_id VARCHAR(255),
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'inr',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe',
        payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ix_payments_id ON payments (id);
    CREATE INDEX IF NOT EXISTS ix_payments_order_id ON payments (order_id);
    CREATE INDEX IF NOT EXISTS ix_payments_customer_id ON payments (customer_id);
    CREATE INDEX IF NOT EXISTS ix_payments_stripe_session_id ON payments (stripe_checkout_session_id);
    CREATE INDEX IF NOT EXISTS ix_payments_stripe_pi_id ON payments (stripe_payment_intent_id);
    CREATE INDEX IF NOT EXISTS ix_payments_status ON payments (payment_status);
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS payments CASCADE;")

"""add user hashed_password, seed demo account

Revision ID: 9781ed5ede12
Revises: 3d8b1f6c4a29
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9781ed5ede12'
down_revision: Union[str, None] = '3d8b1f6c4a29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Hash of "Demo123!" — pbkdf2_hmac('sha256', password, salt, 100_000), same
# format/algorithm as app.core.security.hash_password/verify_password.
DEMO_PASSWORD_HASH = "43be48088e82737b01f378e3c64d2eed$a990c03a2164a1273515bfbded971f5be39065b21ea88e6b49b296e0849be195"


def upgrade() -> None:
    op.add_column('users', sa.Column('hashed_password', sa.String(255), nullable=True))

    # Public demo account: its own isolated organization, logs in with
    # username "demo" / password "Demo123!" via POST /auth/login, never
    # through Google. Idempotent so re-running the migration is a no-op.
    op.execute("""
        INSERT INTO organizations (id, name, slug, usd_exchange_rate)
        VALUES (uuid_generate_v4(), 'Demo', 'demo', 1200)
        ON CONFLICT (slug) DO NOTHING
    """)
    op.execute(f"""
        INSERT INTO users (id, email, full_name, hashed_password, organization_id)
        SELECT uuid_generate_v4(), 'demo', 'Usuario Demo', '{DEMO_PASSWORD_HASH}', organizations.id
        FROM organizations
        WHERE organizations.slug = 'demo'
        ON CONFLICT (email) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE email = 'demo'")
    op.execute("DELETE FROM organizations WHERE slug = 'demo'")
    op.drop_column('users', 'hashed_password')

"""drop legacy constraints

Revision ID: 750ae7b221c4
Revises: 4a2e0323ff73
Create Date: 2026-08-04 18:44:59.188885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '750ae7b221c4'
down_revision: Union[str, None] = '4a2e0323ff73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop legacy constraints that are not modeled in the ORM
    op.drop_constraint('users_google_id_key', 'users', type_='unique')
    op.drop_constraint('bookings_created_by_fkey', 'bookings', type_='foreignkey')
    op.drop_constraint('payments_verified_by_fkey', 'payments', type_='foreignkey')
    op.drop_constraint('properties_created_by_fkey', 'properties', type_='foreignkey')


def downgrade() -> None:
    # Restore the legacy constraints exactly as they were
    op.create_unique_constraint('users_google_id_key', 'users', ['google_id'])
    op.create_foreign_key('bookings_created_by_fkey', 'bookings', 'users', ['created_by'], ['id'])
    op.create_foreign_key('payments_verified_by_fkey', 'payments', 'users', ['verified_by'], ['id'])
    op.create_foreign_key('properties_created_by_fkey', 'properties', 'users', ['created_by'], ['id'])
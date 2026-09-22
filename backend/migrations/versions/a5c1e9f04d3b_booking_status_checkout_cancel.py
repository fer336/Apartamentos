"""collapse booking status to confirmed/cancelled, add checked_out_at/cancelled_at

Revision ID: a5c1e9f04d3b
Revises: 9781ed5ede12
Create Date: 2026-09-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5c1e9f04d3b'
down_revision: Union[str, None] = '9781ed5ede12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS instead of op.add_column: the container's CMD runs
    # `alembic upgrade head` on every start/restart (see backend/Dockerfile),
    # and a container that crash-loops mid-migration (e.g. Swarm's
    # restart_policy retrying after an unrelated startup failure) must be
    # able to re-run this migration without erroring on columns a prior
    # partial attempt already committed.
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE")

    # Backfill: bookings previously marked 'completed' get a checked_out_at
    # stamp (use updated_at as the best available approximation of when the
    # checkout happened), bookings previously marked 'cancelled' get a
    # cancelled_at stamp. Then collapse every non-cancelled status
    # ('pending', 'active', 'completed') down to 'confirmed' — status only
    # ever carries 2 live values from here on.
    op.execute("""
        UPDATE bookings SET checked_out_at = updated_at
        WHERE status = 'completed' AND checked_out_at IS NULL
    """)
    op.execute("""
        UPDATE bookings SET cancelled_at = updated_at
        WHERE status = 'cancelled' AND cancelled_at IS NULL
    """)
    op.execute("""
        UPDATE bookings SET status = 'confirmed'
        WHERE status IN ('pending', 'active', 'completed')
    """)

    op.alter_column('bookings', 'status', server_default='confirmed')


def downgrade() -> None:
    op.alter_column('bookings', 'status', server_default='pending')
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS cancelled_at")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS checked_out_at")

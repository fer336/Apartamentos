"""add booking payment dates

Revision ID: 9f3c2a7d5e1b
Revises: 750ae7b221c4
Create Date: 2026-08-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f3c2a7d5e1b'
down_revision: Union[str, None] = '750ae7b221c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fecha real en que se cobró cada pago de una reserva (seña / saldo), para
    # que contabilidad pueda atribuir el ingreso al mes en que se cobró en vez
    # de al mes de la estadía (check_in).
    op.add_column('bookings', sa.Column('advance_payment_date', sa.Date(), nullable=True))
    op.add_column('bookings', sa.Column('balance_settled_at', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'balance_settled_at')
    op.drop_column('bookings', 'advance_payment_date')

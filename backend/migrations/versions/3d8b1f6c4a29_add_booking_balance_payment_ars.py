"""add booking balance payment ars

Revision ID: 3d8b1f6c4a29
Revises: 9f3c2a7d5e1b
Create Date: 2026-08-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d8b1f6c4a29'
down_revision: Union[str, None] = '9f3c2a7d5e1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # balance_payment_usd pasa a significar "monto del saldo pagado, en USD".
    # balance_payment_ars es su par en pesos, para no mezclar monedas al saldar
    # una reserva cuya seña (u pago mixto) incluye pesos.
    op.add_column('bookings', sa.Column('balance_payment_ars', sa.Numeric(12, 2), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('bookings', 'balance_payment_ars')

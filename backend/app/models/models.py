from sqlalchemy import Column, String, Integer, Date, Numeric, DateTime, Boolean, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
from sqlalchemy.orm import relationship

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(50), unique=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    picture = Column(String(1024))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    booking_number = Column(String(20), unique=True, nullable=False)
    property_id = Column(UUID(as_uuid=True), nullable=False)
    client_id = Column(UUID(as_uuid=True), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests_count = Column(Integer, default=1)
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    pets = Column(Boolean, default=False)
    
    total_price_usd = Column(Numeric(10, 2), nullable=False)
    total_price_currency = Column(String(3), default='USD')
    
    advance_payment_usd = Column(Numeric(10, 2))
    advance_payment_currency = Column(String(3), default='USD')
    
    balance_payment_usd = Column(Numeric(10, 2))
    
    deposit_ars = Column(Numeric(12, 2), default=0)
    deposit_currency = Column(String(3), default='ARS')
    
    exchange_rate = Column(Numeric(10, 2), default=1.0)
    
    left_to_pay_usd = Column(Numeric(10, 2), default=0)
    
    status = Column(String(50), default='pending')
    payment_status = Column(String(50), default='pending')
    service_status = Column(String(50))
    checkout_notes = Column(Text)
    
    special_requests = Column(Text)
    internal_notes = Column(Text)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class Property(Base):
    __tablename__ = "properties"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default='Argentina')
    capacity = Column(Integer, nullable=False, default=1)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Numeric(3, 1), default=1)
    description = Column(Text)
    status = Column(String(50), default='available')
    property_type = Column(String(50), default='apartment')
    amenities = Column(JSONB, default=[])
    photos = Column(JSONB, default=[])
    
    # Configuración de alquiler
    check_in_day = Column(Integer, default=5)  # Default: Sábado (5 si 0=Lunes, pero el usuario dijo Sábado)
    check_out_day = Column(Integer, default=5) # Default: Sábado
    rental_unit = Column(String(20), default='days') # 'days' o 'weeks'
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    directv_devices = relationship("DirectvDevice", back_populates="property", cascade="all, delete-orphan")


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    document_type = Column(String(50))
    document_id = Column(String(50))
    email = Column(String(255))
    phone = Column(String(50))
    whatsapp = Column(String(50))
    nationality = Column(String(100))
    notes = Column(Text)
    rating = Column(Integer)
    is_blacklisted = Column(Boolean, default=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    booking_id = Column(UUID(as_uuid=True), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    exchange_rate = Column(Numeric(10, 4))
    payment_date = Column(TIMESTAMP(timezone=True), server_default=func.now())
    type = Column(String(50), nullable=False)
    method = Column(String(50))
    receipt_url = Column(Text)
    notes = Column(Text)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class DirectvDevice(Base):
    __tablename__ = "directv_devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"))
    location = Column(String(100), nullable=False)
    card_number = Column(String(50), nullable=False)
    recharge_code = Column(String(50))
    
    last_amount_loaded = Column(Numeric(10, 2), default=0)
    last_days_loaded = Column(Integer, default=0)
    loaded_at = Column(DateTime(timezone=True), default=func.now())
    
    expiry_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    # Relación
    property = relationship("Property", back_populates="directv_devices")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, default=False)
    due_date = Column(TIMESTAMP(timezone=True))

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)

    # Información del gasto
    date = Column(Date, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    provider = Column(String(255), nullable=False)

    # Monto
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='ARS')

    # Estado del pago
    status = Column(String(50), default='pending')  # pending, paid, cancelled

    # Factura/Comprobante (MinIO)
    receipt_url = Column(Text)
    receipt_filename = Column(String(255))

    # Notas adicionales
    notes = Column(Text)

    # Auditoría
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class ExpenseCategory(Base):
    """Categorías personalizadas de gastos por organización"""
    __tablename__ = "expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    value = Column(String(100), nullable=False)  # slug: blanqueria
    label = Column(String(100), nullable=False)  # display: Blanquería
    icon = Column(String(10), default='📦')
    color = Column(String(50), default='orange')

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


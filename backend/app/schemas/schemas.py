from pydantic import BaseModel, field_serializer, field_validator
from datetime import date, datetime
from typing import Optional, Any, List
from decimal import Decimal
from uuid import UUID

class BookingResponse(BaseModel):
    id: UUID
    booking_number: str
    property_id: UUID
    client_id: UUID
    
    # Datos expandidos
    property_name: Optional[str] = None
    client_name: Optional[str] = None
    
    check_in: date
    check_out: date
    guests_count: int
    adults: Optional[int] = None
    children: Optional[int] = None
    pets: Optional[bool] = None
    total_price_usd: Decimal
    total_price_currency: Optional[str] = 'USD'
    advance_payment_usd: Optional[Decimal] = None
    advance_payment_currency: Optional[str] = 'USD'
    balance_payment_usd: Optional[Decimal] = None
    deposit_ars: Optional[Decimal] = None
    deposit_currency: Optional[str] = 'ARS'
    exchange_rate: Optional[Decimal] = 1.0
    left_to_pay_usd: Optional[Decimal] = None
    status: str
    payment_status: str
    service_status: Optional[str] = None
    checkout_notes: Optional[str] = None
    created_at: datetime
    
    @field_serializer('id', 'property_id', 'client_id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)
    
    @field_serializer('total_price_usd', 'advance_payment_usd', 'balance_payment_usd', 'deposit_ars', 'left_to_pay_usd', 'exchange_rate')
    def serialize_decimal(self, value: Optional[Decimal], _info) -> Optional[float]:
        return float(value) if value is not None else None
    
    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    property_id: str
    client_id: str
    check_in: date
    check_out: date
    guests_count: int
    adults: Optional[int] = 1
    children: Optional[int] = 0
    pets: Optional[bool] = False
    total_price_usd: float
    total_price_currency: Optional[str] = 'USD'
    advance_payment_usd: Optional[float] = 0.0
    advance_payment_currency: Optional[str] = 'USD'
    deposit_ars: Optional[float] = 0.0
    deposit_currency: Optional[str] = 'ARS'
    exchange_rate: Optional[float] = 1.0
    status: str = 'pending'
    payment_status: str = 'pending'
    service_status: str = 'NO SERVICIOS'


class BookingUpdate(BaseModel):
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    guests_count: Optional[int] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    pets: Optional[bool] = None
    total_price_usd: Optional[float] = None
    total_price_currency: Optional[str] = None
    advance_payment_usd: Optional[float] = None
    advance_payment_currency: Optional[str] = None
    balance_payment_usd: Optional[float] = None
    left_to_pay_usd: Optional[float] = None
    deposit_ars: Optional[float] = None
    deposit_currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    service_status: Optional[str] = None
    checkout_notes: Optional[str] = None


class PropertyResponse(BaseModel):
    id: UUID
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = 'Argentina'
    capacity: int
    bedrooms: int
    bathrooms: Optional[Decimal] = None
    description: Optional[str] = None
    status: str
    property_type: str
    amenities: Optional[List[str]] = []
    check_in_day: Optional[int] = 5
    check_out_day: Optional[int] = 5
    rental_unit: Optional[str] = 'days'
    
    @field_serializer('id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)
    
    @field_serializer('bathrooms')
    def serialize_bathrooms(self, value: Optional[Decimal], _info) -> Optional[float]:
        return float(value) if value else None
    
    @field_validator('amenities', mode='before')
    @classmethod
    def set_default_list(cls, v):
        return v or []
    
    class Config:
        from_attributes = True


class PropertyCreate(BaseModel):
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = 'Argentina'
    capacity: int
    bedrooms: int
    bathrooms: Optional[float] = 1.0
    description: Optional[str] = None
    status: str = 'available'
    property_type: str = 'apartment'
    amenities: List[str] = []
    check_in_day: int = 5
    check_out_day: int = 5
    rental_unit: str = 'days'


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    capacity: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    property_type: Optional[str] = None
    amenities: Optional[List[str]] = None
    check_in_day: Optional[int] = None
    check_out_day: Optional[int] = None
    rental_unit: Optional[str] = None


class ClientResponse(BaseModel):
    id: UUID
    full_name: str
    document_type: Optional[str] = None
    document_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    notes: Optional[str] = None
    
    @field_serializer('id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)
    
    class Config:
        from_attributes = True


class ClientCreate(BaseModel):
    full_name: str
    document_type: Optional[str] = 'DNI'
    document_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    document_type: Optional[str] = None
    document_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    notes: Optional[str] = None


class MonthlyAvailability(BaseModel):
    month_name: str
    year: int
    total_free_days: int
    status: str  # 'full', 'partial', 'none'
    free_ranges: List[str] # ["24-31", "10-15"]

class DirectvDeviceResponse(BaseModel):
    id: UUID
    property_id: UUID
    location: str
    card_number: str
    recharge_code: Optional[str] = None
    last_amount_loaded: Optional[Decimal] = 0
    last_days_loaded: Optional[int] = 0
    loaded_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    days_remaining: Optional[int] = None # Campo calculado
    
    @field_serializer('id', 'property_id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)
    
    @field_serializer('last_amount_loaded')
    def serialize_decimal(self, value: Optional[Decimal], _info) -> Optional[float]:
        return float(value) if value is not None else 0.0
        
    class Config:
        from_attributes = True

class DirectvDeviceCreate(BaseModel):
    location: str
    card_number: str
    recharge_code: Optional[str] = None

class DirectvDeviceRecharge(BaseModel):
    amount: float
    days: int
    recharge_code: Optional[str] = None


class DashboardStats(BaseModel):
    active_bookings: int
    total_revenue_month: float
    total_revenue_month_ars: float = 0.0
    total_revenue_month_usd: float = 0.0
    occupancy_rate: float
    checkins_today: int
    availability_forecast: List[MonthlyAvailability] = []
    total_revenue_accumulated: float = 0.0
    total_revenue_accumulated_ars: float = 0.0
    total_revenue_accumulated_usd: float = 0.0
    total_bookings_accumulated: int = 0
    total_advance_ars: float = 0.0
    total_advance_usd: float = 0.0
    total_advance_month_ars: float = 0.0
    total_advance_month_usd: float = 0.0
    directv_devices_summary: List[dict] = []




class TaskResponse(BaseModel):
    id: UUID
    organization_id: UUID
    property_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    is_completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime
    
    @field_serializer('id', 'organization_id', 'property_id')
    def serialize_uuid(self, value: Optional[UUID], _info) -> Optional[str]:
        return str(value) if value else None
        
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    property_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    property_id: Optional[str] = None

class SeasonStats(BaseModel):
    year: int
    month: int
    month_name: str
    total_revenue: float
    bookings_count: int
    occupancy_rate: float

class AccountingStats(BaseModel):
    current_season_total: float
    previous_season_total: float
    comparisons: List[SeasonStats]


# --- EXPENSES (Gastos y Reparaciones) ---

class ExpenseResponse(BaseModel):
    id: UUID
    organization_id: UUID
    property_id: UUID
    property_name: Optional[str] = None  # Campo expandido

    date: date
    category: str
    description: str
    provider: str

    amount: Decimal
    currency: str

    status: str

    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None

    notes: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('id', 'organization_id', 'property_id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)

    @field_serializer('amount')
    def serialize_decimal(self, value: Decimal, _info) -> float:
        return float(value)

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    property_id: str
    date: date
    category: str
    description: str
    provider: str
    amount: float
    currency: str = 'ARS'
    status: str = 'pending'
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    property_id: Optional[str] = None
    date: Optional[date] = None
    category: Optional[str] = None
    description: Optional[str] = None
    provider: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCategoryResponse(BaseModel):
    id: UUID
    organization_id: UUID
    value: str
    label: str
    icon: str
    color: str
    created_at: datetime

    @field_serializer('id', 'organization_id')
    def serialize_uuid(self, value: UUID, _info) -> str:
        return str(value)

    class Config:
        from_attributes = True


class ExpenseCategoryCreate(BaseModel):
    value: str
    label: str
    icon: str = '📦'
    color: str = 'orange'


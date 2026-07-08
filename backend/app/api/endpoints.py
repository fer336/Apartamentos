from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
import io
import csv
from app.core.database import get_db
from app.models.models import Booking, Property, Client, Payment, Organization, User, DirectvDevice, Task, Expense, ExpenseCategory
from app.routers.auth import get_current_user
from app.schemas.schemas import (
    BookingResponse,
    BookingCreate,
    BookingUpdate,
    PropertyResponse,
    PropertyCreate,
    PropertyUpdate,
    ClientResponse,
    ClientCreate,
    ClientUpdate,
    DashboardStats,
    DirectvDeviceResponse,
    DirectvDeviceCreate,
    DirectvDeviceRecharge,
    TaskResponse,
    TaskCreate,
    TaskUpdate,
    SeasonStats,
    AccountingStats,
    ExpenseResponse,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseCategoryResponse,
    ExpenseCategoryCreate
)
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import uuid

router = APIRouter()

# --- BOOKINGS ENDPOINTS ---

@router.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las reservas con datos relacionados"""
    org_id = current_user.organization_id
    
    query = select(Booking, Property.name.label("property_name"), Client.full_name.label("client_name")) \
        .join(Property, Booking.property_id == Property.id) \
        .join(Client, Booking.client_id == Client.id) \
        .where(Booking.organization_id == org_id)
    
    if status:
        query = query.where(Booking.status == status)
    
    query = query.order_by(Booking.check_in.desc())
    
    result = await db.execute(query)
    
    bookings_list = []
    for row in result:
        booking = row[0]
        booking.property_name = row[1]
        booking.client_name = row[2]
        bookings_list.append(booking)
        
    return bookings_list


@router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva reserva"""
    try:
        org_id = current_user.organization_id
        
        # Log para debugging
        print(f"🔍 Creating booking with data: {booking_data.model_dump()}")
        
        overlap_query = select(Booking).where(
            and_(
                Booking.property_id == uuid.UUID(booking_data.property_id),
                Booking.status != 'cancelled',
                Booking.organization_id == org_id,
                and_(
                    Booking.check_in < booking_data.check_out,
                    Booking.check_out > booking_data.check_in
                )
            )
        )
        result = await db.execute(overlap_query)
        if result.first():
            raise HTTPException(status_code=400, detail="La propiedad no está disponible en esas fechas")

        total_price = Decimal(str(booking_data.total_price_usd))
        advance = Decimal(str(booking_data.advance_payment_usd or 0))
        exchange_rate = Decimal(str(booking_data.exchange_rate or 1.0))
        
        # Lógica de cálculo de saldo con conversión
        advance_in_total_currency = advance
        
        # Caso común: Precio en USD y Anticipo en ARS
        if booking_data.total_price_currency == 'USD' and booking_data.advance_payment_currency == 'ARS':
            if exchange_rate > 0:
                advance_in_total_currency = advance / exchange_rate
        # Caso inverso: Precio en ARS y Anticipo en USD (menos común pero posible)
        elif booking_data.total_price_currency == 'ARS' and booking_data.advance_payment_currency == 'USD':
            advance_in_total_currency = advance * exchange_rate
            
        left_to_pay = total_price - advance_in_total_currency

        new_booking = Booking(
            id=uuid.uuid4(),
            organization_id=org_id,
            property_id=uuid.UUID(booking_data.property_id),
            client_id=uuid.UUID(booking_data.client_id),
            check_in=booking_data.check_in,
            check_out=booking_data.check_out,
            guests_count=booking_data.guests_count,
            total_price_usd=total_price,
            total_price_currency=booking_data.total_price_currency,
            advance_payment_usd=advance,
            advance_payment_currency=booking_data.advance_payment_currency,
            balance_payment_usd=left_to_pay,
            deposit_ars=Decimal(str(booking_data.deposit_ars or 0)),
            deposit_currency=booking_data.deposit_currency,
            exchange_rate=exchange_rate,
            left_to_pay_usd=left_to_pay,
            status=booking_data.status,
            payment_status=booking_data.payment_status,
            service_status=booking_data.service_status
        )
        
        db.add(new_booking)
        await db.commit()
        await db.refresh(new_booking)
        
        prop_query = select(Property.name).where(Property.id == new_booking.property_id)
        client_query = select(Client.full_name).where(Client.id == new_booking.client_id)
        
        new_booking.property_name = (await db.execute(prop_query)).scalar()
        new_booking.client_name = (await db.execute(client_query)).scalar()
        
        print(f"✅ Booking created successfully: {new_booking.id}")
        return new_booking
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating booking: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error al crear la reserva: {str(e)}")


@router.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    booking_data: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una reserva"""
    org_id = current_user.organization_id
    # También verificar org_id aquí por seguridad
    query = select(Booking).where(and_(Booking.id == uuid.UUID(booking_id), Booking.organization_id == org_id))
    result = await db.execute(query)
    booking_obj = result.scalar_one_or_none()
    
    if not booking_obj:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    update_data = booking_data.model_dump(exclude_unset=True)

    # Verificar si se envió left_to_pay_usd explícitamente (ej: al saldar)
    left_to_pay_sent = 'left_to_pay_usd' in update_data

    for field, value in update_data.items():
        if field in ['total_price_usd', 'advance_payment_usd', 'deposit_ars', 'exchange_rate', 'balance_payment_usd', 'left_to_pay_usd']:
             value = Decimal(str(value))
        setattr(booking_obj, field, value)

    # Solo recalcular saldo si NO se envió left_to_pay_usd explícitamente
    # Esto permite que al saldar una reserva se envíe left_to_pay_usd: 0 directamente
    if not left_to_pay_sent:
        total_price = booking_obj.total_price_usd
        advance = booking_obj.advance_payment_usd or Decimal(0)
        exchange_rate = booking_obj.exchange_rate or Decimal(1.0)

        advance_in_total_currency = advance

        if booking_obj.total_price_currency == 'USD' and booking_obj.advance_payment_currency == 'ARS':
            if exchange_rate > 0:
                advance_in_total_currency = advance / exchange_rate
        elif booking_obj.total_price_currency == 'ARS' and booking_obj.advance_payment_currency == 'USD':
            advance_in_total_currency = advance * exchange_rate

        booking_obj.left_to_pay_usd = total_price - advance_in_total_currency
        booking_obj.balance_payment_usd = booking_obj.left_to_pay_usd

    await db.commit()
    await db.refresh(booking_obj)
    
    prop_query = select(Property.name).where(Property.id == booking_obj.property_id)
    client_query = select(Client.full_name).where(Client.id == booking_obj.client_id)
    
    booking_obj.property_name = (await db.execute(prop_query)).scalar()
    booking_obj.client_name = (await db.execute(client_query)).scalar()
    
    return booking_obj


# --- DirecTV Endpoints ---

@router.get("/properties/{property_id}/directv", response_model=List[DirectvDeviceResponse])
async def get_directv_devices(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar dispositivos DirecTV de una propiedad"""
    query = select(DirectvDevice).where(DirectvDevice.property_id == uuid.UUID(property_id))
    result = await db.execute(query)
    devices = result.scalars().all()
    
    # Calcular días restantes en el vuelo
    now = datetime.now(timezone.utc)
    response = []
    for dev in devices:
        days_remaining = 0
        if dev.expiry_date:
             # Asegurar que expiry_date tenga timezone
             expiry = dev.expiry_date
             if expiry.tzinfo is None:
                 expiry = expiry.replace(tzinfo=timezone.utc)
                 
             diff = expiry - now
             days_remaining = max(0, diff.days)
        
        # Crear objeto de respuesta manualmente o dejar que Pydantic lo haga, 
        # pero necesitamos inyectar days_remaining
        dev_dict = dev.__dict__.copy()
        dev_dict['days_remaining'] = days_remaining
        response.append(dev_dict)
        
    return response

@router.post("/properties/{property_id}/directv", response_model=DirectvDeviceResponse)
async def create_directv_device(
    property_id: str,
    device_data: DirectvDeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Agregar un dispositivo DirecTV"""
    new_device = DirectvDevice(
        id=uuid.uuid4(),
        property_id=uuid.UUID(property_id),
        location=device_data.location,
        card_number=device_data.card_number,
        recharge_code=device_data.recharge_code
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    return new_device

@router.post("/directv/{device_id}/recharge", response_model=DirectvDeviceResponse)
async def recharge_directv_device(
    device_id: str,
    recharge_data: DirectvDeviceRecharge,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar recarga en un dispositivo"""
    query = select(DirectvDevice).where(DirectvDevice.id == uuid.UUID(device_id))
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
        
    now = datetime.now(timezone.utc)
    
    # Calcular nueva fecha de expiración
    # Si ya tiene fecha futura, sumamos a esa. Si no (o está vencida), desde hoy.
    current_expiry = device.expiry_date
    if current_expiry and current_expiry.tzinfo is None:
        current_expiry = current_expiry.replace(tzinfo=timezone.utc)
        
    if current_expiry and current_expiry > now:
        new_expiry = current_expiry + timedelta(days=recharge_data.days)
    else:
        new_expiry = now + timedelta(days=recharge_data.days)
        
    device.last_amount_loaded = Decimal(str(recharge_data.amount))
    device.last_days_loaded = recharge_data.days
    device.loaded_at = now
    device.expiry_date = new_expiry
    if recharge_data.recharge_code:
        device.recharge_code = recharge_data.recharge_code
        
    await db.commit()
    await db.refresh(device)
    
    # Calcular days_remaining para la respuesta
    diff = new_expiry - now
    device.days_remaining = max(0, diff.days)
    
    return device

@router.delete("/directv/{device_id}")
async def delete_directv_device(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar dispositivo"""
    query = select(DirectvDevice).where(DirectvDevice.id == uuid.UUID(device_id))
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    
    if device:
        await db.delete(device)
        await db.commit()
    
    return {"message": "Dispositivo eliminado"}


    return {"message": "Dispositivo eliminado"}


# --- TASKS ENDPOINTS ---

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las tareas de la organización"""
    org_id = current_user.organization_id
    query = select(Task).where(Task.organization_id == org_id).order_by(Task.is_completed, Task.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks

@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva tarea"""
    org_id = current_user.organization_id
    
    new_task = Task(
        id=uuid.uuid4(),
        organization_id=org_id,
        property_id=uuid.UUID(task_data.property_id) if task_data.property_id else None,
        title=task_data.title,
        description=task_data.description,
        due_date=task_data.due_date
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una tarea"""
    org_id = current_user.organization_id
    query = select(Task).where(and_(Task.id == uuid.UUID(task_id), Task.organization_id == org_id))
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'property_id':
             value = uuid.UUID(value) if value else None
        setattr(task, field, value)
        
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una tarea"""
    org_id = current_user.organization_id
    query = delete(Task).where(and_(Task.id == uuid.UUID(task_id), Task.organization_id == org_id))
    await db.execute(query)
    await db.commit()
    return {"message": "Tarea eliminada exitosamente"}


@router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una reserva"""
    org_id = current_user.organization_id
    query = delete(Booking).where(and_(Booking.id == uuid.UUID(booking_id), Booking.organization_id == org_id))
    await db.execute(query)
    await db.commit()
    return {"message": "Reserva eliminada exitosamente"}


# --- PROPERTIES ENDPOINTS ---

@router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las propiedades"""
    try:
        org_id = current_user.organization_id
        query = select(Property).where(Property.organization_id == org_id).order_by(Property.name)
        result = await db.execute(query)
        properties = result.scalars().all()
        return properties
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR GETTING PROPERTIES: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/properties", response_model=PropertyResponse)
async def create_property(
    property_data: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva propiedad"""
    org_id = current_user.organization_id
    
    new_property = Property(
        id=uuid.uuid4(),
        organization_id=org_id,
        name=property_data.name,
        address=property_data.address,
        city=property_data.city,
        state=property_data.state,
        country=property_data.country,
        capacity=property_data.capacity,
        bedrooms=property_data.bedrooms,
        bathrooms=property_data.bathrooms,
        description=property_data.description,
        status=property_data.status,
        property_type=property_data.property_type,
        amenities=property_data.amenities,
        check_in_day=property_data.check_in_day,
        check_out_day=property_data.check_out_day,
        rental_unit=property_data.rental_unit
    )
    
    db.add(new_property)
    await db.commit()
    await db.refresh(new_property)
    return new_property


@router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_data: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una propiedad existente"""
    org_id = current_user.organization_id
    query = select(Property).where(and_(Property.id == uuid.UUID(property_id), Property.organization_id == org_id))
    result = await db.execute(query)
    property_obj = result.scalar_one_or_none()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    update_data = property_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property_obj, field, value)
    
    await db.commit()
    await db.refresh(property_obj)
    return property_obj


@router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una propiedad"""
    org_id = current_user.organization_id
    
    # Verificar si tiene reservas asociadas
    bookings_query = select(func.count(Booking.id)).where(
        and_(
            Booking.property_id == uuid.UUID(property_id),
            Booking.organization_id == org_id
        )
    )
    result = await db.execute(bookings_query)
    bookings_count = result.scalar()
    
    if bookings_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar. La propiedad tiene {bookings_count} reservas asociadas."
        )
    
    delete_query = delete(Property).where(and_(Property.id == uuid.UUID(property_id), Property.organization_id == org_id))
    await db.execute(delete_query)
    await db.commit()
    
    return {"message": "Propiedad eliminada exitosamente"}


# --- CLIENTS ENDPOINTS ---

@router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todos los clientes"""
    org_id = current_user.organization_id
    query = select(Client).where(Client.organization_id == org_id).order_by(Client.full_name)
    result = await db.execute(query)
    clients = result.scalars().all()
    return clients


@router.post("/clients", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo cliente"""
    org_id = current_user.organization_id
    
    new_client = Client(
        id=uuid.uuid4(),
        organization_id=org_id,
        full_name=client_data.full_name,
        document_type=client_data.document_type,
        document_id=client_data.document_id,
        email=client_data.email,
        phone=client_data.phone,
        whatsapp=client_data.whatsapp,
        nationality=client_data.nationality,
        notes=client_data.notes
    )
    
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)
    return new_client


@router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un cliente existente"""
    org_id = current_user.organization_id
    query = select(Client).where(and_(Client.id == uuid.UUID(client_id), Client.organization_id == org_id))
    result = await db.execute(query)
    client_obj = result.scalar_one_or_none()
    
    if not client_obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client_obj, field, value)
    
    await db.commit()
    await db.refresh(client_obj)
    return client_obj


@router.delete("/clients/{client_id}")
async def delete_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un cliente"""
    org_id = current_user.organization_id
    
    # Verificar si tiene reservas asociadas
    bookings_query = select(func.count(Booking.id)).where(
        and_(
            Booking.client_id == uuid.UUID(client_id),
            Booking.organization_id == org_id
        )
    )
    result = await db.execute(bookings_query)
    bookings_count = result.scalar()
    
    if bookings_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar. El cliente tiene {bookings_count} reservas asociadas."
        )
    
    delete_query = delete(Client).where(and_(Client.id == uuid.UUID(client_id), Client.organization_id == org_id))
    await db.execute(delete_query)
    await db.commit()
    
    return {"message": "Cliente eliminado exitosamente"}


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas del dashboard - Versión optimizada"""
    org_id = current_user.organization_id
    
    # --- QUERIES ESENCIALES PARALELAS ---
    
    # 1. Total Recaudado ARS (histórico)
    total_revenue_ars_query = select(func.sum(Booking.total_price_usd)).where(
        and_(
            Booking.status.in_(['confirmed', 'active', 'completed']),
            Booking.organization_id == org_id,
            Booking.total_price_currency == 'ARS'
        )
    )
    
    # 1b. Total Recaudado USD (histórico)
    total_revenue_usd_query = select(func.sum(Booking.total_price_usd)).where(
        and_(
            Booking.status.in_(['confirmed', 'active', 'completed']),
            Booking.organization_id == org_id,
            Booking.total_price_currency == 'USD'
        )
    )
    
    # 2. Ingresos del mes actual
    current_month_start = date.today().replace(day=1)
    if current_month_start.month == 12:
        next_month_start = date(current_month_start.year + 1, 1, 1)
    else:
        next_month_start = date(current_month_start.year, current_month_start.month + 1, 1)

    revenue_month_query = select(func.sum(Booking.total_price_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_in >= current_month_start,
            Booking.check_in < next_month_start,
            Booking.organization_id == org_id
        )
    )

    # 2b. Ingresos del mes actual en ARS
    revenue_month_ars_query = select(func.sum(Booking.total_price_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_in >= current_month_start,
            Booking.check_in < next_month_start,
            Booking.organization_id == org_id,
            Booking.total_price_currency == 'ARS'
        )
    )

    # 2c. Ingresos del mes actual en USD
    revenue_month_usd_query = select(func.sum(Booking.total_price_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_in >= current_month_start,
            Booking.check_in < next_month_start,
            Booking.organization_id == org_id,
            Booking.total_price_currency == 'USD'
        )
    )

    # 3. Anticipos ARS
    advances_ars_query = select(func.sum(Booking.advance_payment_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.organization_id == org_id,
            Booking.advance_payment_currency == 'ARS'
        )
    )
    
    # 4. Anticipos USD
    advances_usd_query = select(func.sum(Booking.advance_payment_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.organization_id == org_id,
            Booking.advance_payment_currency == 'USD'
        )
    )

    # 4b. Anticipos del mes actual en ARS
    advances_month_ars_query = select(func.sum(Booking.advance_payment_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_in >= current_month_start,
            Booking.check_in < next_month_start,
            Booking.organization_id == org_id,
            Booking.advance_payment_currency == 'ARS'
        )
    )

    # 4c. Anticipos del mes actual en USD
    advances_month_usd_query = select(func.sum(Booking.advance_payment_usd)).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_in >= current_month_start,
            Booking.check_in < next_month_start,
            Booking.organization_id == org_id,
            Booking.advance_payment_currency == 'USD'
        )
    )

    # 5. Total propiedades DISPONIBLES (solo las que se pueden alquilar)
    total_properties_query = select(func.count(Property.id)).where(
        and_(
            Property.organization_id == org_id,
            Property.status == 'available'
        )
    )

    # 5b. Total propiedades (todas, sin filtrar por estado) - para el cálculo de ocupación,
    # igual que el frontend (getProperties() no filtra por status)
    all_properties_query = select(func.count(Property.id)).where(
        Property.organization_id == org_id
    )

    # 6. Reservas activas (confirmadas o en curso)
    active_bookings_query = select(func.count(Booking.id)).where(
        and_(
            Booking.organization_id == org_id,
            Booking.status.in_(['confirmed', 'active'])
        )
    )

    # 7. Check-ins de hoy
    checkins_today_query = select(func.count(Booking.id)).where(
        and_(
            Booking.organization_id == org_id,
            Booking.status != 'cancelled',
            Booking.check_in == date.today()
        )
    )

    # Ejecutar todas las queries en paralelo
    results = await db.execute(
        select(
            func.coalesce(total_revenue_ars_query.scalar_subquery(), 0).label('total_revenue_ars'),
            func.coalesce(total_revenue_usd_query.scalar_subquery(), 0).label('total_revenue_usd'),
            func.coalesce(revenue_month_query.scalar_subquery(), 0).label('revenue_month'),
            func.coalesce(revenue_month_ars_query.scalar_subquery(), 0).label('revenue_month_ars'),
            func.coalesce(revenue_month_usd_query.scalar_subquery(), 0).label('revenue_month_usd'),
            func.coalesce(advances_ars_query.scalar_subquery(), 0).label('advances_ars'),
            func.coalesce(advances_usd_query.scalar_subquery(), 0).label('advances_usd'),
            func.coalesce(advances_month_ars_query.scalar_subquery(), 0).label('advances_month_ars'),
            func.coalesce(advances_month_usd_query.scalar_subquery(), 0).label('advances_month_usd'),
            func.coalesce(total_properties_query.scalar_subquery(), 1).label('total_properties'),
            func.coalesce(all_properties_query.scalar_subquery(), 0).label('all_properties'),
            func.coalesce(active_bookings_query.scalar_subquery(), 0).label('active_bookings'),
            func.coalesce(checkins_today_query.scalar_subquery(), 0).label('checkins_today')
        )
    )

    row = results.first()
    total_revenue_ars = float(row.total_revenue_ars) if row else 0.0
    total_revenue_usd = float(row.total_revenue_usd) if row else 0.0
    total_revenue_month = float(row.revenue_month) if row else 0.0
    total_revenue_month_ars = float(row.revenue_month_ars) if row else 0.0
    total_revenue_month_usd = float(row.revenue_month_usd) if row else 0.0
    total_advance_ars = float(row.advances_ars) if row else 0.0
    total_advance_usd = float(row.advances_usd) if row else 0.0
    total_advance_month_ars = float(row.advances_month_ars) if row else 0.0
    total_advance_month_usd = float(row.advances_month_usd) if row else 0.0
    total_properties_count = int(row.total_properties) if row else 1
    all_properties_count = int(row.all_properties) if row else 0
    active_bookings_count = int(row.active_bookings) if row else 0
    checkins_today_count = int(row.checkins_today) if row else 0

    # --- OCUPACIÓN DEL MES ACTUAL ---
    # Mismo cálculo que el frontend: noches reservadas (recorte al mes actual) /
    # (cantidad total de propiedades * días del mes actual)
    occupancy_rate = 0.0
    if all_properties_count > 0:
        days_in_current_month = (next_month_start - current_month_start).days
        total_available_nights = all_properties_count * days_in_current_month

        occupancy_bookings_query = select(Booking).where(
            and_(
                Booking.organization_id == org_id,
                Booking.status != 'cancelled',
                Booking.check_in < next_month_start,
                Booking.check_out > current_month_start
            )
        )
        occupancy_bookings_result = await db.execute(occupancy_bookings_query)
        occupancy_bookings = occupancy_bookings_result.scalars().all()

        booked_nights = 0
        for booking in occupancy_bookings:
            overlap_start = max(booking.check_in, current_month_start)
            overlap_end = min(booking.check_out, next_month_start)
            nights = (overlap_end - overlap_start).days
            if nights > 0:
                booked_nights += nights

        if total_available_nights > 0:
            occupancy_rate = min(100.0, round((booked_nights / total_available_nights) * 100, 2))

    # --- FORECAST DE DISPONIBILIDAD ---
    availability_forecast = []
    
    current_date = date.today()
    target_months = []
    
    # Definir meses de temporada: Dic, Ene, Feb, Mar
    if current_date.month <= 3:
        season_start_year = current_date.year - 1
    else:
        season_start_year = current_date.year
        
    target_months = [
        date(season_start_year, 12, 1),
        date(season_start_year + 1, 1, 1),
        date(season_start_year + 1, 2, 1),
        date(season_start_year + 1, 3, 1)
    ]

    # Obtener todas las reservas futuras
    future_bookings_query = select(Booking).where(
        and_(
            Booking.status != 'cancelled',
            Booking.check_out >= current_date,
            Booking.organization_id == org_id
        )
    )
    future_bookings_result = await db.execute(future_bookings_query)
    all_future_bookings = future_bookings_result.scalars().all()

    for month_start in target_months:
        if month_start.month == 12:
            month_end = date(month_start.year + 1, 1, 1)
        else:
            month_end = date(month_start.year, month_start.month + 1, 1)
        
        days_in_month = (month_end - month_start).days
        day_occupancy = {day: 0 for day in range(1, days_in_month + 1)}
        
        for booking in all_future_bookings:
            start = max(booking.check_in, month_start)
            booking_end_exclusive = booking.check_out
            
            # Iterar por los días que la reserva ocupa en este mes
            # Convertir a ordinal para iterar fácilmente
            curr_ord = start.toordinal()
            end_ord = min(booking_end_exclusive.toordinal(), month_end.toordinal())
            
            for d_ord in range(curr_ord, end_ord):
                d_date = date.fromordinal(d_ord)
                if d_date.month == month_start.month:
                    day_occupancy[d_date.day] += 1
        
        free_days = []
        start_day_scan = 1
        
        # Si es el mes actual, solo contar desde HOY
        if month_start.month == current_date.month and month_start.year == current_date.year:
            start_day_scan = current_date.day
            
        total_days_to_consider = days_in_month - start_day_scan + 1
        if total_days_to_consider < 0: total_days_to_consider = 0

        # CORREGIDO: Contar días con CUALQUIER disponibilidad (ocupación < total de propiedades)
        # Si tenés 4 propiedades y solo 2 están ocupadas, ese día se cuenta como disponible
        
        # DEBUG: Imprimir info del mes actual
        if month_start.month == current_date.month and month_start.year == current_date.year:
            print(f"🔍 DEBUG FEBRERO {month_start.year}:")
            print(f"  - Total propiedades: {total_properties_count}")
            print(f"  - Días del mes: {days_in_month}")
            print(f"  - Empezar a contar desde día: {start_day_scan}")
            print(f"  - Ocupación por día: {day_occupancy}")
        
        for d in range(start_day_scan, days_in_month + 1):
            if day_occupancy[d] < total_properties_count:
                free_days.append(d)
        
        ranges = []
        if free_days:
            range_start = free_days[0]
            prev = free_days[0]
            
            for d in free_days[1:]:
                if d == prev + 1:
                    prev = d
                else:
                    ranges.append(f"{range_start}-{prev}" if range_start != prev else f"{range_start}")
                    range_start = d
                    prev = d
            ranges.append(f"{range_start}-{prev}" if range_start != prev else f"{range_start}")
            
        status = 'partial'
        # Si todos los días tienen disponibilidad -> FULL
        if len(free_days) >= total_days_to_consider and total_days_to_consider > 0:
            status = 'full'
        # Si NO hay ningún día con disponibilidad -> NONE
        elif len(free_days) == 0:
            status = 'none'
        # Si hay algunos días con disponibilidad -> PARTIAL
        else:
            status = 'partial'

            
        month_names = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        
        # Solo agregar si estamos en rango Dic-Mar o es el mes actual
        if month_start.month in [12, 1, 2, 3] or (month_start.month == current_date.month and month_start.year == current_date.year) or month_start.year > current_date.year:
             availability_forecast.append({
                "month_name": month_names[month_start.month],
                "year": month_start.year,
                "total_free_days": len(free_days),
                "status": status,
                "free_ranges": ranges
            })
    
    # DirecTV Devices Summary (optimizado - solo traer lo necesario)
    dtv_query = select(DirectvDevice).join(Property).where(Property.organization_id == org_id).limit(4)
    dtv_result = await db.execute(dtv_query)
    dtv_devices = dtv_result.scalars().all()
    
    dtv_summary = []
    now_utc = datetime.now(timezone.utc)
    
    for dev in dtv_devices:
        days_remaining = 0
        if dev.expiry_date:
            expiry = dev.expiry_date
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            diff = expiry - now_utc
            days_remaining = max(0, diff.days)
        
        dtv_summary.append({
            'id': str(dev.id),
            'location': dev.location,
            'card_number': dev.card_number,
            'days_remaining': days_remaining
        })
    
    return DashboardStats(
        active_bookings=active_bookings_count,
        total_revenue_month=total_revenue_month,
        total_revenue_month_ars=total_revenue_month_ars,
        total_revenue_month_usd=total_revenue_month_usd,
        occupancy_rate=occupancy_rate,
        checkins_today=checkins_today_count,
        availability_forecast=availability_forecast,
        total_revenue_accumulated=total_revenue_ars + total_revenue_usd,  # Total combinado
        total_revenue_accumulated_ars=total_revenue_ars,
        total_revenue_accumulated_usd=total_revenue_usd,
        total_bookings_accumulated=0,
        total_advance_ars=total_advance_ars,
        total_advance_usd=total_advance_usd,
        total_advance_month_ars=total_advance_month_ars,
        total_advance_month_usd=total_advance_month_usd,
        directv_devices_summary=dtv_summary
    )

@router.get("/accounting/stats", response_model=AccountingStats)
async def get_accounting_stats(
    month: Optional[int] = None,
    year1: Optional[int] = None,
    year2: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    current_date = date.today()
    
    # Si se pasan parámetros específicos, comparamos esos dos meses/años
    if month and year1 and year2:
        target_periods = [(year1, month), (year2, month)]
        all_stats = []
        month_names = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        
        for y, m in target_periods:
            start_date = date(y, m, 1)
            if m == 12:
                end_date = date(y + 1, 1, 1)
            else:
                end_date = date(y, m + 1, 1)
                
            revenue_query = select(func.sum(Booking.total_price_usd)).where(
                and_(
                    Booking.organization_id == org_id,
                    Booking.status.in_(['confirmed', 'active', 'completed']),
                    Booking.check_in >= start_date,
                    Booking.check_in < end_date
                )
            )
            revenue_result = await db.execute(revenue_query)
            total_revenue = revenue_result.scalar() or Decimal('0')
            
            count_query = select(func.count(Booking.id)).where(
                and_(
                    Booking.organization_id == org_id,
                    Booking.status.in_(['confirmed', 'active', 'completed']),
                    Booking.check_in >= start_date,
                    Booking.check_in < end_date
                )
            )
            count_result = await db.execute(count_query)
            bookings_count = count_result.scalar() or 0
            
            all_stats.append(SeasonStats(
                year=y,
                month=m,
                month_name=month_names[m],
                total_revenue=float(total_revenue),
                bookings_count=bookings_count,
                occupancy_rate=0.0
            ))
            
        return AccountingStats(
            current_season_total=all_stats[0].total_revenue,
            previous_season_total=all_stats[1].total_revenue,
            comparisons=all_stats
        )

    # Lógica por defecto (Temporada Dic-Mar)
    # Si estamos en Ene-Mar, la temporada empezó en Dic del año anterior
    # Si estamos en Dic, la temporada es el año actual + Ene-Mar del siguiente
    if current_date.month <= 3:
        current_season_year = current_date.year - 1
    else:
        current_season_year = current_date.year
        
    seasons = [current_season_year, current_season_year - 1]
    all_stats = []
    
    month_names = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    
    for year in seasons:
        # Meses: Dic (year), Ene (year+1), Feb (year+1), Mar (year+1)
        target_months = [
            (year, 12),
            (year + 1, 1),
            (year + 1, 2),
            (year + 1, 3)
        ]
        
        for y, m in target_months:
            # Calcular ingresos y ocupación para este mes/año
            start_date = date(y, m, 1)
            if m == 12:
                end_date = date(y + 1, 1, 1)
            else:
                end_date = date(y, m + 1, 1)
                
            # Ingresos
            revenue_query = select(func.sum(Booking.total_price_usd)).where(
                and_(
                    Booking.organization_id == org_id,
                    Booking.status.in_(['confirmed', 'active', 'completed']),
                    Booking.check_in >= start_date,
                    Booking.check_in < end_date
                )
            )
            revenue_result = await db.execute(revenue_query)
            total_revenue = revenue_result.scalar() or Decimal('0')
            
            # Cantidad de reservas
            count_query = select(func.count(Booking.id)).where(
                and_(
                    Booking.organization_id == org_id,
                    Booking.status.in_(['confirmed', 'active', 'completed']),
                    Booking.check_in >= start_date,
                    Booking.check_in < end_date
                )
            )
            count_result = await db.execute(count_query)
            bookings_count = count_result.scalar() or 0
            
            # Ocupación (simplificada: promedio de días ocupados)
            # Para un análisis real de rentabilidad, esto sirve como base
            all_stats.append(SeasonStats(
                year=y,
                month=m,
                month_name=month_names[m],
                total_revenue=float(total_revenue),
                bookings_count=bookings_count,
                occupancy_rate=0.0 # Se podría calcular con más detalle si fuera necesario
            ))

    # Recalcular totales correctamente
    current_season_months = [(current_season_year, 12), (current_season_year + 1, 1), (current_season_year + 1, 2), (current_season_year + 1, 3)]
    prev_season_months = [(current_season_year - 1, 12), (current_season_year, 1), (current_season_year, 2), (current_season_year, 3)]
    
    current_total = sum(s.total_revenue for s in all_stats if (s.year, s.month) in current_season_months)
    previous_total = sum(s.total_revenue for s in all_stats if (s.year, s.month) in prev_season_months)

    return AccountingStats(
        current_season_total=current_total,
        previous_season_total=previous_total,
        comparisons=all_stats
    )


# --- IMPORT/EXPORT ENDPOINTS ---

@router.post("/bookings/import")
async def import_bookings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Importar reservas desde CSV"""
    org_id = current_user.organization_id
    bookings_data = data.get('bookings', [])
    
    print(f"🔍 Importing {len(bookings_data)} bookings")
    print(f"📦 First booking data sample: {bookings_data[0] if bookings_data else 'No data'}")
    
    success_count = 0
    failed_count = 0
    errors = []
    
    # Obtener la primera propiedad disponible para asignar las reservas
    property_query = select(Property).where(Property.organization_id == org_id).limit(1)
    property_result = await db.execute(property_query)
    default_property = property_result.scalar_one_or_none()
    
    if not default_property:
        raise HTTPException(status_code=400, detail="No hay propiedades registradas. Crea al menos una propiedad antes de importar.")
    
    print(f"✅ Using default property: {default_property.name}")
    
    for index, booking_data in enumerate(bookings_data):
        try:
            print(f"\n--- Processing booking {index + 1} ---")
            print(f"Data: {booking_data}")
            
            # Buscar o crear cliente
            client_name = booking_data.get('clientName', '').strip()
            if not client_name:
                failed_count += 1
                error_msg = f"Fila {index + 1}: Cliente sin nombre"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
                continue
                
            client_query = select(Client).where(
                and_(
                    Client.organization_id == org_id,
                    Client.full_name == client_name
                )
            )
            client_result = await db.execute(client_query)
            client = client_result.scalar_one_or_none()
            
            if not client:
                # Crear nuevo cliente
                client = Client(
                    id=str(uuid.uuid4()),
                    organization_id=org_id,
                    full_name=client_name,
                    email=f"{client_name.lower().replace(' ', '.')}@imported.com",
                    phone="",
                    document_id="",
                    document_type=""
                )
                db.add(client)
                await db.flush()
            
            print(f"✅ Client: {client.full_name} (ID: {client.id})")
            
            # Calcular anticipo basado en leftToPay
            print(f"Processing prices - Price: {booking_data.get('price')}, LeftToPay: {booking_data.get('leftToPay')}")
            
            total_price = Decimal(str(booking_data['price']))
            left_to_pay = Decimal(str(booking_data.get('leftToPay', booking_data['price'])))
            advance_payment = total_price - left_to_pay
            
            # Crear reserva
            new_booking = Booking(
                id=str(uuid.uuid4()),
                organization_id=org_id,
                property_id=default_property.id,
                client_id=client.id,
                check_in=datetime.strptime(booking_data['checkIn'], '%Y-%m-%d').date(),
                check_out=datetime.strptime(booking_data['checkOut'], '%Y-%m-%d').date(),
                guests_count=2,  # Default
                total_price_usd=total_price,
                total_price_currency=booking_data.get('currency', 'USD'),
                advance_payment_usd=advance_payment if advance_payment > 0 else Decimal('0'),
                advance_payment_currency=booking_data.get('currency', 'USD'),
                balance_payment_usd=left_to_pay,
                deposit_ars=Decimal(str(booking_data.get('deposit', 0))),
                deposit_currency=booking_data.get('depositCurrency', 'ARS'),
                left_to_pay_usd=left_to_pay,
                status=booking_data.get('status', 'pending'),
                payment_status='pending' if left_to_pay > 0 else 'paid',
                service_status='SERVICIOS' if booking_data.get('status', '').lower() == 'active' else 'NO SERVICIOS',
                exchange_rate=Decimal('1200')  # Default
            )
            
            db.add(new_booking)
            success_count += 1
            print(f"✅ Booking created successfully for {client_name}")
            
        except KeyError as e:
            failed_count += 1
            error_msg = f"Fila {index + 1} ({booking_data.get('clientName', 'desconocido')}): Falta campo requerido {str(e)}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
        except ValueError as e:
            failed_count += 1
            error_msg = f"Fila {index + 1} ({booking_data.get('clientName', 'desconocido')}): Valor inválido - {str(e)}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
        except Exception as e:
            failed_count += 1
            error_msg = f"Fila {index + 1} ({booking_data.get('clientName', 'desconocido')}): {str(e)}"
            errors.append(error_msg)
            print(f"❌ Error importing booking: {e}")
            import traceback
            traceback.print_exc()
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar las reservas: {str(e)}")
    
    return {
        "success": success_count,
        "failed": failed_count,
        "errors": errors
    }


@router.get("/bookings/export")
async def export_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exportar reservas a CSV"""
    org_id = current_user.organization_id
    
    # Obtener todas las reservas
    query = select(Booking, Property.name.label("property_name"), Client.full_name.label("client_name")) \
        .join(Property, Booking.property_id == Property.id) \
        .join(Client, Booking.client_id == Client.id) \
        .where(Booking.organization_id == org_id) \
        .order_by(Booking.check_in.desc())
    
    result = await db.execute(query)
    bookings = result.all()
    
    # Crear CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Escribir encabezados
    writer.writerow([
        'Name',
        'Lease Start Date',
        'Lease End Date',
        'Price',
        'Deposit',
        'Left to Pay',
        'Status',
        'Property',
        'Payment Status'
    ])
    
    # Escribir datos
    for booking, property_name, client_name in bookings:
        writer.writerow([
            client_name,
            booking.check_in.strftime('%B %d, %Y'),
            booking.check_out.strftime('%B %d, %Y'),
            f"{booking.total_price_currency} {booking.total_price_usd}",
            f"{booking.deposit_currency} {booking.deposit_ars}",
            f"{booking.total_price_currency} {booking.left_to_pay_usd}",
            'SERVICIOS' if booking.service_status != 'NO SERVICIOS' else 'NO SERVICIOS',
            property_name,
            booking.payment_status
        ])
    
    # Preparar respuesta
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=reservas-{datetime.now().strftime('%Y-%m-%d')}.csv"
        }
    )


# --- EXPENSES (Gastos y Reparaciones) ENDPOINTS ---

@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    year: Optional[int] = None,
    property_id: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todos los gastos con filtros opcionales"""
    org_id = current_user.organization_id

    query = select(Expense, Property.name.label("property_name")) \
        .join(Property, Expense.property_id == Property.id) \
        .where(Expense.organization_id == org_id)

    # Aplicar filtros
    if year:
        from sqlalchemy import extract
        query = query.where(extract('year', Expense.date) == year)

    if property_id:
        query = query.where(Expense.property_id == uuid.UUID(property_id))

    if category:
        query = query.where(Expense.category == category)

    query = query.order_by(Expense.date.desc())

    result = await db.execute(query)
    rows = result.all()

    from app.core.minio_client import get_presigned_url

    expenses = []
    for expense, property_name in rows:
        expense.property_name = property_name
        # Generar URL firmada para visualización
        if expense.receipt_url:
            expense.receipt_url = get_presigned_url(expense.receipt_url)
        expenses.append(expense)

    return expenses


@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(
    property_id: str = Form(...),
    date: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    provider: str = Form(...),
    amount: float = Form(...),
    currency: str = Form("ARS"),
    status: str = Form("pending"),
    notes: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo gasto con factura opcional"""
    org_id = current_user.organization_id

    receipt_url = None
    receipt_filename = None

    # Subir factura a MinIO si se proporciona
    if receipt and receipt.filename:
        from app.core.minio_client import upload_file_to_minio
        receipt_url, receipt_filename = await upload_file_to_minio(
            file=receipt,
            folder="expenses",
            organization_id=str(org_id)
        )

    # Parsear la fecha
    from datetime import datetime as dt
    expense_date = dt.strptime(date, "%Y-%m-%d").date()

    new_expense = Expense(
        organization_id=org_id,
        property_id=uuid.UUID(property_id),
        date=expense_date,
        category=category,
        description=description,
        provider=provider,
        amount=Decimal(str(amount)),
        currency=currency,
        status=status,
        notes=notes,
        receipt_url=receipt_url,
        receipt_filename=receipt_filename
    )

    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    # Obtener nombre de propiedad
    prop_query = select(Property.name).where(Property.id == new_expense.property_id)
    new_expense.property_name = (await db.execute(prop_query)).scalar()

    # Generar URL firmada para la respuesta
    if new_expense.receipt_url:
        from app.core.minio_client import get_presigned_url
        new_expense.receipt_url = get_presigned_url(new_expense.receipt_url)

    return new_expense


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    property_id: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    currency: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un gasto existente"""
    org_id = current_user.organization_id

    query = select(Expense).where(
        and_(
            Expense.id == uuid.UUID(expense_id),
            Expense.organization_id == org_id
        )
    )
    result = await db.execute(query)
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    # Actualizar campos si se proporcionan
    if property_id:
        expense.property_id = uuid.UUID(property_id)
    if date:
        from datetime import datetime as dt
        expense.date = dt.strptime(date, "%Y-%m-%d").date()
    if category:
        expense.category = category
    if description:
        expense.description = description
    if provider:
        expense.provider = provider
    if amount is not None:
        expense.amount = Decimal(str(amount))
    if currency:
        expense.currency = currency
    if status:
        expense.status = status
    if notes is not None:
        expense.notes = notes

    # Subir nueva factura si se proporciona
    if receipt and receipt.filename:
        from app.core.minio_client import upload_file_to_minio
        expense.receipt_url, expense.receipt_filename = await upload_file_to_minio(
            file=receipt,
            folder="expenses",
            organization_id=str(org_id)
        )

    await db.commit()
    await db.refresh(expense)

    # Obtener nombre de propiedad
    prop_query = select(Property.name).where(Property.id == expense.property_id)
    expense.property_name = (await db.execute(prop_query)).scalar()

    # Generar URL firmada para la respuesta
    if expense.receipt_url:
        from app.core.minio_client import get_presigned_url
        expense.receipt_url = get_presigned_url(expense.receipt_url)

    return expense


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un gasto"""
    org_id = current_user.organization_id

    query = select(Expense).where(
        and_(
            Expense.id == uuid.UUID(expense_id),
            Expense.organization_id == org_id
        )
    )
    result = await db.execute(query)
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    await db.delete(expense)
    await db.commit()

    return {"message": "Gasto eliminado correctamente"}


# --- EXPENSE CATEGORIES (Categorías personalizadas) ---

@router.get("/expense-categories", response_model=List[ExpenseCategoryResponse])
async def get_expense_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener categorías personalizadas de gastos"""
    org_id = current_user.organization_id

    query = select(ExpenseCategory).where(ExpenseCategory.organization_id == org_id)
    result = await db.execute(query)

    return result.scalars().all()


@router.post("/expense-categories", response_model=ExpenseCategoryResponse)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva categoría de gastos"""
    org_id = current_user.organization_id

    # Verificar que no exista ya
    existing = await db.execute(
        select(ExpenseCategory).where(
            and_(
                ExpenseCategory.organization_id == org_id,
                ExpenseCategory.value == category_data.value
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese valor")

    new_category = ExpenseCategory(
        organization_id=org_id,
        value=category_data.value,
        label=category_data.label,
        icon=category_data.icon,
        color=category_data.color
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return new_category


@router.delete("/expense-categories/{category_id}")
async def delete_expense_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una categoría de gastos"""
    org_id = current_user.organization_id

    query = select(ExpenseCategory).where(
        and_(
            ExpenseCategory.id == uuid.UUID(category_id),
            ExpenseCategory.organization_id == org_id
        )
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    await db.delete(category)
    await db.commit()

    return {"message": "Categoría eliminada correctamente"}

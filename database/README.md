# Modelo de Base de Datos - PropManager

## 📋 Resumen

Este documento describe el modelo de base de datos completo para el Sistema de Administración de Propiedades de Alquiler Temporal.

## 🗄️ Tecnología

- **Base de Datos**: PostgreSQL 14+
- **Extensiones**: uuid-ossp, pgcrypto
- **Total de Tablas**: 17 tablas principales
- **Total de Vistas**: 5 vistas analíticas

## 📊 Módulos del Sistema

### 1. Módulo de Usuarios y Autenticación
- **users**: Usuarios del sistema con OAuth Google

### 2. Módulo de Propiedades
- **properties**: Información de cada propiedad/unidad
- **property_policies**: Políticas específicas (check-in/out, anticipos, depósitos)

### 3. Módulo de Clientes
- **clients**: Inquilinos y sus datos de contacto

### 4. Módulo de Reservas
- **bookings**: Contratos de alquiler con fechas y precios

### 5. Módulo de Pagos
- **payments**: Registro detallado de todos los pagos
- **invoices**: Facturas y recibos emitidos

### 6. Módulo de Check-in/Check-out
- **checkins**: Inspección inicial y entrega de llaves
- **checkouts**: Inspección final y devolución de depósito

### 7. Módulo de Inventario
- **inventory**: Items por propiedad
- **inventory_history**: Historial de cambios

### 8. Módulo de Documentación
- **contracts**: Contratos generados
- **documents**: Archivos adjuntos (PDFs, fotos)

### 9. Módulo de Gastos
- **expenses**: Gastos operativos y mantenimiento

### 10. Módulo de Notificaciones
- **notifications**: Sistema de alertas para usuarios

## 🔑 Relaciones Principales

```
users ──┬─── properties (created_by)
        ├─── bookings (created_by)
        ├─── payments (verified_by)
        └─── notifications

properties ──┬─── property_policies
             ├─── bookings
             ├─── inventory
             └─── expenses

clients ──┬─── bookings
          └─── invoices

bookings ──┬─── payments
           ├─── invoices
           ├─── checkins
           ├─── checkouts
           └─── contracts
```

## 📈 Campos Calculados Automáticos

### Triggers Implementados
1. **update_updated_at**: Actualiza `updated_at` en modificaciones
2. **generate_booking_number**: Genera números de reserva automáticos (BK-2025-000001)

### Funciones Útiles
- Generación automática de códigos únicos
- Actualización de timestamps

## 🎯 Índices de Performance

Se han creado índices en:
- Fechas de reservas (check_in, check_out)
- Foreign keys (property_id, client_id, booking_id)
- Campos de búsqueda frecuente (email, phone, status)
- Campos de filtrado (status, category, type)

## 📊 Vistas Analíticas

### 1. active_bookings_summary
Resumen de reservas activas con información completa.

### 2. revenue_summary
Ingresos mensuales agrupados por moneda.

### 3. property_occupancy
Estadísticas de ocupación por propiedad.

### 4. top_clients
Clientes ordenados por gasto total.

### 5. low_stock_items
Items de inventario que necesitan reposición.

## 💰 Gestión de Pagos

### Tipos de Pago
- **advance**: Anticipo (30% típicamente)
- **balance**: Saldo restante (70%)
- **deposit**: Depósito de garantía
- **refund**: Devoluciones
- **extra**: Cargos adicionales

### Monedas Soportadas
- USD (Dólares estadounidenses)
- ARS (Pesos argentinos)
- EUR (Euros)

## 📅 Estados de Reserva

### Status
- **pending**: Esperando confirmación
- **confirmed**: Anticipo recibido
- **active**: Cliente en la propiedad
- **completed**: Finalizada exitosamente
- **cancelled**: Cancelada

### Payment Status
- **pending**: Sin pagos
- **advance_paid**: Solo anticipo pagado
- **fully_paid**: Totalmente pagado

## 🔒 Seguridad

- UUIDs como primary keys (mayor seguridad)
- Constraints de integridad referencial
- Validaciones a nivel de base de datos
- Timestamps automáticos para auditoría

## 🚀 Scripts de Instalación

### 1. Crear el esquema
```bash
psql -U postgres -d propmanager -f database/schema.sql
```

### 2. Cargar datos de ejemplo
```bash
psql -U postgres -d propmanager -f database/seed.sql
```

## 📝 Notas de Implementación

- Todos los precios se almacenan con 2 decimales
- Las fechas usan TIMESTAMP WITH TIME ZONE
- Los archivos se almacenan como URLs (no en DB)
- JSONB para datos flexibles (amenities, photos)

## 🔄 Próximas Mejoras

- [ ] Auditoría completa (quién/cuándo modificó)
- [ ] Soft deletes (borrado lógico)
- [ ] Versionado de contratos
- [ ] Integración con calendarios externos (Google Calendar, Airbnb)


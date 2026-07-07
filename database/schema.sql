-- ================================================================
-- SCHEMA COMPLETO: SISTEMA DE ADMINISTRACIÓN DE PROPIEDADES
-- Base de datos: PostgreSQL 14+
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. MÓDULO DE USUARIOS Y AUTENTICACIÓN
-- ================================================================

-- Tabla de Usuarios (OAuth Google)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'staff', 'owner', 'user'
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 2. MÓDULO DE PROPIEDADES
-- ================================================================

-- Tabla de Propiedades
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Argentina',
    postal_code VARCHAR(20),
    capacity INTEGER NOT NULL DEFAULT 1,
    bedrooms INTEGER DEFAULT 1,
    bathrooms DECIMAL(3,1) DEFAULT 1,
    description TEXT,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'inactive'
    property_type VARCHAR(50) DEFAULT 'apartment', -- 'apartment', 'house', 'studio', 'villa'
    amenities JSONB DEFAULT '[]', -- ["wifi", "ac", "tv", "kitchen", "parking"]
    photos JSONB DEFAULT '[]', -- [{"url": "...", "caption": "..."}]
    house_rules TEXT,
    check_in_instructions TEXT,
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Políticas de Propiedad
CREATE TABLE property_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    min_stay_nights INTEGER DEFAULT 1,
    max_stay_nights INTEGER,
    advance_payment_percentage DECIMAL(5,2) DEFAULT 30.00, -- Porcentaje de anticipo
    deposit_amount_ars DECIMAL(12,2), -- Monto fijo de depósito en ARS
    cancellation_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 3. MÓDULO DE CLIENTES
-- ================================================================

-- Tabla de Clientes/Inquilinos
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50), -- 'DNI', 'Passport', 'Other'
    document_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    nationality VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    notes TEXT, -- Notas internas (ej: "(pesos)" del CSV)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_blacklisted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 4. MÓDULO DE RESERVAS
-- ================================================================

-- Tabla de Reservas/Contratos
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) UNIQUE NOT NULL, -- Ej: "BK-2025-001"
    property_id UUID REFERENCES properties(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER DEFAULT 1,
    
    -- Precios y Pagos
    total_price_usd DECIMAL(10, 2) NOT NULL,
    advance_payment_usd DECIMAL(10, 2), -- 30% típicamente
    balance_payment_usd DECIMAL(10, 2), -- 70% restante
    deposit_ars DECIMAL(12, 2) DEFAULT 0,
    left_to_pay_usd DECIMAL(10, 2) DEFAULT 0,
    
    -- Estados
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'active', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'advance_paid', 'fully_paid'
    service_status VARCHAR(50), -- 'SERVICIOS', 'NO SERVICIOS' (del CSV)
    
    -- Información adicional
    special_requests TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Fechas
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: check-out después de check-in
    CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- ================================================================
-- 5. MÓDULO DE PAGOS
-- ================================================================

-- Tabla de Pagos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL, -- 'USD', 'ARS', 'EUR'
    exchange_rate DECIMAL(10, 4), -- Tipo de cambio al momento del pago
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Tipo de Pago
    type VARCHAR(50) NOT NULL, -- 'advance', 'balance', 'deposit', 'refund', 'extra'
    method VARCHAR(50), -- 'cash', 'transfer', 'credit_card', 'debit_card', 'mercadopago'
    
    -- Comprobantes
    receipt_url TEXT,
    receipt_number VARCHAR(100),
    transaction_id VARCHAR(255), -- ID de transacción bancaria o pasarela
    
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Facturas/Recibos
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    
    issue_date DATE NOT NULL,
    due_date DATE,
    
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    pdf_url TEXT,
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 6. MÓDULO DE CHECK-IN / CHECK-OUT
-- ================================================================

-- Tabla de Check-ins
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    
    checkin_date TIMESTAMP WITH TIME ZONE NOT NULL,
    checkin_by UUID REFERENCES users(id),
    
    -- Inspección Inicial
    inspection_photos JSONB DEFAULT '[]', -- URLs de fotos de inspección
    property_condition TEXT,
    inventory_verified BOOLEAN DEFAULT false,
    
    -- Entrega
    keys_delivered BOOLEAN DEFAULT false,
    contract_signed BOOLEAN DEFAULT false,
    deposit_received BOOLEAN DEFAULT false,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Check-outs
CREATE TABLE checkouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    
    checkout_date TIMESTAMP WITH TIME ZONE NOT NULL,
    checkout_by UUID REFERENCES users(id),
    
    -- Inspección Final
    inspection_photos JSONB DEFAULT '[]',
    property_condition TEXT,
    inventory_verified BOOLEAN DEFAULT false,
    
    -- Daños
    damages_found BOOLEAN DEFAULT false,
    damage_description TEXT,
    damage_cost DECIMAL(10, 2) DEFAULT 0,
    
    -- Devolución de Depósito
    deposit_returned BOOLEAN DEFAULT false,
    deposit_deducted DECIMAL(10, 2) DEFAULT 0,
    deposit_return_date DATE,
    deposit_return_method VARCHAR(50),
    
    keys_returned BOOLEAN DEFAULT false,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 7. MÓDULO DE INVENTARIO
-- ================================================================

-- Tabla de Items de Inventario
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'dishes', 'linens', 'furniture', 'appliances', 'electronics', 'kitchenware'
    subcategory VARCHAR(100), -- 'plates', 'towels', 'glasses', etc.
    
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'units', -- 'units', 'sets', 'pairs'
    
    condition VARCHAR(50) DEFAULT 'good', -- 'new', 'good', 'fair', 'poor', 'damaged'
    replacement_cost DECIMAL(10, 2),
    
    last_checked_at TIMESTAMP WITH TIME ZONE,
    last_checked_by UUID REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historial de Inventario
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    action VARCHAR(50) NOT NULL, -- 'check', 'damage', 'replacement', 'addition', 'removal'
    quantity_before INTEGER,
    quantity_after INTEGER,
    
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 8. MÓDULO DE CONTRATOS Y DOCUMENTOS
-- ================================================================

-- Tabla de Contratos Generados
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    template_used VARCHAR(100),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP WITH TIME ZONE,
    
    pdf_url TEXT,
    signed_pdf_url TEXT,
    
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'signed', 'expired'
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos Adjuntos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'client', 'property', 'payment'
    entity_id UUID NOT NULL,
    
    document_type VARCHAR(100) NOT NULL, -- 'identity', 'receipt', 'contract', 'inspection', 'other'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100),
    
    description TEXT,
    
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 9. MÓDULO DE GASTOS OPERATIVOS
-- ================================================================

-- Tabla de Gastos
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    category VARCHAR(100) NOT NULL, -- 'maintenance', 'utilities', 'cleaning', 'inventory', 'services', 'taxes', 'other'
    description TEXT NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50),
    
    receipt_url TEXT,
    vendor_name VARCHAR(255),
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 10. MÓDULO DE NOTIFICACIONES Y EVENTOS
-- ================================================================

-- Tabla de Notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'booking_reminder', 'payment_due', 'checkin_today', 'checkout_today'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    related_entity_type VARCHAR(50), -- 'booking', 'payment', 'client'
    related_entity_id UUID,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ================================================================

-- Bookings
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_type ON payments(type);

-- Clients
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_name ON clients(full_name);

-- Properties
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);

-- Inventory
CREATE INDEX idx_inventory_property ON inventory(property_id);
CREATE INDEX idx_inventory_category ON inventory(category);

-- Documents
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ================================================================
-- FUNCIONES Y TRIGGERS
-- ================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de reserva automático
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
    max_sequence INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 9) AS INTEGER)), 0) + 1
    INTO max_sequence
    FROM bookings
    WHERE booking_number LIKE 'BK-' || year_part || '-%';
    
    sequence_part := LPAD(max_sequence::TEXT, 6, '0');
    NEW.booking_number := 'BK-' || year_part || '-' || sequence_part;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number BEFORE INSERT ON bookings
    FOR EACH ROW 
    WHEN (NEW.booking_number IS NULL)
    EXECUTE FUNCTION generate_booking_number();

-- ================================================================
-- COMENTARIOS DE TABLAS
-- ================================================================

COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación OAuth';
COMMENT ON TABLE properties IS 'Propiedades/Unidades disponibles para alquiler';
COMMENT ON TABLE clients IS 'Clientes/Inquilinos del sistema';
COMMENT ON TABLE bookings IS 'Reservas y contratos de alquiler';
COMMENT ON TABLE payments IS 'Registro de todos los pagos recibidos';
COMMENT ON TABLE invoices IS 'Facturas y recibos emitidos';
COMMENT ON TABLE checkins IS 'Registros de check-in con inspección inicial';
COMMENT ON TABLE checkouts IS 'Registros de check-out con inspección final';
COMMENT ON TABLE inventory IS 'Inventario de items por propiedad';
COMMENT ON TABLE contracts IS 'Contratos generados y firmados';
COMMENT ON TABLE documents IS 'Documentos adjuntos (PDFs, imágenes)';
COMMENT ON TABLE expenses IS 'Gastos operativos y de mantenimiento';
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para usuarios';

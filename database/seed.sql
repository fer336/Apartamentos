-- ================================================================
-- DATOS DE EJEMPLO Y SEMILLAS (SEED DATA)
-- ================================================================

-- 1. Usuario Admin
INSERT INTO users (email, full_name, role, is_active) VALUES
('admin@propmanager.com', 'Administrador Sistema', 'admin', true);

-- 2. Propiedades de Ejemplo
INSERT INTO properties (name, address, city, state, country, capacity, bedrooms, bathrooms, description, amenities, property_type) VALUES
('Departamento Centro A', 'Av. Corrientes 1234, Piso 5 Depto A', 'Buenos Aires', 'CABA', 'Argentina', 4, 2, 1, 
 'Hermoso departamento en pleno centro, ideal para turismo', 
 '["wifi", "ac", "tv", "cocina_equipada", "calefaccion"]', 'apartment'),

('Departamento Centro B', 'Av. Corrientes 1234, Piso 3 Depto B', 'Buenos Aires', 'CABA', 'Argentina', 2, 1, 1,
 'Acogedor monoambiente con todos los servicios',
 '["wifi", "ac", "tv", "cocina_equipada"]', 'studio'),

('Casa Quinta Mar del Plata', 'Calle Falsa 123, Mar del Plata', 'Mar del Plata', 'Buenos Aires', 'Argentina', 8, 4, 2,
 'Amplia casa con jardín, a 5 cuadras de la playa',
 '["wifi", "parrilla", "jardin", "cochera", "pileta"]', 'house');

-- 3. Políticas de las Propiedades
INSERT INTO property_policies (property_id, check_in_time, check_out_time, min_stay_nights, advance_payment_percentage, deposit_amount_ars)
SELECT 
    id,
    '14:00:00'::TIME,
    '11:00:00'::TIME,
    2,
    30.00,
    100000.00
FROM properties;

-- 4. Clientes de Ejemplo (datos ficticios; no usar datos reales en repos públicos)
INSERT INTO clients (full_name, document_type, email, phone, nationality, notes) VALUES
('Cliente Demo Uno', 'DNI', 'cliente.demo.uno@example.com', '+5491100000001', 'Argentina', NULL),
('Cliente Demo Dos', 'DNI', 'cliente.demo.dos@example.com', '+5491100000002', 'Argentina', NULL),
('Cliente Demo Tres', 'DNI', 'cliente.demo.tres@example.com', '+5491100000003', 'Argentina', NULL),
('Cliente Demo Cuatro', 'DNI', 'cliente.demo.cuatro@example.com', '+5491100000004', 'Argentina', NULL),
('Cliente Demo Cinco', 'DNI', 'cliente.demo.cinco@example.com', '+5491100000005', 'Argentina', NULL),
('Cliente Demo Seis', 'DNI', 'cliente.demo.seis@example.com', '+5491100000006', 'Argentina', NULL),
('Cliente Demo Siete', 'DNI', 'cliente.demo.siete@example.com', '+5491100000007', 'Argentina', NULL),
('Cliente Demo Ocho', 'Passport', 'cliente.demo.ocho@example.com', '+349100000001', 'España', NULL);

-- 5. Reservas de Ejemplo (Estado Completado)
INSERT INTO bookings (
    property_id, 
    client_id, 
    check_in, 
    check_out, 
    guests_count,
    total_price_usd,
    advance_payment_usd,
    balance_payment_usd,
    deposit_ars,
    left_to_pay_usd,
    status,
    payment_status,
    service_status
)
SELECT 
    (SELECT id FROM properties LIMIT 1),
    (SELECT id FROM clients WHERE full_name = 'Cliente Demo Uno'),
    '2024-12-15'::DATE,
    '2024-12-28'::DATE,
    2,
    910.00,
    273.00,
    637.00,
    222950.00,
    0.00,
    'completed',
    'fully_paid',
    'SERVICIOS';

-- 6. Reservas Activas
INSERT INTO bookings (
    property_id,
    client_id,
    check_in,
    check_out,
    guests_count,
    total_price_usd,
    advance_payment_usd,
    balance_payment_usd,
    deposit_ars,
    left_to_pay_usd,
    status,
    payment_status,
    service_status
)
SELECT
    (SELECT id FROM properties LIMIT 1 OFFSET 1),
    (SELECT id FROM clients WHERE full_name = 'Cliente Demo Cinco'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    3,
    850.00,
    255.00,
    595.00,
    180000.00,
    595.00,
    'active',
    'advance_paid',
    'SERVICIOS';

-- 7. Inventario Básico
INSERT INTO inventory (property_id, item_name, category, subcategory, quantity, condition, replacement_cost)
SELECT 
    p.id,
    items.name,
    items.category,
    items.subcategory,
    items.qty,
    'good',
    items.cost
FROM properties p
CROSS JOIN (VALUES
    -- Cocina
    ('Platos planos', 'kitchenware', 'dishes', 6, 50.00),
    ('Platos hondos', 'kitchenware', 'dishes', 6, 50.00),
    ('Vasos', 'kitchenware', 'glassware', 8, 30.00),
    ('Tazas', 'kitchenware', 'mugs', 6, 40.00),
    ('Cubiertos (set)', 'kitchenware', 'cutlery', 6, 80.00),
    ('Ollas', 'kitchenware', 'cookware', 3, 120.00),
    ('Sartenes', 'kitchenware', 'cookware', 2, 80.00),
    
    -- Ropa de Casa
    ('Juego de sábanas', 'linens', 'bedding', 2, 150.00),
    ('Toallas de baño', 'linens', 'towels', 4, 80.00),
    ('Toallas de mano', 'linens', 'towels', 4, 40.00),
    ('Toallones de playa', 'linens', 'beach', 2, 100.00),
    
    -- Electrónica
    ('Control remoto TV', 'electronics', 'remotes', 1, 50.00),
    ('Control remoto AC', 'electronics', 'remotes', 1, 60.00)
) AS items(name, category, subcategory, qty, cost);

-- 8. Pagos de Ejemplo
WITH first_booking AS (
    SELECT id FROM bookings LIMIT 1
)
INSERT INTO payments (booking_id, amount, currency, payment_date, type, method, verified_at)
SELECT 
    id,
    273.00,
    'USD',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    'advance',
    'transfer',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM first_booking
UNION ALL
SELECT 
    id,
    637.00,
    'USD',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    'balance',
    'transfer',
    CURRENT_TIMESTAMP - INTERVAL '15 days'
FROM first_booking;

-- ================================================================
-- VISTAS ÚTILES
-- ================================================================

-- Vista: Resumen de Reservas Activas
CREATE OR REPLACE VIEW active_bookings_summary AS
SELECT 
    b.id,
    b.booking_number,
    p.name AS property_name,
    c.full_name AS client_name,
    b.check_in,
    b.check_out,
    b.total_price_usd,
    b.left_to_pay_usd,
    b.status,
    b.payment_status,
    (b.check_out - b.check_in) AS nights
FROM bookings b
JOIN properties p ON b.property_id = p.id
JOIN clients c ON b.client_id = c.id
WHERE b.status IN ('confirmed', 'active')
ORDER BY b.check_in;

-- Vista: Dashboard de Ingresos
CREATE OR REPLACE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('month', payment_date) AS month,
    currency,
    SUM(amount) AS total_amount,
    COUNT(*) AS payment_count,
    AVG(amount) AS avg_payment
FROM payments
WHERE type IN ('advance', 'balance')
GROUP BY DATE_TRUNC('month', payment_date), currency
ORDER BY month DESC;

-- Vista: Ocupación por Propiedad
CREATE OR REPLACE VIEW property_occupancy AS
SELECT 
    p.id AS property_id,
    p.name AS property_name,
    COUNT(CASE WHEN b.status = 'active' THEN 1 END) AS currently_occupied,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) AS upcoming_bookings,
    COUNT(*) AS total_bookings,
    SUM(b.total_price_usd) AS total_revenue
FROM properties p
LEFT JOIN bookings b ON p.id = b.property_id
GROUP BY p.id, p.name
ORDER BY total_revenue DESC NULLS LAST;

-- Vista: Clientes Top (por ingresos)
CREATE OR REPLACE VIEW top_clients AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    COUNT(b.id) AS total_bookings,
    SUM(b.total_price_usd) AS total_spent,
    MAX(b.check_out) AS last_visit,
    c.rating
FROM clients c
JOIN bookings b ON c.id = b.client_id
WHERE b.status != 'cancelled'
GROUP BY c.id, c.full_name, c.email, c.rating
ORDER BY total_spent DESC;

-- Vista: Inventario Bajo Stock
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
    i.id,
    p.name AS property_name,
    i.item_name,
    i.category,
    i.quantity,
    i.condition
FROM inventory i
JOIN properties p ON i.property_id = p.id
WHERE i.quantity < 2 OR i.condition = 'poor'
ORDER BY i.quantity ASC;

-- ================================================================
-- COMENTARIOS
-- ================================================================

COMMENT ON VIEW active_bookings_summary IS 'Resumen de todas las reservas activas y confirmadas';
COMMENT ON VIEW revenue_summary IS 'Resumen de ingresos mensuales por moneda';
COMMENT ON VIEW property_occupancy IS 'Estadísticas de ocupación por propiedad';
COMMENT ON VIEW top_clients IS 'Clientes con mayor gasto total';
COMMENT ON VIEW low_stock_items IS 'Items de inventario con stock bajo o en mal estado';

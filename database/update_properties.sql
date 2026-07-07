-- ================================================================
-- ACTUALIZACIÓN DE PROPIEDADES
-- Departamentos del Complejo - 4 unidades idénticas
-- ================================================================

-- 1. Eliminar propiedades existentes y sus datos relacionados
DELETE FROM property_policies WHERE property_id IN (SELECT id FROM properties);
DELETE FROM inventory WHERE property_id IN (SELECT id FROM properties);
DELETE FROM properties;

-- 2. Insertar las 4 propiedades (Departamentos A, B, C, D)
INSERT INTO properties (
    name, 
    address, 
    city, 
    state, 
    country,
    postal_code,
    capacity, 
    bedrooms, 
    bathrooms, 
    description,
    status,
    property_type,
    amenities
) VALUES
-- Departamento A
(
    'Departamento A',
    'Complejo Valeria - Torre Norte, Piso 3, Depto A',
    'Mar del Plata',
    'Buenos Aires',
    'Argentina',
    '7600',
    4,
    2,
    1,
    'Departamento de 2 dormitorios en complejo privado. Ideal para familias o grupos de hasta 4 personas. Totalmente equipado con todos los servicios.',
    'available',
    'apartment',
    '["wifi", "tv", "ac", "cocina_equipada", "heladera", "microondas", "vajilla_completa", "ropa_de_cama", "toallas", "balcon", "acceso_complejo"]'
),

-- Departamento B
(
    'Departamento B',
    'Complejo Valeria - Torre Norte, Piso 3, Depto B',
    'Mar del Plata',
    'Buenos Aires',
    'Argentina',
    '7600',
    4,
    2,
    1,
    'Departamento de 2 dormitorios en complejo privado. Ideal para familias o grupos de hasta 4 personas. Totalmente equipado con todos los servicios.',
    'available',
    'apartment',
    '["wifi", "tv", "ac", "cocina_equipada", "heladera", "microondas", "vajilla_completa", "ropa_de_cama", "toallas", "balcon", "acceso_complejo"]'
),

-- Departamento C
(
    'Departamento C',
    'Complejo Valeria - Torre Norte, Piso 4, Depto C',
    'Mar del Plata',
    'Buenos Aires',
    'Argentina',
    '7600',
    4,
    2,
    1,
    'Departamento de 2 dormitorios en complejo privado. Ideal para familias o grupos de hasta 4 personas. Totalmente equipado con todos los servicios.',
    'available',
    'apartment',
    '["wifi", "tv", "ac", "cocina_equipada", "heladera", "microondas", "vajilla_completa", "ropa_de_cama", "toallas", "balcon", "acceso_complejo"]'
),

-- Departamento D
(
    'Departamento D',
    'Complejo Valeria - Torre Norte, Piso 4, Depto D',
    'Mar del Plata',
    'Buenos Aires',
    'Argentina',
    '7600',
    4,
    2,
    1,
    'Departamento de 2 dormitorios en complejo privado. Ideal para familias o grupos de hasta 4 personas. Totalmente equipado con todos los servicios.',
    'available',
    'apartment',
    '["wifi", "tv", "ac", "cocina_equipada", "heladera", "microondas", "vajilla_completa", "ropa_de_cama", "toallas", "balcon", "acceso_complejo"]'
);

-- 3. Insertar políticas para cada propiedad
INSERT INTO property_policies (
    property_id, 
    check_in_time, 
    check_out_time, 
    min_stay_nights,
    max_stay_nights,
    advance_payment_percentage, 
    deposit_amount_ars,
    cancellation_policy
)
SELECT 
    id,
    '14:00:00'::TIME,
    '10:00:00'::TIME,
    7,  -- Mínimo 7 noches
    NULL,
    30.00,  -- 30% de anticipo
    100000.00,  -- Depósito de garantía
    'Cancelación con 30 días de anticipación: devolución del 100%. Menos de 30 días: se retiene el anticipo.'
FROM properties;

-- 4. Insertar inventario básico idéntico para cada departamento
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
    -- Vajilla y Cristalería
    ('Platos planos', 'kitchenware', 'dishes', 8, 80.00),
    ('Platos hondos', 'kitchenware', 'dishes', 8, 80.00),
    ('Platos de postre', 'kitchenware', 'dishes', 8, 60.00),
    ('Vasos de agua', 'kitchenware', 'glassware', 8, 40.00),
    ('Vasos de vino', 'kitchenware', 'glassware', 8, 50.00),
    ('Copas', 'kitchenware', 'glassware', 4, 60.00),
    ('Tazas de café', 'kitchenware', 'mugs', 8, 50.00),
    ('Cubiertos (juego completo)', 'kitchenware', 'cutlery', 8, 120.00),
    
    -- Utensilios de Cocina
    ('Ollas grandes', 'kitchenware', 'cookware', 2, 150.00),
    ('Ollas medianas', 'kitchenware', 'cookware', 2, 100.00),
    ('Sartenes', 'kitchenware', 'cookware', 2, 120.00),
    ('Tabla de cortar', 'kitchenware', 'tools', 2, 30.00),
    ('Cuchillos de cocina', 'kitchenware', 'tools', 1, 80.00),
    ('Utensilios varios', 'kitchenware', 'tools', 1, 50.00),
    
    -- Ropa de Casa - Dormitorio Principal
    ('Juego de sábanas Queen', 'linens', 'bedding', 2, 180.00),
    ('Almohadas', 'linens', 'bedding', 4, 120.00),
    ('Frazadas', 'linens', 'bedding', 2, 150.00),
    ('Acolchado Queen', 'linens', 'bedding', 1, 200.00),
    
    -- Ropa de Casa - Dormitorio Secundario
    ('Juego de sábanas Twin', 'linens', 'bedding', 2, 140.00),
    ('Almohadas Twin', 'linens', 'bedding', 2, 80.00),
    ('Frazadas Twin', 'linens', 'bedding', 2, 120.00),
    
    -- Ropa de Casa - Baño
    ('Toallas de baño grandes', 'linens', 'towels', 4, 100.00),
    ('Toallas de mano', 'linens', 'towels', 4, 50.00),
    ('Toallones de piso', 'linens', 'towels', 2, 40.00),
    
    -- Electrónica y Accesorios
    ('Control remoto TV', 'electronics', 'remotes', 1, 50.00),
    ('Control remoto AC', 'electronics', 'remotes', 1, 60.00),
    ('Llaves del departamento', 'access', 'keys', 2, 100.00)
) AS items(name, category, subcategory, qty, cost);

-- Verificar resultado
SELECT 
    'Propiedades creadas' as tipo,
    COUNT(*) as cantidad
FROM properties
UNION ALL
SELECT 
    'Políticas creadas',
    COUNT(*)
FROM property_policies
UNION ALL
SELECT 
    'Items de inventario',
    COUNT(*)
FROM inventory;


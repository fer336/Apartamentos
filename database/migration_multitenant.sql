-- 1. Crear tabla de Organizaciones
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE, -- Para subdominios: valeria.sistema.com
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar la organización por defecto
INSERT INTO organizations (name, slug) 
VALUES ('Apartamentos Valeria', 'valeria')
ON CONFLICT DO NOTHING;

-- Variable para guardar el ID de la organización (para usar en el script)
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'valeria' LIMIT 1;

    -- 3. Añadir organization_id a tablas existentes
    
    -- USERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE users SET organization_id = default_org_id WHERE organization_id IS NULL;
    END IF;

    -- PROPERTIES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'organization_id') THEN
        ALTER TABLE properties ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE properties SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE properties ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- CLIENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'organization_id') THEN
        ALTER TABLE clients ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE clients SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- BOOKINGS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'organization_id') THEN
        ALTER TABLE bookings ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE bookings SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE bookings ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- PAYMENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'organization_id') THEN
        ALTER TABLE payments ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE payments SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE payments ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- INVENTORY
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'organization_id') THEN
        ALTER TABLE inventory ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE inventory SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE inventory ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    -- PROPERTY POLICIES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_policies' AND column_name = 'organization_id') THEN
        ALTER TABLE property_policies ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE property_policies SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE property_policies ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- EXPENSES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'organization_id') THEN
        ALTER TABLE expenses ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE expenses SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE expenses ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- NOTIFICATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'organization_id') THEN
        ALTER TABLE notifications ADD COLUMN organization_id UUID REFERENCES organizations(id);
        UPDATE notifications SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
    END IF;

END $$;


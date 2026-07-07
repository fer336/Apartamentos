# Configuración de Base de Datos

## 🚀 Instalación y Configuración

### 1. Instalar PostgreSQL

Si no tienes PostgreSQL instalado:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# MacOS
brew install postgresql

# Iniciar servicio
sudo systemctl start postgresql  # Linux
brew services start postgresql   # MacOS
```

### 2. Crear la Base de Datos

```bash
# Conectar como usuario postgres
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE apartamentos_valeria;
CREATE USER propuser WITH ENCRYPTED PASSWORD 'replace_with_a_strong_password';
GRANT ALL PRIVILEGES ON DATABASE apartamentos_valeria TO propuser;
\q
```

### 3. Ejecutar el Schema

```bash
# Desde la raíz del proyecto
psql -U propuser -d apartamentos_valeria -f database/schema.sql
```

### 4. (Opcional) Cargar Datos de Ejemplo

```bash
psql -U propuser -d apartamentos_valeria -f database/seed.sql
```

### 5. Configurar el Backend

Crea un archivo `.env` en la carpeta `backend/`:

```bash
cd backend
cp env.example .env
```

Edita `.env` y configura:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=propuser
POSTGRES_PASSWORD=replace_with_a_strong_password
POSTGRES_DB=apartamentos_valeria
GOOGLE_CLIENT_ID=replace_with_google_client_id
GOOGLE_CLIENT_SECRET=replace_with_google_client_secret
SECRET_KEY=replace_with_a_long_random_secret
```

### 6. Instalar Dependencias del Backend

```bash
cd backend
pip install -r requirements.txt
```

### 7. Probar la Conexión

```bash
# Desde backend/
python -c "from app.core.database import engine; import asyncio; asyncio.run(engine.connect())"
```

## 📊 Estructura del Schema

El esquema incluye:
- ✅ 17 tablas principales
- ✅ Triggers automáticos
- ✅ Índices optimizados
- ✅ 5 vistas analíticas
- ✅ Comentarios de documentación

## 🔧 Comandos Útiles de PostgreSQL

```bash
# Conectar a la base de datos
psql -U propuser -d apartamentos_valeria

# Listar tablas
\dt

# Describir una tabla
\d bookings

# Ver vistas
\dv

# Ejecutar query
SELECT * FROM active_bookings_summary;
```

## 🔄 Respaldo y Restauración

### Hacer Backup

```bash
pg_dump -U propuser apartamentos_valeria > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup

```bash
psql -U propuser -d apartamentos_valeria < backup_20250117.sql
```

## 🐳 Configuración con Docker (Alternativa)

Si prefieres usar Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: propuser
      POSTGRES_PASSWORD: replace_with_a_strong_password
      POSTGRES_DB: apartamentos_valeria
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

volumes:
  postgres_data:
```

Luego ejecutar:

```bash
docker-compose up -d
```

## ✅ Verificación

Verifica que todo esté correcto:

```sql
-- Contar tablas creadas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Debería retornar 17

-- Ver vistas
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
-- Debería mostrar 5 vistas
```

## 🔐 Seguridad

**IMPORTANTE**: 
- Cambia las contraseñas por defecto
- No subas el archivo `.env` a Git (ya está en `.gitignore`)
- Usa contraseñas fuertes en producción
- Configura SSL para conexiones remotas

## 📚 Próximos Pasos

1. Ejecutar el backend: `python main.py`
2. El backend estará conectado a PostgreSQL
3. Podrás hacer queries desde FastAPI

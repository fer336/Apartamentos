# 🐍 Backend Agent - AGENTS.md

Dominio encargado de la lógica de negocio, persistencia de datos y APIs.

## 📋 Directrices de Backend

1.  **Async First**: Todo endpoint y consulta a base de datos debe ser asíncrono (`async`/`await`).
2.  **Schema Driven**: Pydantic maneja la validación de entrada/salida. SQLAlchemy maneja el ORM.
3.  **Dependency Injection**: Usar `Depends()` de FastAPI para sesiones de DB, usuarios y servicios.
4.  **Error Handling**: No retornar 500 crudos. Usar `HTTPException` con detalles controlados.

## 🛠️ Tabla de Skills Disponibles (Backend)

| Skill | Descripción | URL |
| :--- | :--- | :--- |
| `fastapi-router` | Creación de endpoints RESTful, inyección de dependencias y respuestas tipadas. | [backend/skills/FASTAPI_ROUTE.md](./skills/FASTAPI_ROUTE.md) |
| `sqlalchemy-async` | Consultas asíncronas, relaciones y migraciones con Alembic. | [backend/skills/SQLALCHEMY.md](./skills/SQLALCHEMY.md) |
| `pydantic-schema` | Definición de modelos de datos, validación y serialización. | [backend/skills/PYDANTIC.md](./skills/PYDANTIC.md) |
| `minio-storage` | Carga, descarga y generación de URLs firmadas para archivos. | [backend/skills/MINIO.md](./skills/MINIO.md) |
| `auth-jwt` | Manejo de autenticación, tokens y protección de rutas. | [backend/skills/AUTH.md](./skills/AUTH.md) |

## 🤖 Tabla de Auto-Invocación (Agentes Backend)

| Acción | Skill a Invocar | Notas |
| :--- | :--- | :--- |
| Crear nuevo Endpoint | `fastapi-router` | Verificar permisos de usuario. |
| Modificar Base de Datos | `sqlalchemy-async` | **Siempre** crear migración SQL o Alembic. |
| Subir archivos | `minio-storage` | Usar `upload_file_to_minio` en `core/minio_client.py`. |
| Validar Request Body | `pydantic-schema` | Definir en `schemas/schemas.py`. |

## 🏗️ Tech Stack & Comandos (Backend)

*   **Framework**: FastAPI
*   **Language**: Python 3.11+
*   **ORM**: SQLAlchemy (AsyncPG)
*   **Storage**: MinIO (S3 Compatible)

```bash
# Entrar al entorno
cd backend
source venv/bin/activate

# Correr servidor (Dev)
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Migraciones (Ejemplo)
alembic revision --autogenerate -m "mensaje"
alembic upgrade head
```


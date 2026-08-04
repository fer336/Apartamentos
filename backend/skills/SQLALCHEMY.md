# Skill: SQLAlchemy Async + Alembic

**ID**: `sqlalchemy-async`
**Dominio**: Backend

## 📖 Descripción

Patrón estándar para consultas async con SQLAlchemy y gestión de esquema con Alembic. **Todo cambio de base de datos requiere una migración Alembic** — nunca editar la BD a mano en producción.

## ✅ Estado de Migraciones (agosto 2026)

- Alembic inicializado sobre la BD existente con baseline vacía + `stamp head`.
- Revisiones: `4a2e0323ff73` (baseline, vacía) → `750ae7b221c4` (drop legacy constraints).
- `migrations/env.py` usa **async engine (asyncpg)**, lee `DATABASE_URL` de `app.core.config.settings`, y tiene un filtro `include_object` que **protege tablas/columnas legacy**: autogenerate solo gestiona objetos del modelo. No dropear a mano tablas que no estén en `models.py`.

## 💻 Comandos

```bash
cd backend
source venv/bin/activate

# Generar migración (SIEMPRE revisar el archivo antes de aplicar)
alembic revision --autogenerate -m "describe change"

# Aplicar
alembic upgrade head

# Estado
alembic current
alembic check        # detecta drift (puede fallar por legacy; verificar manualmente)
```

**Regla de oro**: después de `--autogenerate`, abrir el archivo en `migrations/versions/`. Si contiene `drop_table`, `drop_column` o `drop_index` de tablas/columnas que el modelo ya no define pero la app sigue usando, **remover esas operaciones antes de aplicar**.

## 💻 Patrón de Consulta Async

```python
from sqlalchemy import select, func, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.models import Organization
from app.schemas.schemas import ExchangeRateResponse

@router.get("/settings/exchange-rate", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Organization).where(Organization.id == current_user.organization_id)
    result = await db.execute(query)
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    return org
```

## ✅ Checklist de Implementación

1. [ ] Importar modelos desde `app.models.models` y esquemas Pydantic desde `app.schemas.schemas`.
2. [ ] Inyectar `AsyncSession` con `Depends(get_db)` — siempre `async`/`await`.
3. [ ] Para escrituras: `await db.commit()` y `await db.refresh(org)` después de mutar.
4. [ ] Manejar "no encontrado" con `HTTPException(404)` tras `scalar_one_or_none()`.
5. [ ] **Cambios de esquema**: crear migración Alembic, revisarla contra drops legacy, aplicar con `alembic upgrade head`.
6. [ ] Verificar con `alembic current` que la BD quedó en head.
7. [ ] Si hay drift legítimo (campo nuevo en modelo), autogenerate debe proponer solo el `add_column`.

## 🩺 Resolución de Errores Comunes

| Error | Causa | Fix |
| :--- | :--- | :--- |
| `UndefinedColumnError: column X does not exist` | Modelo actualizado sin migrar la BD | Crear migración `add_column` + `alembic upgrade head` |
| Autogenerate propone `drop_table` | Tabla existe en BD pero no en modelo | Revisar y remover el drop; decidir si es legacy real |
| `alembic check` falla con drift | Diferencias legacy intencionales | Verificar manualmente; no aplicar autogenerate a ciegas |

## 🗂️ Referencias

- Modelos: `app/models/models.py`
- Config de DB: `app/core/database.py`, `app/core/config.py`
- Migraciones: `migrations/` (`env.py` + `versions/`)
- Esquema Pydantic: `app/schemas/schemas.py`
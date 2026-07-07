# Skill: FastAPI Route Pattern

**ID**: `fastapi-router`
**Dominio**: Backend

## 📖 Descripción
Patrón estándar para crear endpoints en FastAPI, asegurando inyección de dependencias, validación de esquemas y manejo de errores consistente.

## 💻 Patrón de Código

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, MyModel
from app.schemas.schemas import MyModelResponse, MyModelCreate

router = APIRouter()

@router.get("/items", response_model=List[MyModelResponse])
async def get_items(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera una lista de items.
    Requiere autenticación.
    """
    # Lógica de consulta (usar Skill: sqlalchemy-async)
    pass

@router.post("/items", response_model=MyModelResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: MyModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo item.
    """
    # Lógica de creación
    pass
```

## ✅ Checklist de Implementación

1.  [ ] Importar `APIRouter`, `Depends`, `HTTPException`.
2.  [ ] Definir `response_model` en el decorador.
3.  [ ] Inyectar sesión de DB (`Depends(get_db)`).
4.  [ ] Inyectar usuario actual si requiere auth (`Depends(get_current_user)`).
5.  [ ] Usar Docstrings para documentación automática (Swagger UI).
6.  [ ] Manejar errores con `HTTPException` (no `try/except` genéricos sin re-lanzar).


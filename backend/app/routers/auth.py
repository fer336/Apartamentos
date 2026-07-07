from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, Organization
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from datetime import datetime, timedelta
import uuid

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

@router.get("/login/google")
async def login_google(request: Request):
    # Construir la URL de redireccionamiento usando la configuración
    base_url = settings.PRODUCTION_BACKEND_URL if settings.ENVIRONMENT == "production" else settings.DEV_BACKEND_URL
    # Asegurarnos de que no termine en / para evitar duplicados
    base_url = base_url.rstrip('/')
    redirect_uri = f"{base_url}/auth/google/callback"
    
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def auth_google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            # Fallback if userinfo not in token (depends on provider config)
            user_info = await oauth.google.userinfo(token=token)
            
        email = user_info.get("email")
        
        # Check if user exists
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new Organization for the new user
            new_org = Organization(
                id=uuid.uuid4(),
                name=f"Organización de {user_info.get('name')}",
                slug=uuid.uuid4().hex[:8] # Random slug
            )
            db.add(new_org)
            await db.flush() # Get ID
            
            # Create new User
            user = User(
                id=uuid.uuid4(),
                email=email,
                full_name=user_info.get("name"),
                picture=user_info.get("picture"),
                organization_id=new_org.id
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        user_data = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "picture": user.picture,
            "org_id": str(user.organization_id)
        }
        
        access_token = create_access_token(user_data)
        
        # Redirigir al frontend con el token
        # Usamos /login/callback para evitar conflicto con el prefijo /auth del backend en Traefik
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/login/callback?token={access_token}")
        return response
        
    except Exception as e:
        print(f"Error en login: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Error en autenticación")

from pydantic_settings import BaseSettings
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
import json

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    POSTGRES_HOST: str
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # Computed Database URL
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        if isinstance(v, str):
            return v
        
        values = info.data
        return str(
            f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@"
            f"{values.get('POSTGRES_HOST')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"
        )

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    # JWT
    SECRET_KEY: str
    SESSION_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Frontend / Backend URLs
    DEV_FRONTEND_URL: str = "http://localhost:3000"
    DEV_BACKEND_URL: str = "http://localhost:8000"
    PRODUCTION_FRONTEND_URL: str = "https://apartamentos.qeva.xyz"
    PRODUCTION_BACKEND_URL: str = "https://apartamentos.qeva.xyz"
    
    @property
    def FRONTEND_URL(self) -> str:
        if self.ENVIRONMENT == "production":
            return self.PRODUCTION_FRONTEND_URL
        return self.DEV_FRONTEND_URL

    # MinIO / S3
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_NAME: str = "recibos"
    MINIO_SECURE: bool = True
    MINIO_REGION: str = "us-east-1"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    CORS_CREDENTIALS: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                # If JSON decode fails, return as single item list or split by comma if applicable
                return [i.strip() for i in v.split(",")] if "," in v else [v]
        return []

    # AI
    OPENROUTER_API_KEY: Optional[str] = None

    class Config:
        env_file = (".env", "/run/secrets/backend.env")
        case_sensitive = True
        extra = "allow" # Allow extra fields in .env

settings = Settings()

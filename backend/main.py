from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import uvicorn
from app.routers import auth
from app.api import endpoints
from app.core.config import settings

app = FastAPI(title="Property Management AI Agent")

# Session Middleware is required for Authlib
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)

# CORS Configuration
# origins = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS, # Use settings from config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(endpoints.router, prefix="/api", tags=["api"])

@app.get("/health")
def health_check():
    return {"status": "ok", "database": "connected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

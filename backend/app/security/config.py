from pydantic_settings import BaseSettings
from typing import List
import os

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_DEFAULT_DB_PATH = os.path.join(_BACKEND_DIR, "coimbatore_schools.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Coimbatore Corporation School Performance & Analytics Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database (Single local SQLite DB in backend/coimbatore_schools.db)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_DB_PATH}")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "coimbatore-corporation-super-secure-jwt-secret-key-2026-adj")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Upload settings
    UPLOAD_DIRECTORY: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

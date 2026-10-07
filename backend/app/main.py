import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.security.config import settings
from app.database.session import engine, Base
from app.models import entities
from app.api.endpoints import router as api_router
from database.seeds.seed_data import init_db_seeds

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Official Government Portal for Coimbatore Corporation Schools Performance, AI Analytics & Power BI Integration",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    init_db_seeds()

@app.get("/")
def root():
    return {
        "message": "Welcome to Coimbatore Corporation School Performance & Analytics Portal API",
        "status": "Online",
        "docs": "/docs"
    }

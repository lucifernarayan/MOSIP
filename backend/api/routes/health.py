from fastapi import APIRouter
from sqlalchemy import text
from backend.database.db import engine

router = APIRouter()


@router.get("/health", summary="Health check")
def health_check():
    """Returns API status and confirms DB connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "ok",
        "version": "1.0.0",
        "platform": "MOSIP — Multi-Agent Orbital Sustainability Intelligence Platform",
        "database": db_status,
    }

from fastapi import APIRouter
from sqlalchemy import text
from backend.database.db import engine
from knowledge_layer.rag_service import qdrant_healthy

router = APIRouter()


@router.get("/health", summary="Health check")
def health_check():
    """Returns API status and confirms connectivity to PostgreSQL and Qdrant."""
    # ── PostgreSQL ─────────────────────────────────────────────────────────────
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    # ── Qdrant ────────────────────────────────────────────────────────────────
    try:
        qdrant_status = "connected" if qdrant_healthy() else "collection_missing"
    except Exception as e:
        qdrant_status = f"error: {e}"

    return {
        "status":    "ok" if db_status == "connected" else "degraded",
        "version":   "2.0.0",
        "platform":  "MOSIP — Multi-Agent Orbital Sustainability Intelligence Platform",
        "databases": {
            "postgresql": db_status,
            "qdrant":     qdrant_status,
        },
    }

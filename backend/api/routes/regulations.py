from fastapi import APIRouter, Query
from knowledge_layer.rag_service import search_regulations

router = APIRouter()


@router.get("/search", summary="Search compliance regulations")
def search(
    q: str = Query(..., description="Query text to search semantically"),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Runs a semantic search query against the Qdrant regulations database
    using the sentence embedding model.
    """
    try:
        results = search_regulations(q, top_k=limit)
        return {"query": q, "results": results}
    except Exception as e:
        return {"query": q, "results": [], "error": str(e)}

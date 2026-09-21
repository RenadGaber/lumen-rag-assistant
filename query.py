from fastapi import APIRouter
from app.schemas.query import QueryRequest, QueryResponse
from app.services.generation import generate_answer

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    answer, sources = generate_answer(request.question)
    return QueryResponse(answer=answer, sources=sources)
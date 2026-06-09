from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services import rag

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def ask(request: ChatRequest) -> ChatResponse:
    try:
        return rag.answer_question(request.document_id, request.question)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

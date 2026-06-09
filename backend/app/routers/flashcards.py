from fastapi import APIRouter, HTTPException

from app.models.schemas import FlashcardRequest, FlashcardResponse
from app.services import flashcards

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post("", response_model=FlashcardResponse)
def create(request: FlashcardRequest) -> FlashcardResponse:
    count = max(1, min(request.count, 20))
    try:
        cards = flashcards.generate(request.document_id, count)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return FlashcardResponse(flashcards=cards)

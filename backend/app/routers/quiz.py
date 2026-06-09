from fastapi import APIRouter, HTTPException

from app.models.schemas import QuizRequest, QuizResponse
from app.services import quiz

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("", response_model=QuizResponse)
def create(request: QuizRequest) -> QuizResponse:
    count = max(1, min(request.count, 15))
    try:
        questions = quiz.generate(request.document_id, count)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return QuizResponse(questions=questions)

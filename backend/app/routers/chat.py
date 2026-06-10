import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse
from app.services import rag

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def ask(request: ChatRequest) -> ChatResponse:
    try:
        return rag.answer_question(
            request.document_id, request.question, request.history
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/stream")
def ask_stream(request: ChatRequest) -> StreamingResponse:
    def events():
        try:
            query = rag.rewrite_query(request.question, request.history)
            documents, sources = rag.retrieve(request.document_id, query)
            yield _sse(
                {
                    "type": "sources",
                    "query": query,
                    "sources": [s.model_dump() for s in sources],
                }
            )
            for token in rag.stream_tokens(request.question, request.history, documents):
                yield _sse({"type": "token", "token": token})
            yield _sse({"type": "done"})
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

from pydantic import BaseModel


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int


class ChatRequest(BaseModel):
    document_id: str
    question: str


class Source(BaseModel):
    chunk_index: int
    text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


class Flashcard(BaseModel):
    question: str
    answer: str


class FlashcardRequest(BaseModel):
    document_id: str
    count: int = 10


class FlashcardResponse(BaseModel):
    flashcards: list[Flashcard]

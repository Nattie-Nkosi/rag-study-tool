import json

from app.models.schemas import Flashcard
from app.services import llm, vectorstore

SYSTEM_PROMPT = (
    "You are a study assistant that writes flashcards from a document. Each card has a "
    "clear question that tests understanding of a concept, and a concise, self-contained "
    "answer drawn only from the material. Avoid trivia about page numbers or formatting."
)


def generate(document_id: str, count: int) -> list[Flashcard]:
    chunks = vectorstore.sample_chunks(document_id, max(count * 2, 12))
    if not chunks:
        raise RuntimeError("No content found for this document.")

    context = "\n\n---\n\n".join(chunks)
    user = (
        f"Create exactly {count} flashcards from the study material below. "
        'Respond with JSON of the form {"flashcards": [{"question": "...", "answer": "..."}]}.\n\n'
        f"Material:\n{context}"
    )

    raw = llm.complete_json(SYSTEM_PROMPT, user)
    try:
        items = json.loads(raw).get("flashcards", [])
    except json.JSONDecodeError:
        raise RuntimeError("The model returned malformed flashcards. Try again.")

    cards = [
        Flashcard(question=item["question"], answer=item["answer"])
        for item in items
        if item.get("question") and item.get("answer")
    ]
    if not cards:
        raise RuntimeError("Could not generate flashcards from this document.")
    return cards[:count]

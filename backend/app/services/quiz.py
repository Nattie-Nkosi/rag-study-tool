import json

from app.models.schemas import QuizQuestion
from app.services import llm, vectorstore

SYSTEM_PROMPT = (
    "You are a study assistant that writes multiple-choice quiz questions from a document. "
    "Each question has exactly four options with one unambiguously correct answer drawn from "
    "the material, three plausible distractors, and a short explanation of why the answer is right."
)


def generate(document_id: str, count: int) -> list[QuizQuestion]:
    chunks = vectorstore.sample_chunks(document_id, max(count * 2, 12))
    if not chunks:
        raise RuntimeError("No content found for this document.")

    context = "\n\n---\n\n".join(chunks)
    user = (
        f"Write exactly {count} multiple-choice questions from the study material below. "
        "Respond with JSON of the form "
        '{"questions": [{"question": "...", "options": ["a", "b", "c", "d"], '
        '"answer": <0-based index of the correct option>, "explanation": "..."}]}.\n\n'
        f"Material:\n{context}"
    )

    raw = llm.complete_json(SYSTEM_PROMPT, user)
    try:
        items = json.loads(raw).get("questions", [])
    except json.JSONDecodeError:
        raise RuntimeError("The model returned a malformed quiz. Try again.")

    questions = [q for q in (_normalize(item) for item in items) if q is not None]
    if not questions:
        raise RuntimeError("Could not generate a quiz from this document.")
    return questions[:count]


def _normalize(item: dict) -> QuizQuestion | None:
    question = item.get("question")
    options = item.get("options")
    answer = item.get("answer")
    if not question or not isinstance(options, list) or len(options) < 2:
        return None

    options = [str(o) for o in options]
    if isinstance(answer, bool):
        return None
    if isinstance(answer, int):
        index = answer
    elif isinstance(answer, str) and answer.strip().isdigit():
        index = int(answer.strip())
    elif isinstance(answer, str) and answer in options:
        index = options.index(answer)
    else:
        return None

    if not 0 <= index < len(options):
        return None
    return QuizQuestion(
        question=question,
        options=options,
        answer=index,
        explanation=str(item.get("explanation", "")),
    )

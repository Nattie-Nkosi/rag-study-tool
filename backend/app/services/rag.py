from collections.abc import Iterator

from app.config import settings
from app.models.schemas import ChatMessage, ChatResponse, Source
from app.services import embeddings, llm, vectorstore

SYSTEM_PROMPT = (
    "You are a study assistant helping a user understand their document over an "
    "ongoing conversation. Answer the user's latest question using ONLY the provided "
    "context from their document (and the conversation so far). If the answer is not "
    "in the context, say you could not find it in the document. Be concise and cite "
    "relevant details."
)

REWRITE_PROMPT = (
    "Rewrite the user's follow-up question as a single standalone question that can "
    "be understood without the conversation. Resolve pronouns and references using "
    "the conversation. Keep the user's intent and wording where possible. Reply with "
    "the rewritten question only — no explanation, no quotes."
)

HISTORY_LIMIT = 8


def _build_prompt(question: str, contexts: list[str]) -> str:
    joined = "\n\n---\n\n".join(contexts)
    return f"Context:\n{joined}\n\nQuestion: {question}"


def rewrite_query(question: str, history: list[ChatMessage]) -> str:
    if not history:
        return question
    transcript = "\n".join(f"{m.role}: {m.content}" for m in history[-HISTORY_LIMIT:])
    try:
        rewritten = llm.complete(
            REWRITE_PROMPT,
            f"Conversation:\n{transcript}\n\nFollow-up question: {question}",
        ).strip().strip('"')
    except Exception:
        return question
    # A sane rewrite is a short question; anything else means the model rambled.
    if not rewritten or len(rewritten) > 300:
        return question
    return rewritten


def retrieve(document_id: str, query: str) -> tuple[list[str], list[Source]]:
    query_embedding = embeddings.embed([query])[0]
    results = vectorstore.query(document_id, query_embedding, settings.top_k)

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0] or [None] * len(documents)

    sources = [
        Source(
            chunk_index=meta.get("chunk_index", i),
            text=doc,
            score=_similarity(dist),
        )
        for i, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances))
    ]
    return documents, sources


def _messages(
    question: str, history: list[ChatMessage], contexts: list[str]
) -> list[dict]:
    past = [
        {"role": m.role, "content": m.content} for m in history[-HISTORY_LIMIT:]
    ]
    return [*past, {"role": "user", "content": _build_prompt(question, contexts)}]


def stream_tokens(
    question: str, history: list[ChatMessage], contexts: list[str]
) -> Iterator[str]:
    return llm.stream(SYSTEM_PROMPT, _messages(question, history, contexts))


def answer_question(
    document_id: str, question: str, history: list[ChatMessage] | None = None
) -> ChatResponse:
    history = history or []
    query = rewrite_query(question, history)
    documents, sources = retrieve(document_id, query)
    answer = "".join(stream_tokens(question, history, documents))
    return ChatResponse(answer=answer, sources=sources)


def _similarity(distance: float | None) -> float:
    """Cosine distance -> similarity in [0, 1]. Legacy L2 collections clamp to 0."""
    if distance is None:
        return 0.0
    return round(max(0.0, 1.0 - distance), 3)

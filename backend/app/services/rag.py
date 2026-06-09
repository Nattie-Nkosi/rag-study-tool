from app.config import settings
from app.models.schemas import ChatResponse, Source
from app.services import embeddings, llm, vectorstore

SYSTEM_PROMPT = (
    "You are a study assistant. Answer the user's question using ONLY the provided "
    "context from their document. If the answer is not in the context, say you "
    "could not find it in the document. Be concise and cite relevant details."
)


def _build_prompt(question: str, contexts: list[str]) -> str:
    joined = "\n\n---\n\n".join(contexts)
    return f"Context:\n{joined}\n\nQuestion: {question}"


def answer_question(document_id: str, question: str) -> ChatResponse:
    query_embedding = embed_query(question)
    results = vectorstore.query(document_id, query_embedding, settings.top_k)

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0] or [None] * len(documents)

    answer = llm.complete(SYSTEM_PROMPT, _build_prompt(question, documents))
    sources = [
        Source(
            chunk_index=meta.get("chunk_index", i),
            text=doc,
            score=_similarity(dist),
        )
        for i, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances))
    ]
    return ChatResponse(answer=answer, sources=sources)


def _similarity(distance: float | None) -> float:
    """Cosine distance -> similarity in [0, 1]. Legacy L2 collections clamp to 0."""
    if distance is None:
        return 0.0
    return round(max(0.0, 1.0 - distance), 3)


def embed_query(question: str) -> list[float]:
    return embeddings.embed([question])[0]

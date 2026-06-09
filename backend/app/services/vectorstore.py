from functools import lru_cache

import chromadb

from app.config import settings

_PREFIX = "doc_"


@lru_cache(maxsize=1)
def _client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(path=settings.chroma_dir)


def _collection(document_id: str):
    return _client().get_or_create_collection(name=f"{_PREFIX}{document_id}")


def add_chunks(
    document_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    filename: str,
) -> None:
    collection = _client().get_or_create_collection(
        name=f"{_PREFIX}{document_id}",
        metadata={
            "hnsw:space": "cosine",
            "filename": filename,
            "chunk_count": len(chunks),
        },
    )
    collection.add(
        ids=[f"{document_id}_{i}" for i in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"chunk_index": i} for i in range(len(chunks))],
    )


def query(document_id: str, query_embedding: list[float], top_k: int):
    collection = _collection(document_id)
    return collection.query(query_embeddings=[query_embedding], n_results=top_k)


def sample_chunks(document_id: str, n: int) -> list[str]:
    collection = _collection(document_id)
    total = collection.count()
    if total == 0:
        return []
    n = min(n, total)
    step = max(1, total // n)
    indices = list(range(0, total, step))[:n]
    ids = [f"{document_id}_{i}" for i in indices]
    return collection.get(ids=ids).get("documents", []) or []


def delete_document(document_id: str) -> None:
    try:
        _client().delete_collection(name=f"{_PREFIX}{document_id}")
    except Exception:
        pass


def list_documents() -> list[dict]:
    docs = []
    for item in _client().list_collections():
        # chromadb >=0.6 may yield names (str); older/newer yield Collection objects.
        col = _client().get_collection(item) if isinstance(item, str) else item
        if not col.name.startswith(_PREFIX):
            continue
        meta = col.metadata or {}
        docs.append(
            {
                "document_id": col.name[len(_PREFIX):],
                "filename": meta.get("filename", "document.pdf"),
                "chunk_count": meta.get("chunk_count", col.count()),
            }
        )
    return docs

import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, documents, flashcards
from app.services import embeddings


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=embeddings.warm_up, daemon=True).start()
    yield


app = FastAPI(title="RAG Study Tool", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(flashcards.router)


@app.get("/health")
def health():
    return {"status": "ok"}

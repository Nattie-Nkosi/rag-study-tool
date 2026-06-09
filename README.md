# RAG Study Tool

A document question-and-answer app. Upload a PDF, the app chunks and embeds it on
the fly, stores the vectors in a local ChromaDB, and lets you ask questions about
that specific document. Answers are generated with the Groq LLM API.

## Architecture

```
PDF upload ──> FastAPI backend ──> extract text ──> chunk ──> embed (sentence-transformers)
                                                                   │
                                                                   ▼
Next.js frontend  <── answer (Groq) <── retrieve top-k chunks <── ChromaDB (persistent)
```

- **frontend/** — Next.js (App Router, TypeScript) UI: upload dropzone + chat panel.
- **backend/** — FastAPI service: PDF parsing, chunking, embeddings, Chroma store, Groq RAG.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Frontend       | Next.js + TypeScript                     |
| Backend        | FastAPI (Python)                         |
| PDF parsing    | pypdf                                    |
| Embeddings     | sentence-transformers (`all-MiniLM-L6-v2`) |
| Vector store   | ChromaDB (persistent, on disk)           |
| Generation LLM | Groq API                                 |

## Getting started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # then add your GROQ_API_KEY
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Backend runs on http://localhost:8000, frontend on http://localhost:3000.

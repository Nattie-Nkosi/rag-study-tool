import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import UploadResponse
from app.services import chunking, embeddings, pdf, vectorstore

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=UploadResponse)
async def upload_document(file: UploadFile) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    document_id = uuid.uuid4().hex
    os.makedirs(settings.upload_dir, exist_ok=True)
    path = os.path.join(settings.upload_dir, f"{document_id}.pdf")

    with open(path, "wb") as f:
        f.write(await file.read())

    text = pdf.extract_text(path)
    if not text:
        raise HTTPException(status_code=422, detail="No extractable text in PDF")

    chunks = chunking.chunk_text(text, settings.chunk_size, settings.chunk_overlap)
    vectors = embeddings.embed(chunks)
    vectorstore.add_chunks(document_id, chunks, vectors, file.filename)

    return UploadResponse(
        document_id=document_id,
        filename=file.filename,
        chunk_count=len(chunks),
    )


@router.get("", response_model=list[UploadResponse])
def list_documents() -> list[UploadResponse]:
    return [UploadResponse(**doc) for doc in vectorstore.list_documents()]

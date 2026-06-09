import type { ChatResponse, FlashcardResponse, UploadResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function listDocuments(): Promise<UploadResponse[]> {
  const res = await fetch(`${API_URL}/documents`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${documentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateFlashcards(
  documentId: string,
  count = 10,
): Promise<FlashcardResponse> {
  const res = await fetch(`${API_URL}/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, count }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function askQuestion(
  documentId: string,
  question: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

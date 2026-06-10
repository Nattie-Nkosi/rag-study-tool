import type {
  ChatResponse,
  FlashcardResponse,
  HistoryMessage,
  QuizResponse,
  Source,
  UploadResponse,
} from "./types";

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

export async function generateQuiz(
  documentId: string,
  count = 5,
): Promise<QuizResponse> {
  const res = await fetch(`${API_URL}/quiz`, {
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
  history: HistoryMessage[] = [],
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question, history }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type StreamEvent =
  | { type: "sources"; query: string; sources: Source[] }
  | { type: "token"; token: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function streamQuestion(
  documentId: string,
  question: string,
  history: HistoryMessage[],
  handlers: {
    onSources: (query: string, sources: Source[]) => void;
    onToken: (token: string) => void;
  },
): Promise<void> {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question, history }),
  });
  if (!res.ok || !res.body) throw new Error(await res.text());

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6))
        .join("");
      if (!data) continue;
      const event = JSON.parse(data) as StreamEvent;
      if (event.type === "sources") handlers.onSources(event.query, event.sources);
      else if (event.type === "token") handlers.onToken(event.token);
      else if (event.type === "error") throw new Error(event.message);
      else if (event.type === "done") return;
    }
  }
}

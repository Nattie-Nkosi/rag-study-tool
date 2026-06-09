export interface UploadResponse {
  document_id: string;
  filename: string;
  chunk_count: number;
}

export interface Source {
  chunk_index: number;
  text: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  query?: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardResponse {
  flashcards: Flashcard[];
}

"use client";

import { useEffect, useState } from "react";

import ChatPane from "@/components/ChatPane";
import InspectorPane, { type RetrievalState } from "@/components/InspectorPane";
import { askQuestion, listDocuments, uploadDocument } from "@/lib/api";
import type { Message, UploadResponse } from "@/lib/types";

export default function Home() {
  const [doc, setDoc] = useState<UploadResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrieval, setRetrieval] = useState<RetrievalState>({ status: "idle" });

  useEffect(() => {
    listDocuments()
      .then((docs) => docs.length > 0 && setDoc((d) => d ?? docs[docs.length - 1]))
      .catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    try {
      const uploaded = await uploadDocument(file);
      setDoc(uploaded);
      setMessages([]);
      setRetrieval({ status: "idle" });
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Upload failed" },
      ]);
    }
  }

  async function handleSend(question: string) {
    if (!doc) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    setRetrieval({ status: "querying", query: question });
    try {
      const res = await askQuestion(doc.document_id, question);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
      setRetrieval({ status: "results", query: question, sources: res.sources });
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Request failed" },
      ]);
      setRetrieval({ status: "idle" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <ChatPane
        doc={doc}
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onUpload={handleUpload}
      />
      <InspectorPane doc={doc} retrieval={retrieval} />
    </main>
  );
}

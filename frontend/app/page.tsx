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
  const [flash, setFlash] = useState(0);

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
        { role: "assistant", content: res.answer, sources: res.sources, query: question },
      ]);
      setRetrieval({ status: "results", query: question, sources: res.sources });
      setFlash((f) => f + 1);
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

  function handleShowSources(m: Message) {
    if (!m.sources || m.sources.length === 0) return;
    setRetrieval({ status: "results", query: m.query ?? "", sources: m.sources });
    setFlash((f) => f + 1);
  }

  return (
    <main className="app">
      <ChatPane
        doc={doc}
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onUpload={handleUpload}
        onShowSources={handleShowSources}
      />
      <InspectorPane doc={doc} retrieval={retrieval} flash={flash} />
    </main>
  );
}

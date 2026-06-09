"use client";

import { useEffect, useState } from "react";

import ChatPane from "@/components/ChatPane";
import DocSwitcher from "@/components/DocSwitcher";
import FlashcardsPane from "@/components/FlashcardsPane";
import InspectorPane, { type RetrievalState } from "@/components/InspectorPane";
import { askQuestion, deleteDocument, listDocuments, uploadDocument } from "@/lib/api";
import type { Message, UploadResponse } from "@/lib/types";

type Mode = "chat" | "study";

export default function Home() {
  const [docs, setDocs] = useState<UploadResponse[]>([]);
  const [doc, setDoc] = useState<UploadResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrieval, setRetrieval] = useState<RetrievalState>({ status: "idle" });
  const [flash, setFlash] = useState(0);
  const [mode, setMode] = useState<Mode>("chat");

  useEffect(() => {
    listDocuments()
      .then((list) => {
        setDocs(list);
        if (list.length > 0) setDoc((d) => d ?? list[list.length - 1]);
      })
      .catch(() => {});
  }, []);

  function resetForDoc(next: UploadResponse) {
    setDoc(next);
    setMessages([]);
    setRetrieval({ status: "idle" });
  }

  function handleSelectDoc(next: UploadResponse) {
    if (next.document_id === doc?.document_id) return;
    resetForDoc(next);
  }

  async function handleDeleteDoc(target: UploadResponse) {
    try {
      await deleteDocument(target.document_id);
    } catch {
      return;
    }
    const next = docs.filter((d) => d.document_id !== target.document_id);
    setDocs(next);
    if (target.document_id === doc?.document_id) {
      const fallback = next[next.length - 1] ?? null;
      if (fallback) {
        resetForDoc(fallback);
      } else {
        setDoc(null);
        setMessages([]);
        setRetrieval({ status: "idle" });
      }
    }
  }

  async function handleUpload(file: File) {
    try {
      const uploaded = await uploadDocument(file);
      setDocs((list) =>
        list.some((d) => d.document_id === uploaded.document_id)
          ? list
          : [...list, uploaded],
      );
      resetForDoc(uploaded);
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
      <section className="chat">
        <header className="chat-header">
          <div className="header-left">
            <span className="app-title">AI App</span>
            <DocSwitcher
              docs={docs}
              active={doc}
              onSelect={handleSelectDoc}
              onUpload={handleUpload}
              onDelete={handleDeleteDoc}
            />
          </div>
          <div className="mode-toggle">
            <button
              className={mode === "chat" ? "active" : ""}
              onClick={() => setMode("chat")}
            >
              Chat
            </button>
            <button
              className={mode === "study" ? "active" : ""}
              onClick={() => setMode("study")}
            >
              Flashcards
            </button>
          </div>
        </header>

        {mode === "chat" ? (
          <ChatPane
            doc={doc}
            messages={messages}
            loading={loading}
            onSend={handleSend}
            onUpload={handleUpload}
            onShowSources={handleShowSources}
          />
        ) : (
          <FlashcardsPane key={doc?.document_id ?? "none"} doc={doc} />
        )}
      </section>

      <InspectorPane doc={doc} retrieval={retrieval} flash={flash} />
    </main>
  );
}

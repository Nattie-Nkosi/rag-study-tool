"use client";

import { useEffect, useRef, useState } from "react";

import type { Message, UploadResponse } from "@/lib/types";
import { ArrowUpIcon, DatabaseIcon } from "./icons";

const SUGGESTIONS = [
  "What is the main argument?",
  "Summarize the key points",
  "What are the conclusions?",
];

export default function ChatPane({
  doc,
  messages,
  loading,
  onSend,
  onUpload,
}: {
  doc: UploadResponse | null;
  messages: Message[];
  loading: boolean;
  onSend: (question: string) => void;
  onUpload: (file: File) => void;
}) {
  const [input, setInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function submit(text: string) {
    const q = text.trim();
    if (!q || loading || !doc) return;
    onSend(q);
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <section className="chat">
      <header className="chat-header">AI App</header>

      <div className="chat-body scrollbar" ref={bodyRef}>
        {empty ? (
          <div className="empty-state">
            <div className="empty-title">Ask a question</div>
            <div className="pills">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="pill"
                  disabled={!doc || loading}
                  onClick={() => submit(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {!doc && (
              <button className="pill" onClick={() => fileRef.current?.click()}>
                ＋ Load a PDF to begin
              </button>
            )}
          </div>
        ) : (
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
                {m.sources && m.sources.length > 0 && (
                  <div className="ref">
                    {m.sources.length} chunk{m.sources.length > 1 ? "s" : ""} retrieved →
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="thinking dots">retrieving</div>}
          </div>
        )}
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            rows={1}
            value={input}
            placeholder="How can we help?"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
          />
          <div className="composer-footer">
            <button
              className={`kb-chip ${doc ? "" : "empty"}`}
              onClick={() => fileRef.current?.click()}
              title={doc ? "Replace knowledge base" : "Upload a PDF"}
            >
              <DatabaseIcon />
              {doc ? doc.filename : "select source…"}
            </button>
            <button
              className="send-btn"
              disabled={!input.trim() || loading || !doc}
              onClick={() => submit(input)}
            >
              <ArrowUpIcon />
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}

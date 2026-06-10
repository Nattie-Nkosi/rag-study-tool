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
  onShowSources,
}: {
  doc: UploadResponse | null;
  messages: Message[];
  loading: boolean;
  onSend: (question: string) => void;
  onUpload: (file: File) => void;
  onShowSources: (message: Message) => void;
}) {
  const [input, setInput] = useState("");
  const [dragDepth, setDragDepth] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const streamingNow = messages[messages.length - 1]?.streaming === true;

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (streamingNow) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, streamingNow]);

  function submit(text: string) {
    const q = text.trim();
    if (!q || loading || !doc) return;
    onSend(q);
    setInput("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragDepth(0);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") onUpload(f);
  }

  const empty = messages.length === 0;

  return (
    <div
      className="chat-main"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
      onDrop={handleDrop}
    >
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
                {m.streaming && <span className="caret" />}
                {!m.streaming && m.sources && m.sources.length > 0 && (
                  <button className="ref" onClick={() => onShowSources(m)}>
                    {m.sources.length} chunk{m.sources.length > 1 ? "s" : ""} retrieved →
                  </button>
                )}
              </div>
            ))}
            {loading && !streamingNow && (
              <div className="thinking">
                <span className="tdot" />
                <span className="tdot" />
                <span className="tdot" />
                <span className="label">searching vectors</span>
              </div>
            )}
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

      {dragDepth > 0 && <div className="drop-overlay">Drop your PDF to add it</div>}
    </div>
  );
}

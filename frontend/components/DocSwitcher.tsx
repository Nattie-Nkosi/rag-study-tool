"use client";

import { useEffect, useRef, useState } from "react";

import type { UploadResponse } from "@/lib/types";
import { DatabaseIcon, TrashIcon } from "./icons";

export default function DocSwitcher({
  docs,
  active,
  onSelect,
  onUpload,
  onDelete,
}: {
  docs: UploadResponse[];
  active: UploadResponse | null;
  onSelect: (doc: UploadResponse) => void;
  onUpload: (file: File) => void;
  onDelete: (doc: UploadResponse) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="doc-switcher" ref={ref}>
      <button className="doc-trigger" onClick={() => setOpen((o) => !o)}>
        <DatabaseIcon />
        <span className="doc-name">{active ? active.filename : "No document"}</span>
        <span className="chevron">▾</span>
      </button>

      {open && (
        <div className="doc-menu">
          {docs.length === 0 && <div className="doc-empty">No documents yet</div>}
          {docs.map((d) => (
            <div
              key={d.document_id}
              className={`doc-row ${d.document_id === active?.document_id ? "active" : ""}`}
            >
              <button
                className="doc-item"
                onClick={() => {
                  onSelect(d);
                  setOpen(false);
                }}
              >
                <span className="doc-item-name">{d.filename}</span>
                <span className="doc-item-meta">{d.chunk_count.toLocaleString()} chunks</span>
              </button>
              <button
                className="doc-delete"
                title="Delete document"
                onClick={() => {
                  if (confirm(`Delete "${d.filename}"? This removes its embeddings.`)) {
                    onDelete(d);
                  }
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          <button className="doc-upload" onClick={() => fileRef.current?.click()}>
            ＋ Upload PDF
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
          setOpen(false);
        }}
      />
    </div>
  );
}

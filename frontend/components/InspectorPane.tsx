"use client";

import type { Source, UploadResponse } from "@/lib/types";

export type RetrievalState =
  | { status: "idle" }
  | { status: "querying"; query: string }
  | { status: "results"; query: string; sources: Source[] };

export default function InspectorPane({
  doc,
  retrieval,
  flash,
}: {
  doc: UploadResponse | null;
  retrieval: RetrievalState;
  flash: number;
}) {
  const records = doc ? doc.chunk_count.toLocaleString() : "0";

  return (
    <section className="inspector">
      <header className="inspector-header">
        <span className="brand">Chroma</span>
        <span className="meta">
          <span className="kb">{doc ? "knowledge_base" : "no_collection"}</span>
          {" · "}
          {records} records
        </span>
      </header>

      <div className="inspector-body">
        {retrieval.status === "idle" ? (
          <div className="dashed centered">
            <span className="await-text">
              awaiting query input
              <span className="blink" />
            </span>
          </div>
        ) : retrieval.status === "querying" ? (
          <div className="dashed centered">
            <div className="scan">
              <span className="await-text">
                querying knowledge_base
                <span className="blink" />
              </span>
              <span className="scan-row" />
              <span className="scan-row" />
              <span className="scan-row" />
            </div>
          </div>
        ) : (
          <div className="dashed scrollbar">
            <div className="records" key={flash}>
              <div className="records-query">
                query: <b>{retrieval.query}</b>
                {"  →  "}
                {retrieval.sources.length} nearest by cosine similarity
              </div>
              {retrieval.sources.map((s, i) => (
                <div
                  className="record flash-in"
                  key={s.chunk_index}
                  style={{ animationDelay: `${i * 0.11}s` }}
                >
                  <div className="record-head">
                    <span className="id">chunk #{s.chunk_index}</span>
                    <span className="score">
                      <span className="score-bar">
                        <span
                          className="score-fill"
                          style={{
                            width: `${Math.round(s.score * 100)}%`,
                            animationDelay: `${0.3 + i * 0.11}s`,
                          }}
                        />
                      </span>
                      {s.score.toFixed(3)}
                    </span>
                  </div>
                  <div className="record-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

import { generateFlashcards } from "@/lib/api";
import type { Flashcard, UploadResponse } from "@/lib/types";

export default function FlashcardsPane({ doc }: { doc: UploadResponse | null }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!doc || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateFlashcards(doc.document_id, 10);
      setCards(res.flashcards);
      setIndex(0);
      setFlipped(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate flashcards");
    } finally {
      setLoading(false);
    }
  }

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), cards.length - 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (cards.length === 0) return;
      if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  if (!doc) {
    return (
      <div className="chat-body">
        <div className="empty-state">
          <div className="empty-title">Load a PDF to make flashcards</div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="chat-body">
        <div className="empty-state">
          <div className="empty-title">Generate flashcards from your document</div>
          <button className="primary-btn" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate 10 cards"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="chat-body">
      <div className="deck">
        <div
          className={`flashcard ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-face flashcard-front">
              <span className="face-label">Question</span>
              <p>{card.question}</p>
              <span className="flip-hint">click to reveal</span>
            </div>
            <div className="flashcard-face flashcard-back">
              <span className="face-label">Answer</span>
              <p>{card.answer}</p>
            </div>
          </div>
        </div>

        <div className="deck-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              className={`deck-dot ${i === index ? "on" : ""}`}
              aria-label={`Card ${i + 1}`}
              onClick={() => {
                setFlipped(false);
                setIndex(i);
              }}
            />
          ))}
        </div>

        <div className="deck-controls">
          <button className="nav-btn" onClick={() => go(-1)} disabled={index === 0}>
            ← Prev
          </button>
          <span className="deck-counter">
            {index + 1} / {cards.length}
          </span>
          <button
            className="nav-btn"
            onClick={() => go(1)}
            disabled={index === cards.length - 1}
          >
            Next →
          </button>
        </div>

        <div className="kbd-hint">
          <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>space</kbd> flips
        </div>

        <button className="ghost-btn" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "↻ Regenerate"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}

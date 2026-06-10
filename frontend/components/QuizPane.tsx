"use client";

import { useEffect, useState } from "react";

import { generateQuiz } from "@/lib/api";
import type { QuizQuestion, UploadResponse } from "@/lib/types";

const CONFETTI_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

function ScoreRing({ pct }: { pct: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="75" cy="75" r={r} fill="none" stroke="#e4e4e7" strokeWidth="11" />
      <circle
        cx="75"
        cy="75"
        r={r}
        fill="none"
        stroke="url(#scoreGrad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 75 75)"
        className="ring-fill"
        style={{ "--c": c } as React.CSSProperties}
      />
      <text x="75" y="79" textAnchor="middle" className="ring-label">
        {pct}%
      </text>
      <text x="75" y="98" textAnchor="middle" className="ring-sub">
        correct
      </text>
    </svg>
  );
}

function Confetti() {
  return (
    <div className="confetti">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 12) * 0.1}s`,
            animationDuration: `${2.1 + (i % 5) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function QuizPane({ doc }: { doc: UploadResponse | null }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!doc || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateQuiz(doc.document_id, 5);
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(null));
      setIndex(0);
      setFinished(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate a quiz");
    } finally {
      setLoading(false);
    }
  }

  function select(option: number) {
    if (answers[index] != null) return;
    setAnswers((a) => a.map((v, i) => (i === index ? option : v)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (loading || finished || questions.length === 0) return;
      const q = questions[index];
      const chosen = answers[index];
      const byLetter = "abcd".indexOf(e.key.toLowerCase());
      const byNumber = "1234".indexOf(e.key);
      const pick = byLetter >= 0 ? byLetter : byNumber;
      if (chosen == null && pick >= 0 && pick < q.options.length) {
        setAnswers((a) => a.map((v, i) => (i === index ? pick : v)));
      } else if ((e.key === "ArrowRight" || e.key === "Enter") && chosen != null) {
        if (index === questions.length - 1) setFinished(true);
        else setIndex((i) => i + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions, answers, index, finished, loading]);

  if (!doc) {
    return (
      <div className="chat-body">
        <div className="empty-state">
          <div className="empty-title">Load a PDF to take a quiz</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="chat-body">
        <div className="empty-state">
          <div className="empty-title">Test yourself on your document</div>
          <button className="primary-btn" onClick={generate} disabled={loading}>
            {loading ? "Building quiz…" : "Start a 5-question quiz"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    );
  }

  const score = answers.filter((a, i) => a === questions[i].answer).length;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const msg =
      pct === 100
        ? "Perfect score!"
        : pct >= 80
          ? "Excellent work!"
          : pct >= 60
            ? "Nice — solid grasp."
            : "Keep studying — run it back!";
    return (
      <div className="chat-body">
        <div className="quiz-result">
          {pct >= 60 && <Confetti />}
          <ScoreRing pct={pct} />
          <div className="result-msg">{msg}</div>
          <div className="result-pct">
            {score} of {questions.length} questions
          </div>
          <div className="result-actions">
            <button
              className="nav-btn"
              onClick={() => {
                setFinished(false);
                setIndex(0);
              }}
            >
              Review answers
            </button>
            <button className="primary-btn" onClick={generate} disabled={loading}>
              {loading ? "Building…" : "New quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const chosen = answers[index];
  const answered = chosen != null;
  const isLast = index === questions.length - 1;

  return (
    <div className="chat-body">
      <div className="quiz">
        <div className="quiz-progress">
          <span>
            Question {index + 1} / {questions.length}
          </span>
          <span>Score {score}</span>
        </div>

        <div className="quiz-track">
          <div
            className="quiz-track-fill"
            style={{
              width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>

        <p className="quiz-question">{q.question}</p>

        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = "quiz-option";
            if (answered) {
              if (i === q.answer) cls += " correct";
              else if (i === chosen) cls += " wrong";
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={answered}
                onClick={() => select(i)}
              >
                <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && q.explanation && (
          <div className="quiz-explanation">
            <strong>{chosen === q.answer ? "Correct." : "Not quite."}</strong>{" "}
            {q.explanation}
          </div>
        )}

        <div className="deck-controls">
          <button
            className="nav-btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
          >
            ← Prev
          </button>
          {isLast ? (
            <button
              className="primary-btn"
              onClick={() => setFinished(true)}
              disabled={!answered}
            >
              Finish
            </button>
          ) : (
            <button
              className="nav-btn"
              onClick={() => setIndex((i) => i + 1)}
              disabled={!answered}
            >
              Next →
            </button>
          )}
        </div>

        <div className="kbd-hint">
          <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>↵</kbd> next
        </div>
      </div>
    </div>
  );
}

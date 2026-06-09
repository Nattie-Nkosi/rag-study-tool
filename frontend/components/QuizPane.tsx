"use client";

import { useState } from "react";

import { generateQuiz } from "@/lib/api";
import type { QuizQuestion, UploadResponse } from "@/lib/types";

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
    return (
      <div className="chat-body">
        <div className="quiz-result">
          <div className="result-score">
            {score} / {questions.length}
          </div>
          <div className="result-pct">{pct}% correct</div>
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
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Study Tool",
  description: "Chat with, review, and quiz yourself on your PDFs.",
};

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#brandGrad)" />
      <path d="M7 8.5h10M7 12h10M7 15.5h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="app-header">
            <div className="brand">
              <BrandMark />
              <span className="brand-name">RAG Study Tool</span>
              <span className="brand-chip">beta</span>
            </div>
            <nav className="app-nav">
              <span>Chat</span>
              <span className="dot">·</span>
              <span>Flashcards</span>
              <span className="dot">·</span>
              <span>Quiz</span>
            </nav>
          </header>

          {children}

          <footer className="app-footer">
            <span>Ask, review, and quiz your documents.</span>
            <span className="footer-stack">Next.js · FastAPI · Chroma · Groq</span>
          </footer>
        </div>
      </body>
    </html>
  );
}

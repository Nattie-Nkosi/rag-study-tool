import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Study Tool",
  description: "Upload a PDF and ask questions about it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

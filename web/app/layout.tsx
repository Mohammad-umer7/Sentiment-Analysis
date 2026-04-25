import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentimentAI — Analyze Reviews Instantly",
  description: "Powered by DistilBERT. Analyze single reviews or upload a CSV to get positive/negative sentiment breakdown.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import SingleReview from "@/components/SingleReview";
import CSVUpload from "@/components/CSVUpload";

type Tab = "single" | "csv";

export default function Home() {
  const [tab, setTab] = useState<Tab>("single");

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-bold text-white tracking-tight">SentimentAI</span>
        </div>
        <a
          href="https://huggingface.co/Mohammad-Umer7/imdb-sentiment-bert"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-violet-400 transition"
        >
          Model on HuggingFace ↗
        </a>
      </header>

      {/* Hero */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
          Sentiment Analysis
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          Powered by DistilBERT. Analyze a single review or upload a CSV with thousands of reviews and get an instant breakdown.
        </p>
      </div>

      {/* Card */}
      <main className="flex-1 flex justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab("single")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === "single"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Single Review
            </button>
            <button
              onClick={() => setTab("csv")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === "csv"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bulk CSV Upload
            </button>
          </div>

          {/* Panel */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl">
            {tab === "single" ? <SingleReview /> : <CSVUpload />}
          </div>

          {/* Info strip */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span>✓ DistilBERT model</span>
            <span>✓ Max 2,000 rows per CSV</span>
            <span>✓ No data stored</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        Built by Mohammad-umer7 · Model hosted on Hugging Face
      </footer>
    </div>
  );
}

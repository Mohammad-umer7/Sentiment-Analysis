"use client";

import { useState } from "react";
import SingleReview from "@/components/SingleReview";
import CSVUpload from "@/components/CSVUpload";

type Tab = "single" | "csv";

export default function Home() {
  const [tab, setTab] = useState<Tab>("single");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm">🧠</div>
          <span className="text-base font-bold text-white tracking-tight">SentimentAI</span>
        </div>
        <a
          href="https://huggingface.co/Mohammad-Umer7/imdb-sentiment-bert"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-violet-400 transition flex items-center gap-1"
        >
          Model on HuggingFace ↗
        </a>
      </header>

      {/* Warmup banner */}
      {!bannerDismissed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-3">
          <span className="text-amber-400 text-sm">⚡</span>
          <p className="text-amber-300 text-xs font-medium">
            First analysis may take 20–40 seconds to warm up — all requests after that are instant.
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-amber-500 hover:text-amber-300 text-xs ml-2 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="text-center pt-14 pb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-5">
          ✦ Powered by your DistilBERT model
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight mb-4 leading-tight">
          Sentiment Analysis
        </h1>
        <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
          Analyze a single review or upload a CSV / Excel file with thousands of reviews and get an instant breakdown.
        </p>
      </div>

      {/* Card */}
      <main className="flex-1 flex justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          {/* Tabs */}
          <div className="flex bg-slate-800/80 border border-slate-700 rounded-2xl p-1 mb-5 gap-1">
            <button
              onClick={() => setTab("single")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === "single"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Single Review
            </button>
            <button
              onClick={() => setTab("csv")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === "csv"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bulk Upload
            </button>
          </div>

          {/* Panel */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-2xl shadow-slate-900/50 backdrop-blur-sm">
            {tab === "single" ? <SingleReview /> : <CSVUpload />}
          </div>

          {/* Info strip */}
          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-slate-600">
            <span>✓ Your DistilBERT model</span>
            <span>✓ CSV &amp; Excel support</span>
            <span>✓ No data stored</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-5 text-center text-xs text-slate-600">
        Built by Mohammad-umer7 · Model hosted on Hugging Face
      </footer>
    </div>
  );
}

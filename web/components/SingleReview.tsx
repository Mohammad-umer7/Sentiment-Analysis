"use client";

import { useState } from "react";

interface Result {
  label: "POSITIVE" | "NEGATIVE";
  score: number;
}

export default function SingleReview() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (text.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const confidence = result ? Math.round(result.score * 100) : 0;
  const isPositive = result?.label === "POSITIVE";
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Paste your review
        </label>
        <textarea
          className="w-full h-36 bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm leading-relaxed"
          placeholder="e.g. This movie was absolutely fantastic! The acting was superb and the story kept me hooked..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-slate-600 mt-1.5">{wordCount} word{wordCount !== 1 ? "s" : ""} · min 3 words</p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || wordCount < 3}
        className="w-full py-3 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-violet-900/30"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </span>
        ) : (
          "Analyze Sentiment"
        )}
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`rounded-2xl border p-5 space-y-4 ${
            isPositive
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isPositive ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {isPositive ? "😊" : "😞"}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Sentiment</p>
                <p className={`text-2xl font-black tracking-tight ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {result.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Confidence</p>
              <p className="text-3xl font-black text-white">{confidence}%</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isPositive ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

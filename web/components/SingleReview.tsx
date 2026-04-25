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

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Paste your review below
        </label>
        <textarea
          className="w-full h-36 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          placeholder="e.g. This movie was absolutely fantastic! The acting was superb..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-slate-500 mt-1">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || text.trim().length < 3}
        className="w-full py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {loading ? "Analyzing..." : "Analyze Sentiment"}
      </button>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`rounded-xl border p-5 space-y-4 transition-all ${
            isPositive
              ? "bg-emerald-900/30 border-emerald-700"
              : "bg-red-900/30 border-red-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{isPositive ? "😊" : "😞"}</span>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Result</p>
                <p
                  className={`text-2xl font-bold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {result.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Confidence</p>
              <p className="text-2xl font-bold text-white">{confidence}%</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Negative</span>
              <span>Positive</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isPositive ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: isPositive ? `${confidence}%` : `${100 - confidence}%`, marginLeft: isPositive ? "0" : undefined }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

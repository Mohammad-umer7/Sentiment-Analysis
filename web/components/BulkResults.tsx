"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RowResult {
  text: string;
  label: "POSITIVE" | "NEGATIVE";
  score: number;
}

interface Props {
  results: RowResult[];
  skipped: number;
  onReset: () => void;
}

type Filter = "ALL" | "POSITIVE" | "NEGATIVE";

const PIE_COLORS = ["#34d399", "#f87171"];

export default function BulkResults({ results, skipped, onReset }: Props) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const positive = results.filter((r) => r.label === "POSITIVE").length;
  const negative = results.length - positive;
  const posPercent = Math.round((positive / results.length) * 100);
  const negPercent = 100 - posPercent;

  const pieData = [
    { name: "Positive", value: positive },
    { name: "Negative", value: negative },
  ];

  const filtered =
    filter === "ALL" ? results : results.filter((r) => r.label === filter);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function downloadCSV() {
    const header = "text,label,confidence";
    const rows = results.map(
      (r) => `"${r.text.replace(/"/g, '""')}",${r.label},${Math.round(r.score * 100)}%`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sentiment_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-white">{results.length.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">Total</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">{posPercent}%</p>
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">Positive · {positive}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-red-400">{negPercent}%</p>
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">Negative · {negative}</p>
        </div>
      </div>

      {skipped > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {skipped} row{skipped > 1 ? "s" : ""} skipped (too short or empty)
        </p>
      )}

      {/* Pie chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 text-center">Sentiment Breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "10px",
                fontSize: "13px",
              }}
              itemStyle={{ color: "#cbd5e1" }}
              formatter={(value: number) => [`${value} reviews`, ""]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Filter + table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(["ALL", "POSITIVE", "NEGATIVE"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === f
                    ? "bg-violet-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={downloadCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition flex items-center gap-1.5"
          >
            ↓ Download CSV
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide w-8">#</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Review</th>
                <th className="text-center px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide w-28">Sentiment</th>
                <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide w-28">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {pageRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition">
                  <td className="px-4 py-3 text-slate-500 text-xs">{page * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs">
                    <span className="line-clamp-1">{row.text}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.label === "POSITIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 font-medium">
                    {Math.round(row.score * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold"
            >
              ← Prev
            </button>
            <span className="text-slate-400 text-xs">
              Page {page + 1} of {pageCount} · {filtered.length} results
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl font-semibold text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition"
      >
        Analyze Another File
      </button>
    </div>
  );
}

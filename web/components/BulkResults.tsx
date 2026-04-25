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

const COLORS = { POSITIVE: "#34d399", NEGATIVE: "#f87171" };

type Filter = "ALL" | "POSITIVE" | "NEGATIVE";

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
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{results.length.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Total Analyzed</p>
        </div>
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{posPercent}%</p>
          <p className="text-xs text-slate-400 mt-1">Positive ({positive.toLocaleString()})</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{negPercent}%</p>
          <p className="text-xs text-slate-400 mt-1">Negative ({negative.toLocaleString()})</p>
        </div>
      </div>

      {skipped > 0 && (
        <p className="text-xs text-slate-500">
          {skipped} row{skipped > 1 ? "s" : ""} skipped (too short or empty).
        </p>
      )}

      {/* Pie chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#cbd5e1" }}
              itemStyle={{ color: "#cbd5e1" }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{value}</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
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
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
          >
            Download CSV
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Review</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Result</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {pageRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-700/40 transition">
                  <td className="px-4 py-3 text-slate-500">{page * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{row.text}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.label === "POSITIVE"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {Math.round(row.score * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-400">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition"
      >
        Analyze Another File
      </button>
    </div>
  );
}

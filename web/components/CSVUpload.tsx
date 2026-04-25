"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import BulkResults from "./BulkResults";

interface RowResult {
  text: string;
  label: "POSITIVE" | "NEGATIVE";
  score: number;
}

type Step = "upload" | "pick" | "preview" | "results";

const MAX_ROWS = 2000;
const LOOKS_LIKE_TEXT_THRESHOLD = 0.6;

function looksLikeReview(samples: string[]): boolean {
  const textual = samples.filter(
    (s) => s && typeof s === "string" && s.trim().split(/\s+/).length >= 3
  );
  return textual.length / samples.length >= LOOKS_LIKE_TEXT_THRESHOLD;
}

export default function CSVUpload() {
  const [step, setStep] = useState<Step>("upload");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [selectedCol, setSelectedCol] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const data = result.data as Record<string, string>[];
        if (data.length === 0) {
          setError("CSV file is empty.");
          return;
        }
        const cols = Object.keys(data[0]);
        if (cols.length === 0) {
          setError("No columns found in CSV.");
          return;
        }
        setRows(data);
        setColumns(cols);
        setSelectedCol(cols[0]);
        setStep("pick");
      },
      error(err) {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleColChange(col: string) {
    setSelectedCol(col);
    setWarning(null);
    const samples = rows.slice(0, 20).map((r) => r[col] ?? "");
    if (!looksLikeReview(samples)) {
      setWarning(
        "This column doesn't look like text reviews. Are you sure you selected the right column?"
      );
    }
  }

  function handlePreview() {
    const samples = rows.slice(0, 20).map((r) => r[selectedCol] ?? "");
    if (!looksLikeReview(samples) && !warning) {
      setWarning("This column doesn't look like text reviews. Double-check your selection.");
    }
    setPreview(rows.slice(0, 5).map((r) => r[selectedCol] ?? ""));
    setStep("preview");
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setProgress(0);

    const validRows = rows
      .map((r) => r[selectedCol]?.trim() ?? "")
      .filter((t) => t.split(/\s+/).length >= 3);

    const skippedCount = rows.length - validRows.length;
    setSkipped(skippedCount);

    if (validRows.length === 0) {
      setError("No valid text rows found in the selected column.");
      setLoading(false);
      return;
    }

    const capped = validRows.slice(0, MAX_ROWS);

    try {
      // Send in chunks to update progress
      const CHUNK = 200;
      const allResults: RowResult[] = [];

      for (let i = 0; i < capped.length; i += CHUNK) {
        const chunk = capped.slice(i, i + CHUNK);
        const res = await fetch("/api/analyze-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Batch analysis failed.");

        (data.results as { label: "POSITIVE" | "NEGATIVE"; score: number }[]).forEach(
          (r, idx) => {
            allResults.push({ text: chunk[idx], label: r.label, score: r.score });
          }
        );
        setProgress(Math.round(((i + chunk.length) / capped.length) * 100));
      }

      setResults(allResults);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("upload");
    setColumns([]);
    setRows([]);
    setSelectedCol("");
    setWarning(null);
    setPreview([]);
    setResults([]);
    setError(null);
    setProgress(0);
    setSkipped(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (step === "results") {
    return <BulkResults results={results} skipped={skipped} onReset={reset} />;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Upload */}
      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl p-10 text-center cursor-pointer transition"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-4xl mb-3">📂</div>
          <p className="text-slate-300 font-medium">Drop your CSV here or click to browse</p>
          <p className="text-slate-500 text-sm mt-1">Max {MAX_ROWS.toLocaleString()} rows</p>
        </div>
      )}

      {/* Column picker */}
      {(step === "pick" || step === "preview") && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Which column contains the reviews?
            </label>
            <select
              value={selectedCol}
              onChange={(e) => handleColChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={step === "preview"}
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {rows.length.toLocaleString()} rows detected
            </p>
          </div>

          {warning && (
            <div className="bg-amber-900/40 border border-amber-700 rounded-xl px-4 py-3 text-amber-300 text-sm flex gap-2">
              <span>⚠️</span>
              <span>{warning}</span>
            </div>
          )}

          {step === "pick" && (
            <button
              onClick={handlePreview}
              className="w-full py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition"
            >
              Preview &amp; Confirm
            </button>
          )}
        </div>
      )}

      {/* Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">
              Preview — first 5 rows from <span className="text-violet-400">{selectedCol}</span>
            </p>
            <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700 overflow-hidden">
              {preview.map((text, i) => (
                <div key={i} className="px-4 py-3 text-sm text-slate-300 truncate">
                  <span className="text-slate-500 mr-2">{i + 1}.</span>
                  {text || <span className="text-slate-600 italic">empty</span>}
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Analyzing...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("pick"); setWarning(null); }}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition"
              >
                Analyze {Math.min(rows.length, MAX_ROWS).toLocaleString()} Reviews
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Client } from "@gradio/client";

const SPACE_ID = "Mohammad-Umer7/sentiment-api";

export interface SentimentResult {
  label: "POSITIVE" | "NEGATIVE";
  score: number;
}

function normalizeLabel(raw: string): "POSITIVE" | "NEGATIVE" {
  const upper = raw.toUpperCase();
  if (upper === "POSITIVE" || upper === "LABEL_1") return "POSITIVE";
  return "NEGATIVE";
}

export async function analyzeSingle(text: string): Promise<SentimentResult> {
  const client = await Client.connect(SPACE_ID);
  const result = await client.predict("/predict", { text });
  const data = JSON.parse(result.data as string);
  return { label: normalizeLabel(data.label), score: data.score };
}

export async function analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
  const client = await Client.connect(SPACE_ID);
  const result = await client.predict("/predict_batch", {
    texts_json: JSON.stringify(texts),
  });
  const data = JSON.parse(result.data as string) as { label: string; score: number }[];
  return data.map((d) => ({ label: normalizeLabel(d.label), score: d.score }));
}

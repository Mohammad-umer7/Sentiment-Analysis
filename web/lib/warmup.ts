const KEY = "sentiment_warmed_at";
const SLEEP_MS = 15 * 60 * 1000; // HF free spaces sleep after ~15 mins

export function needsWarmup(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return true;
    const warmedAt = parseInt(raw, 10);
    return Date.now() - warmedAt > SLEEP_MS;
  } catch {
    return true;
  }
}

export function markWarmedUp(): void {
  try {
    localStorage.setItem(KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

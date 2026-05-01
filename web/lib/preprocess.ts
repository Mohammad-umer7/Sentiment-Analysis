// Normalizes negation phrases that confuse the model
// e.g. "not that bad" → "actually decent and enjoyable"

const NEGATION_MAP: [RegExp, string][] = [
  [/\bnot\s+that\s+bad\b/gi, "actually decent and enjoyable"],
  [/\bnot\s+too\s+bad\b/gi, "actually decent and enjoyable"],
  [/\bnot\s+bad\s+at\s+all\b/gi, "actually quite good"],
  [/\bnot\s+bad\b/gi, "actually decent"],
  [/\bnot\s+that\s+terrible\b/gi, "actually fine and watchable"],
  [/\bnot\s+terrible\b/gi, "actually acceptable"],
  [/\bnot\s+that\s+awful\b/gi, "actually okay"],
  [/\bnot\s+awful\b/gi, "actually okay"],
  [/\bnot\s+that\s+boring\b/gi, "actually engaging"],
  [/\bnot\s+boring\b/gi, "actually engaging"],
  [/\bnot\s+that\s+disappointing\b/gi, "actually satisfying"],
  [/\bnot\s+disappointing\b/gi, "actually satisfying"],
  [/\bcould\s+(?:have\s+)?been\s+worse\b/gi, "was actually decent"],
  [/\bworse\s+(?:films|movies)\s+out\s+there\b/gi, "many good things about it"],
  [/\bnot\s+without\s+(?:its\s+)?merit\b/gi, "has real merit"],
  [/\bnot\s+a\s+waste\s+of\s+time\b/gi, "worth watching"],
  [/\bcannot\s+complain\b/gi, "was quite good"],
  [/\bcan't\s+complain\b/gi, "was quite good"],
  [/\bnot\s+disappointed\b/gi, "was pleased"],
  [/\bdoes\s+not\s+disappoint\b/gi, "impresses"],
  [/\bdoesn't\s+disappoint\b/gi, "impresses"],
  [/\bnot\s+overrated\b/gi, "well deserved praise"],
  [/\bnot\s+as\s+bad\s+as\b/gi, "better than"],
];

export function preprocessText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of NEGATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  // Normalize repeated characters: goood → good, amazinggg → amazing
  result = result.replace(/([a-zA-Z])\1{2,}/g, "$1$1");
  return result;
}

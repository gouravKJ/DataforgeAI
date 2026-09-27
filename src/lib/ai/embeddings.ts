/**
 * Embeddings: deterministic local hashed-bag embeddings with cosine similarity.
 * Interface is provider-independent so a real embedding API (OpenAI/Voyage/Cohere)
 * can be dropped in by implementing embedTexts().
 *
 * Design notes:
 * - Hashed feature bags are stable across restarts (no model download needed).
 * - Works offline; adequate for demo-scale semantic search over a few thousand records.
 * - For production scale, swap in a hosted embedding model + pgvector.
 */

const DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.+-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string): number {
  let h = 5381;
  for (let i = 0; i < token.length; i++) {
    h = (h * 33) ^ token.charCodeAt(i);
  }
  return Math.abs(h);
}

export function embedText(text: string): number[] {
  const vec = new Array<number>(DIM).fill(0);
  const tokens = tokenize(text);
  for (const tok of tokens) {
    vec[hashToken(tok) % DIM] += 1;
    // bigram-ish signal
    vec[hashToken(tok.slice(0, 4)) % DIM] += 0.5;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i]! * b[i]!;
  return dot;
}

export function embedRecord(data: Record<string, unknown>): number[] {
  const parts = [
    data.name,
    data.industry,
    data.location,
    data.description,
    data.jobTitle,
    data.fundingStage,
    Array.isArray(data.skills) ? data.skills.join(" ") : "",
  ];
  return embedText(parts.filter(Boolean).map(String).join(" "));
}

export function embedQueryLocal(query: string): number[] {
  return embedText(query);
}

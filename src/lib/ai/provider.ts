/**
 * Provider-independent AI abstraction.
 * Primary provider: Groq (OpenAI-compatible chat completions).
 * Fallback: deterministic local engine so the product works without keys/network.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiGenerateOptions = {
  system?: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
};

export type AiProvider = {
  name: string;
  generate(opts: AiGenerateOptions): Promise<string>;
};

const PREFERRED_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
].filter(Boolean) as string[];

/** Groq via OpenAI-compatible endpoint, with model fallbacks. */
class GroqProvider implements AiProvider {
  name = "groq";
  private key = process.env.GROQ_API_KEY || "";
  private models = PREFERRED_MODELS;

  async generate(opts: AiGenerateOptions): Promise<string> {
    if (!this.key) throw new Error("GROQ_API_KEY not set");
    let lastError: Error | null = null;
    for (const model of this.models) {
      try {
        return await this.callModel(model, opts);
      } catch (err: any) {
        lastError = err;
        // non-model errors (network, auth) should not trigger model fallback
        if (!/model_not_found|does not exist|decommissioned/i.test(err?.message ?? "")) throw err;
      }
    }
    throw lastError ?? new Error("All Groq models failed");
  }

  private async callModel(model: string, opts: AiGenerateOptions): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({
        model,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 2048,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
          { role: "user" as const, content: opts.prompt },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq API ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("Empty Groq response");
    return content;
  }
}

/** Deterministic local fallback (no network, no fabrication of source data). */
class LocalProvider implements AiProvider {
  name = "local-fallback";

  async generate(opts: AiGenerateOptions): Promise<string> {
    throw new Error("LOCAL_FALLBACK_UNAVAILABLE");
  }
}

export const groqProvider = new GroqProvider();
export const localProvider = new LocalProvider();

export function getProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  if (process.env.GROQ_API_KEY) providers.push(groqProvider);
  providers.push(localProvider);
  return providers;
}

/** Try each provider in order; the local fallback throws a typed error handled by callers. */
export async function aiGenerate(opts: AiGenerateOptions): Promise<{ text: string; provider: string } | null> {
  for (const provider of getProviders()) {
    try {
      const text = await provider.generate(opts);
      return { text, provider: provider.name };
    } catch (err: any) {
      if (err?.message === "LOCAL_FALLBACK_UNAVAILABLE") return null;
      console.warn(`[ai] provider ${provider.name} failed:`, err?.message?.slice(0, 200));
    }
  }
  return null;
}

/** Robust JSON extraction from an LLM response (handles code fences etc). */
export function parseJsonLoose<T>(text: string): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // find first { ... } balanced block
    const start = candidate.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < candidate.length; i++) {
      if (candidate[i] === "{") depth++;
      else if (candidate[i] === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(candidate.slice(start, i + 1)) as T;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

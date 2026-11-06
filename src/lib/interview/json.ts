import "server-only";
import type { z } from "zod";
import { generateText } from "@/lib/ai/gateway";

/**
 * Pulls the first JSON object out of a model's reply. Models sometimes wrap it in a code fence, add a
 * sentence before or after it, or close it with trailing commas: none of that should fail an interview.
 */
export function extractJson(text: string): unknown {
  const raw = String(text ?? "").trim();
  const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    /* fall through to the first balanced object */
  }
  const start = unfenced.indexOf("{");
  if (start === -1) throw new Error("No JSON object in the reply");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = unfenced.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
        }
      }
    }
  }
  throw new Error("Unterminated JSON object in the reply");
}

export type JsonResult<T> = { ok: true; value: T; provider: string } | { ok: false; provider: string; error: string };

/**
 * One AI call that must come back as JSON of a known shape. A reply that can't be read is retried once
 * (AI providers occasionally return truncated or chatty output); after that the caller gets `ok: false` and
 * uses its own fallback, so a person never sees "unexpected response".
 */
export async function generateJson<S extends z.ZodTypeAny>(
  input: { system: string; prompt: string; maxTokens: number },
  schema: S,
  attempts = 2
): Promise<JsonResult<z.output<S>>> {
  let provider = "unknown";
  let lastError = "no attempt";
  for (let i = 0; i < attempts; i++) {
    try {
      // Interview AI reasons about a real person's resume: Anthropic when its key is set, else the usual chain.
      const res = await generateText({
        prefer: "anthropic",
        ...input,
        system: i === 0 ? input.system : `${input.system}\nYour previous reply could not be read. Reply with the JSON object only.`,
      });
      provider = res.provider;
      if (provider === "mock") return { ok: false, provider, error: "mock provider" };
      const parsed = schema.safeParse(extractJson(res.text));
      if (parsed.success) return { ok: true, value: parsed.data as z.output<S>, provider };
      lastError = parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ");
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return { ok: false, provider, error: lastError };
}

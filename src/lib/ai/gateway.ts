import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Career OS AI gateway — the one place every AI feature (resume rewriting,
 * ATS explanations, Job GPT, Interview AI, ...) calls through. Swapping
 * providers or models means editing this file, not every call site.
 *
 * Falls back to a deterministic, clearly-labeled mock provider when no
 * AI provider is configured, so the rest of the product is fully
 * exercisable in development without credentials. When a real provider is
 * configured, a failed call automatically retries once against the
 * configured fallback provider before surfacing an error.
 */

export interface GenerateTextInput {
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateChatInput {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

export type AiProviderName = "anthropic" | "openrouter" | "agentrouter" | "openai" | "mock";

export interface GenerateTextResult {
  text: string;
  provider: AiProviderName;
}

interface AiProvider {
  name: AiProviderName;
  generateText(input: GenerateTextInput): Promise<string>;
  generateChat(input: GenerateChatInput): Promise<string>;
}

/**
 * Dev-only fallback. It does not call any network — it reflects the prompt
 * back with an obvious placeholder marker so nobody mistakes it for real
 * model output, per the project rule against faking AI functionality.
 */
class MockAiProvider implements AiProvider {
  name: AiProviderName = "mock";

  async generateText({ prompt }: GenerateTextInput): Promise<string> {
    const excerpt = prompt.trim().replace(/\s+/g, " ").slice(0, 140);
    return (
      `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY, OPENROUTER_API_KEY, ` +
      `AGENTROUTER_API_KEY, or OPENAI_API_KEY to get real output.]\n\n` +
      `Placeholder response for: "${excerpt}${prompt.length > 140 ? "…" : ""}"`
    );
  }

  async generateChat({ messages }: GenerateChatInput): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const excerpt = (lastUser?.content ?? "").trim().replace(/\s+/g, " ").slice(0, 140);
    return (
      `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY, OPENROUTER_API_KEY, ` +
      `AGENTROUTER_API_KEY, or OPENAI_API_KEY to get real output.]\n\n` +
      `Placeholder reply to: "${excerpt}"`
    );
  }
}

class AnthropicAiProvider implements AiProvider {
  name: AiProviderName = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateText({ system, prompt, maxTokens = 1024, effort = "low" }: GenerateTextInput): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      output_config: { effort },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) throw new Error("The AI provider returned no usable text.");
    return textBlock.text.trim();
  }

  async generateChat({ system, messages, maxTokens = 1024, effort = "low" }: GenerateChatInput): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      output_config: { effort },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) throw new Error("The AI provider returned no usable text.");
    return textBlock.text.trim();
  }
}

/**
 * Any OpenAI Chat Completions-compatible endpoint — OpenRouter, AgentRouter,
 * and OpenAI itself all speak this exact wire format, so one implementation
 * covers all three by varying the base URL, API key, and model string.
 */
class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    public name: Extract<AiProviderName, "openrouter" | "agentrouter" | "openai">,
    private apiKey: string,
    private baseUrl: string,
    private model: string
  ) {}

  private async complete(messages: { role: "system" | "user" | "assistant"; content: string }[], maxTokens: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`${this.name} request failed (${response.status} ${response.statusText}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${this.name} returned no usable text.`);
    return content.trim();
  }

  async generateText({ system, prompt, maxTokens = 1024 }: GenerateTextInput): Promise<string> {
    return this.complete(
      [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      maxTokens
    );
  }

  async generateChat({ system, messages, maxTokens = 1024 }: GenerateChatInput): Promise<string> {
    return this.complete(
      [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      maxTokens
    );
  }
}

const PROVIDER_BASE_URL: Record<"openrouter" | "agentrouter" | "openai", string> = {
  openrouter: "https://openrouter.ai/api/v1",
  agentrouter: "https://agentrouter.org/v1",
  openai: "https://api.openai.com/v1",
};

function buildProvider(name: AiProviderName): AiProvider | null {
  switch (name) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return apiKey ? new AnthropicAiProvider(apiKey, process.env.AI_MODEL || "claude-opus-5") : null;
    }
    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY;
      return apiKey ? new OpenAiCompatibleProvider("openrouter", apiKey, PROVIDER_BASE_URL.openrouter, process.env.AI_MODEL || "openai/gpt-5") : null;
    }
    case "agentrouter": {
      const apiKey = process.env.AGENTROUTER_API_KEY;
      return apiKey ? new OpenAiCompatibleProvider("agentrouter", apiKey, PROVIDER_BASE_URL.agentrouter, process.env.AI_MODEL || "gpt-5") : null;
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      return apiKey
        ? new OpenAiCompatibleProvider("openai", apiKey, PROVIDER_BASE_URL.openai, process.env.AI_FALLBACK_MODEL || "gpt-5")
        : null;
    }
    default:
      return null;
  }
}

let cachedPrimary: AiProvider | null | undefined;
let cachedFallback: AiProvider | null | undefined;

function getPrimaryProvider(): AiProvider {
  if (cachedPrimary !== undefined) return cachedPrimary ?? new MockAiProvider();

  const requested = process.env.AI_PROVIDER as AiProviderName | undefined;
  const resolutionOrder: AiProviderName[] = requested
    ? [requested]
    : ["anthropic", "openrouter", "agentrouter", "openai"];

  cachedPrimary = null;
  for (const name of resolutionOrder) {
    const provider = buildProvider(name);
    if (provider) {
      cachedPrimary = provider;
      break;
    }
  }
  return cachedPrimary ?? new MockAiProvider();
}

/**
 * OpenAI (direct) is the standing fallback for every OpenAI-compatible or
 * Anthropic primary — it's only skipped when OPENAI_API_KEY is unset or it
 * IS the primary provider already.
 */
function getFallbackProvider(primary: AiProvider): AiProvider | null {
  if (cachedFallback !== undefined) return cachedFallback && cachedFallback.name !== primary.name ? cachedFallback : null;

  cachedFallback = buildProvider("openai");
  return cachedFallback && cachedFallback.name !== primary.name ? cachedFallback : null;
}

async function withFallback<T>(run: (provider: AiProvider) => Promise<T>): Promise<{ result: T; provider: AiProviderName }> {
  const primary = getPrimaryProvider();
  try {
    return { result: await run(primary), provider: primary.name };
  } catch (primaryError) {
    if (primary.name === "mock") throw primaryError;

    const fallback = getFallbackProvider(primary);
    if (!fallback) throw primaryError;

    console.error(`AI provider "${primary.name}" failed, retrying against fallback "${fallback.name}":`, primaryError);
    try {
      return { result: await run(fallback), provider: fallback.name };
    } catch (fallbackError) {
      console.error(`AI fallback provider "${fallback.name}" also failed:`, fallbackError);
      throw fallbackError;
    }
  }
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  const { result: text, provider } = await withFallback((p) => p.generateText(input));
  return { text, provider };
}

export async function generateChat(input: GenerateChatInput): Promise<GenerateTextResult> {
  const { result: text, provider } = await withFallback((p) => p.generateChat(input));
  return { text, provider };
}

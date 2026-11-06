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
  /** Use this provider first when its key is set, whatever AI_PROVIDER says (e.g. Interview AI prefers
      Anthropic for its reasoning about a person's resume). The usual chain still applies if it fails. */
  prefer?: AiProviderName;
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
  /** Same as generateChat, but calls onDelta with each chunk of text as it
      arrives — lets a caller (Job GPT) show the reply appearing as it's
      generated instead of one long wait for the full response. */
  generateChatStream(input: GenerateChatInput, onDelta: (chunk: string) => void): Promise<string>;
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

  async generateChatStream(input: GenerateChatInput, onDelta: (chunk: string) => void): Promise<string> {
    const text = await this.generateChat(input);
    onDelta(text);
    return text;
  }
}

/** No outbound AI call may hang forever — a stalled provider must become a
    catchable error so withFallback can retry against the fallback instead
    of leaving the user's request pending indefinitely. */
const PROVIDER_TIMEOUT_MS = 45_000;

class AnthropicAiProvider implements AiProvider {
  name: AiProviderName = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey, timeout: PROVIDER_TIMEOUT_MS });
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

  async generateChatStream(
    { system, messages, maxTokens = 1024, effort = "low" }: GenerateChatInput,
    onDelta: (chunk: string) => void
  ): Promise<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      system,
      output_config: { effort },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    stream.on("text", (text) => onDelta(text));
    const finalMessage = await stream.finalMessage();
    const textBlock = finalMessage.content.find((block): block is Anthropic.TextBlock => block.type === "text");
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

  /**
   * OpenAI's reasoning/GPT-5-family models reject `max_tokens` with a 400
   * ("Unsupported parameter") and require `max_completion_tokens` instead
   * — and this is a constraint of the underlying MODEL, not the transport,
   * so it applies whether that model is reached directly or proxied
   * through an aggregator that passes requests through close to verbatim
   * (which is why this was surfacing as a failure via OpenRouter too, not
   * only the direct OpenAI provider).
   *
   * These same reasoning models spend part of that token budget on hidden
   * "thinking" tokens before ever producing visible output — with a small
   * budget (the app's callers typically ask for ~1024) it's easy for
   * reasoning alone to consume the whole thing, leaving a 200 OK response
   * with an entirely empty message.content. Two mitigations, both scoped
   * to reasoning models only: force a much larger token ceiling so there's
   * real headroom left after reasoning, and set reasoning_effort to "low"
   * (the documented lever for these models) so less of the budget goes to
   * reasoning in the first place.
   */
  private buildBody(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    maxTokens: number,
    stream: boolean
  ): Record<string, unknown> {
    const isReasoningModel = usesMaxCompletionTokens(this.model);
    const tokenParam = isReasoningModel ? "max_completion_tokens" : "max_tokens";
    const effectiveMaxTokens = isReasoningModel ? Math.max(maxTokens, REASONING_MODEL_MIN_TOKENS) : maxTokens;

    const body: Record<string, unknown> = { model: this.model, messages, [tokenParam]: effectiveMaxTokens, stream };
    if (isReasoningModel) body.reasoning_effort = "low";
    return body;
  }

  private async complete(messages: { role: "system" | "user" | "assistant"; content: string }[], maxTokens: number): Promise<string> {
    const body = this.buildBody(messages, maxTokens, false);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(`${this.name} request timed out after ${PROVIDER_TIMEOUT_MS / 1000}s`);
      }
      throw error;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`${this.name} request failed (${response.status} ${response.statusText}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      error?: unknown;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      // Surface whatever the provider actually told us — a generic "no
      // usable text" message hides the real cause (an embedded API error,
      // a length-truncated response, a moderation refusal, ...).
      const finishReason = data.choices?.[0]?.finish_reason;
      const detail = data.error
        ? JSON.stringify(data.error).slice(0, 300)
        : finishReason
          ? `finish_reason=${finishReason}`
          : JSON.stringify(data).slice(0, 300);
      throw new Error(`${this.name} returned no usable text (${detail}).`);
    }
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

  private async completeStream(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    maxTokens: number,
    onDelta: (chunk: string) => void
  ): Promise<string> {
    const body = this.buildBody(messages, maxTokens, true);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(`${this.name} request timed out after ${PROVIDER_TIMEOUT_MS / 1000}s`);
      }
      throw error;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`${this.name} request failed (${response.status} ${response.statusText}): ${errorBody.slice(0, 300)}`);
    }
    if (!response.body) throw new Error(`${this.name} returned no response stream.`);

    // Server-Sent Events framing: lines starting "data: ", a blank line
    // between events, and a final "data: [DONE]" — every OpenAI-compatible
    // streaming endpoint (OpenRouter, AgentRouter, OpenAI itself) uses this
    // exact wire format, so no per-provider parsing is needed here either.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          // A keep-alive or partial line that isn't valid JSON — ignore it,
          // the rest of the stream is unaffected.
        }
      }
    }

    if (!full) throw new Error(`${this.name} returned no usable text.`);
    return full;
  }

  async generateChatStream(
    { system, messages, maxTokens = 1024 }: GenerateChatInput,
    onDelta: (chunk: string) => void
  ): Promise<string> {
    return this.completeStream(
      [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      maxTokens,
      onDelta
    );
  }
}

/** OpenAI's o-series reasoning models and the GPT-5 family all require
    `max_completion_tokens` instead of `max_tokens` — matched on the model
    name itself (stripping any router-style "openai/" prefix) since the
    constraint follows the model regardless of which provider serves it. */
function usesMaxCompletionTokens(model: string): boolean {
  return /^(o1|o3|o4|gpt-5)/i.test(model.replace(/^openai\//i, ""));
}

/** Floor for reasoning-model token budgets — see the comment in `complete`.
    High enough to leave real room for visible output after low-effort
    reasoning, without being an unreasonable cost ceiling. */
const REASONING_MODEL_MIN_TOKENS = 4000;

const PROVIDER_BASE_URL: Record<"openrouter" | "agentrouter" | "openai", string> = {
  openrouter: "https://openrouter.ai/api/v1",
  agentrouter: "https://agentrouter.org/v1",
  openai: "https://api.openai.com/v1",
};

/**
 * ANTHROPIC_MODEL wins; AI_MODEL is only used when it names a Claude model,
 * because on servers that also have OpenRouter/OpenAI keys AI_MODEL is often
 * set for those providers (e.g. "openai/gpt-5"), which Anthropic would reject.
 */
export function anthropicModel(env: Record<string, string | undefined> = process.env) {
  if (env.ANTHROPIC_MODEL) return env.ANTHROPIC_MODEL;
  if (env.AI_MODEL && /^claude-/.test(env.AI_MODEL)) return env.AI_MODEL;
  return "claude-opus-5-5";
}

function buildProvider(name: AiProviderName): AiProvider | null {
  switch (name) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return apiKey ? new AnthropicAiProvider(apiKey, anthropicModel()) : null;
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

export class AiNotConfiguredError extends Error {
  code = "AI_NOT_CONFIGURED";
  constructor() {
    super("AI isn't configured on this server yet, so this answer couldn't be generated.");
  }
}

/**
 * The placeholder provider is for development only. In production a missing key must fail loudly:
 * otherwise "[DEV MODE …]" text ends up in cover letters and answers sent to real employers.
 */
function mockOrFail(): AiProvider {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_AI !== "true") throw new AiNotConfiguredError();
  return new MockAiProvider();
}

function getPrimaryProvider(): AiProvider {
  if (cachedPrimary !== undefined) return cachedPrimary ?? mockOrFail();

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
  return cachedPrimary ?? mockOrFail();
}

const providerCache = new Map<AiProviderName, AiProvider | null>();
function cachedProvider(name: AiProviderName): AiProvider | null {
  if (!providerCache.has(name)) providerCache.set(name, buildProvider(name));
  return providerCache.get(name) ?? null;
}

/**
 * The providers to try, in order: the preferred one (when asked for and configured), the configured
 * primary, then Anthropic and OpenAI as standing fallbacks — each only when its key is set, and never twice.
 */
function providerChain(prefer?: AiProviderName): AiProvider[] {
  const chain: AiProvider[] = [];
  const add = (p: AiProvider | null) => {
    if (p && !chain.some((c) => c.name === p.name)) chain.push(p);
  };
  if (prefer && prefer !== "mock") add(cachedProvider(prefer));
  add(getPrimaryProvider());
  if (chain[0]?.name === "mock") return chain.slice(0, 1);
  add(cachedProvider("anthropic"));
  add(cachedProvider("openai"));
  return chain;
}

async function withFallback<T>(run: (provider: AiProvider) => Promise<T>, prefer?: AiProviderName): Promise<{ result: T; provider: AiProviderName }> {
  const chain = providerChain(prefer);
  let lastError: unknown;
  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    try {
      return { result: await run(provider), provider: provider.name };
    } catch (error) {
      lastError = error;
      if (provider.name === "mock") throw error;
      const next = chain[i + 1];
      console.error(`AI provider "${provider.name}" failed${next ? `, retrying against "${next.name}"` : ""}:`, error);
    }
  }
  throw lastError;
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  const { result: text, provider } = await withFallback((p) => p.generateText(input), input.prefer);
  return { text, provider };
}

export async function generateChat(input: GenerateChatInput): Promise<GenerateTextResult> {
  const { result: text, provider } = await withFallback((p) => p.generateChat(input));
  return { text, provider };
}

/**
 * Streaming counterpart to generateChat — onDelta fires as text arrives.
 * Provider fallback still applies, but only up to the point a provider
 * starts actually streaming content: OpenRouter/AgentRouter fail with an
 * error status before any SSE data reaches this code (their failures here
 * are account-level, not mid-stream), so falling back never re-sends
 * partial output the caller already forwarded to onDelta.
 */
export async function generateChatStream(input: GenerateChatInput, onDelta: (chunk: string) => void): Promise<GenerateTextResult> {
  const { result: text, provider } = await withFallback((p) => p.generateChatStream(input, onDelta));
  return { text, provider };
}

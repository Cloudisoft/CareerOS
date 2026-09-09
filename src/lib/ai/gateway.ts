import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Career OS AI gateway — the one place every AI feature (resume rewriting,
 * ATS explanations, Job GPT, Interview AI, ...) calls through. Swapping
 * providers or models means editing this file, not every call site.
 *
 * Falls back to a deterministic, clearly-labeled mock provider when no
 * ANTHROPIC_API_KEY is configured, so the rest of the product is fully
 * exercisable in development without credentials.
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

export type AiProviderName = "anthropic" | "mock";

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
      `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY to get real output.]\n\n` +
      `Placeholder response for: "${excerpt}${prompt.length > 140 ? "…" : ""}"`
    );
  }

  async generateChat({ messages }: GenerateChatInput): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const excerpt = (lastUser?.content ?? "").trim().replace(/\s+/g, " ").slice(0, 140);
    return (
      `[DEV MODE — no AI provider configured. Set ANTHROPIC_API_KEY to get real output.]\n\n` +
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

let cachedProvider: AiProvider | null = null;

function getProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const requested = process.env.AI_PROVIDER ?? (apiKey ? "anthropic" : "mock");

  if (requested === "anthropic" && apiKey) {
    cachedProvider = new AnthropicAiProvider(apiKey, process.env.AI_MODEL || "claude-opus-5");
  } else {
    cachedProvider = new MockAiProvider();
  }
  return cachedProvider;
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  const provider = getProvider();
  const text = await provider.generateText(input);
  return { text, provider: provider.name };
}

export async function generateChat(input: GenerateChatInput): Promise<GenerateTextResult> {
  const provider = getProvider();
  const text = await provider.generateChat(input);
  return { text, provider: provider.name };
}

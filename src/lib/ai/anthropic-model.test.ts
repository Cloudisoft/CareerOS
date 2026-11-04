import { describe, expect, it } from "vitest";
import { anthropicModel } from "./gateway";

describe("anthropicModel", () => {
  it("prefers ANTHROPIC_MODEL", () => {
    expect(anthropicModel({ ANTHROPIC_MODEL: "claude-sonnet-5-5", AI_MODEL: "claude-opus-5-5" })).toBe("claude-sonnet-5-5");
  });
  it("uses AI_MODEL only when it is a Claude model", () => {
    expect(anthropicModel({ AI_MODEL: "claude-haiku-5-5" })).toBe("claude-haiku-5-5");
    expect(anthropicModel({ AI_MODEL: "openai/gpt-5" })).toBe("claude-opus-5-5");
    expect(anthropicModel({ AI_MODEL: "gpt-5" })).toBe("claude-opus-5-5");
  });
  it("defaults to the current Claude model", () => {
    expect(anthropicModel({})).toBe("claude-opus-5-5");
  });
});

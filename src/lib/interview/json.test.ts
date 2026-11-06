import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const replies = vi.hoisted(() => ({ list: [] as (string | Error)[], calls: 0, prefer: [] as unknown[] }));
vi.mock("@/lib/ai/gateway", () => ({
  generateText: async (input: { prefer?: string }) => {
    replies.calls++;
    replies.prefer.push(input.prefer);
    const next = replies.list.shift();
    if (next instanceof Error) throw next;
    return { text: next ?? "", provider: "anthropic" };
  },
}));
import { extractJson, generateJson } from "./json";

describe("reading the AI's JSON", () => {
  it("accepts fences, chatter around the object and trailing commas", () => {
    expect(extractJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here it is: {"q": "Why {this}?", "n": 2} Hope that helps.')).toEqual({ q: "Why {this}?", n: 2 });
    expect(extractJson('{"list": [1, 2,], "x": "y",}')).toEqual({ list: [1, 2], x: "y" });
    expect(() => extractJson("no json here")).toThrow();
  });

  it("retries once on an unreadable reply, then reports failure instead of throwing", async () => {
    const schema = z.object({ question: z.string().min(3) });
    replies.list = ["I think a good question is...", '{"question": "Tell me about Northwind"}'];
    replies.calls = 0;
    await expect(generateJson({ system: "s", prompt: "p", maxTokens: 10 }, schema)).resolves.toMatchObject({ ok: true, value: { question: "Tell me about Northwind" } });
    expect(replies.calls).toBe(2);

    replies.list = [new Error("overloaded"), "still not json"];
    await expect(generateJson({ system: "s", prompt: "p", maxTokens: 10 }, schema)).resolves.toMatchObject({ ok: false });
  });

  it("asks for Anthropic first", async () => {
    replies.list = ['{"question": "abc"}'];
    replies.prefer = [];
    await generateJson({ system: "s", prompt: "p", maxTokens: 10 }, z.object({ question: z.string() }));
    expect(replies.prefer).toEqual(["anthropic"]);
  });
});

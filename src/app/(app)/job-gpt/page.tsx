"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Plus, Send, Loader2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradeRequired } from "@/components/billing/upgrade-required";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

const SUGGESTIONS = [
  "Why am I not getting interviews?",
  "Which of my applications are most promising?",
  "What skill gaps should I close first?",
  "Help me plan my next 90 days.",
];

export default function JobGptPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((json) => setEntitled(Boolean(json.data?.entitlements?.jobGpt)));
  }, []);

  useEffect(() => {
    if (entitled !== true) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadConversations(selectId?: string) {
    setLoadingConvos(true);
    const res = await fetch("/api/job-gpt/conversations");
    const json = await res.json();
    const list: Conversation[] = json.data?.conversations ?? [];
    setConversations(list);
    setLoadingConvos(false);
    const target = selectId ?? list[0]?.id ?? null;
    if (target) selectConversation(target);
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    const res = await fetch(`/api/job-gpt/conversations/${id}`);
    const json = await res.json();
    setMessages(json.data?.conversation?.messages ?? []);
  }

  async function newConversation() {
    const res = await fetch("/api/job-gpt/conversations", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      await loadConversations(json.data.conversation.id);
      setMessages([]);
    }
  }

  async function removeConversation(id: string) {
    await fetch(`/api/job-gpt/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    loadConversations();
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;

    let conversationId = activeId;
    if (!conversationId) {
      const res = await fetch("/api/job-gpt/conversations", { method: "POST" });
      const json = await res.json();
      conversationId = json.data.conversation.id;
      setActiveId(conversationId);
      setConversations((prev) => [json.data.conversation, ...prev]);
    }

    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: "USER", content }]);
    setInput("");
    setSending(true);

    const res = await fetch(`/api/job-gpt/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });
    const json = await res.json();
    setSending(false);

    if (res.ok) {
      setMessages((prev) => [...prev, json.data.message]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "ASSISTANT", content: json.error?.message ?? "Something went wrong." },
      ]);
    }
  }

  if (entitled === null) return null;
  if (entitled === false) return <UpgradeRequired feature="Job GPT" />;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="hidden w-56 shrink-0 flex-col sm:flex">
        <Button variant="secondary" size="sm" onClick={newConversation} className="mb-3">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {loadingConvos ? (
            <Loader2 className="mx-auto mt-4 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2 py-2 text-sm",
                  activeId === c.id ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:bg-surface-raised"
                )}
              >
                <button className="flex-1 truncate text-left" onClick={() => selectConversation(c.id)}>
                  {c.title || "New chat"}
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removeConversation(c.id)}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <Bot className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium text-foreground">Ask Job GPT anything about your search</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "USER" && "justify-end")}>
              {m.role === "ASSISTANT" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <Card className={cn("max-w-lg", m.role === "USER" && "bg-surface-raised")}>
                <CardContent className="whitespace-pre-line p-3 text-sm text-foreground">{m.content}</CardContent>
              </Card>
              {m.role === "USER" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
                <Bot className="h-4 w-4" />
              </div>
              <Card>
                <CardContent className="flex items-center gap-2 p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Job GPT…"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

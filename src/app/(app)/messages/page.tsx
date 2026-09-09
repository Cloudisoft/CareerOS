"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Conversation {
  id: string;
  updatedAt: string;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  lastReadAt: string | null;
  participants: Participant[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: Participant;
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const res = await fetch("/api/messages/conversations");
    const json = await res.json();
    const list: Conversation[] = json.data?.conversations ?? [];
    setConversations(list);
    return list;
  }

  async function openThread(id: string) {
    setActiveId(id);
    setLoadingThread(true);
    const res = await fetch(`/api/messages/conversations/${id}/messages`);
    const json = await res.json();
    setMessages(json.data?.messages ?? []);
    setLoadingThread(false);
  }

  useEffect(() => {
    (async () => {
      const list = await loadConversations();
      if (withUserId) {
        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: withUserId }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error?.message ?? "You can only message people you're connected with.");
          setLoading(false);
          return;
        }
        const conv = json.data?.conversation;
        if (conv) {
          await loadConversations();
          await openThread(conv.id);
        }
      } else if (list.length > 0) {
        await openThread(list[0].id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !activeId) return;
    const content = draft;
    setDraft("");
    const res = await fetch(`/api/messages/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (json.data?.message) {
      setMessages((prev) => [...prev, json.data.message]);
      loadConversations();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Messages</h1>

      {error && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-[280px_1fr] overflow-hidden rounded-lg border border-border">
        <div className="max-h-[600px] divide-y divide-border overflow-y-auto border-r border-border">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No conversations yet. Connect with people in your network to start messaging.
            </p>
          ) : (
            conversations.map((c) => {
              const other = c.participants[0];
              if (!other) return null;
              const unread = c.lastMessage && (!c.lastReadAt || new Date(c.lastMessage.createdAt) > new Date(c.lastReadAt));
              return (
                <button
                  key={c.id}
                  onClick={() => openThread(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left hover:bg-surface-raised",
                    activeId === c.id && "bg-surface-raised"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    {other.avatarUrl && <AvatarImage src={other.avatarUrl} />}
                    <AvatarFallback>{initials(other.firstName, other.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium text-foreground", unread && "font-semibold")}>
                      {other.firstName} {other.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex max-h-[600px] flex-col">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">Select a conversation to view messages.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <Avatar className="h-8 w-8">
                  {active.participants[0]?.avatarUrl && <AvatarImage src={active.participants[0].avatarUrl} />}
                  <AvatarFallback>
                    {active.participants[0] && initials(active.participants[0].firstName, active.participants[0].lastName)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-foreground">
                  {active.participants[0]?.firstName} {active.participants[0]?.lastName}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingThread ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.senderId === active.participants[0]?.id ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                          m.senderId === active.participants[0]?.id
                            ? "bg-surface-raised text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                />
                <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}

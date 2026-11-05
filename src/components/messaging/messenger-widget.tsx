"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, ChevronLeft, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

/**
 * A LinkedIn/Facebook-style floating messenger — a docked panel in the
 * bottom-right corner that's available wherever you're browsing, including
 * the network feed, instead of messaging being a separate full-page
 * destination you have to navigate away to. Reuses the exact same
 * conversations/messages API the full /messages page already calls.
 */
export function MessengerWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const unreadCount = conversations.filter(
    (c) => c.lastMessage && (!c.lastReadAt || new Date(c.lastMessage.createdAt) > new Date(c.lastReadAt))
  ).length;

  async function loadConversations() {
    const res = await fetch("/api/messages/conversations");
    const json = await res.json();
    setConversations(json.data?.conversations ?? []);
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function openThread(id: string) {
    setActiveId(id);
    setLoadingThread(true);
    const res = await fetch(`/api/messages/conversations/${id}/messages`);
    const json = await res.json();
    setMessages(json.data?.messages ?? []);
    setLoadingThread(false);
  }

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

  // The full-page /messages inbox already covers this — don't duplicate it.
  if (pathname?.startsWith("/messages")) return null;

  const active = conversations.find((c) => c.id === activeId);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open messaging"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Messaging</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[420px] w-80 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {active && (
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <p className="text-sm font-semibold text-foreground">
            {active ? `${active.participants[0]?.firstName} ${active.participants[0]?.lastName}` : "Messaging"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Close messaging"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!active ? (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
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
                  className="flex w-full items-center gap-2.5 border-b border-border p-3 text-left hover:bg-surface-raised"
                >
                  <Avatar className="h-8 w-8">
                    {other.avatarUrl && <AvatarImage src={other.avatarUrl} />}
                    <AvatarFallback className="text-xs">{initials(other.firstName, other.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-xs text-foreground", unread && "font-semibold")}>
                      {other.firstName} {other.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessage?.content ?? "No messages yet"}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {loadingThread ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.senderId === active.participants[0]?.id ? "justify-start" : "justify-end")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-2.5 py-1.5 text-xs",
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
          <div className="flex items-center gap-2 border-t border-border p-2">
            <Input
              placeholder="Write a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="h-8 text-xs"
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={send} disabled={!draft.trim()} aria-label="Send">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

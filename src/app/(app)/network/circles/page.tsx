"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Users, Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CircleSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isMember: boolean;
}

export default function CirclesPage() {
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch("/api/network/circles");
    const json = await res.json();
    setCircles(json.data?.circles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleMembership(circle: CircleSummary) {
    setBusy((prev) => new Set(prev).add(circle.slug));
    setCircles((prev) =>
      prev.map((c) =>
        c.slug === circle.slug
          ? { ...c, isMember: !c.isMember, memberCount: c.memberCount + (c.isMember ? -1 : 1) }
          : c,
      ),
    );
    await fetch(`/api/network/circles/${circle.slug}/${circle.isMember ? "leave" : "join"}`, { method: "POST" });
    setBusy((prev) => {
      const next = new Set(prev);
      next.delete(circle.slug);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const byCategory = circles.reduce<Record<string, CircleSummary[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/network" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to network
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Circles</h1>
      <p className="mb-6 text-sm text-muted-foreground">Join topic communities to share and discuss with people on the same path.</p>

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</h2>
          <div className="space-y-2">
            {items.map((circle) => (
              <Card key={circle.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <Link href={`/network/circles/${circle.slug}`} className="min-w-0 flex-1">
                    <p className="font-medium text-foreground hover:underline">{circle.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{circle.description}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <Button
                    size="sm"
                    variant={circle.isMember ? "outline" : "primary"}
                    disabled={busy.has(circle.slug)}
                    onClick={() => toggleMembership(circle)}
                  >
                    {circle.isMember ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {circle.isMember ? "Joined" : "Join"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {circles.length === 0 && <p className="text-center text-sm text-muted-foreground">No circles yet.</p>}
    </div>
  );
}

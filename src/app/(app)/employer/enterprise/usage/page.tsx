"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ErrorBanner, Spinner, usd } from "@/components/enterprise/shared";

interface CreditRow {
  id: string;
  kind: string;
  delta: number;
  type: string;
  note: string | null;
  by: string | null;
  createdAt: string;
}
interface EventRow {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  plan: string | null;
  amountCents: number | null;
  detail: string | null;
  by: string | null;
  createdAt: string;
}

const KIND = { RESUME_FETCH: "Resume unlock", INMAIL: "InMail", POST_BOOST: "Post boost", CAMPAIGN_BOOST: "Campaign boost" } as Record<string, string>;
const when = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function UsagePage() {
  const [data, setData] = useState<{ credits: CreditRow[]; events: EventRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ credits: CreditRow[]; events: EventRow[] }>("/api/enterprise/usage").then((r) => (r.ok ? setData(r.data) : setError(r.error)));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Spinner />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Credit history</CardTitle></CardHeader>
        <CardContent>
          {data.credits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credit activity yet.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {data.credits.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-foreground">{KIND[c.kind]} · {c.type === "GRANT" ? "Allowance added" : c.type === "REFUND" ? "Returned" : "Used"}</p>
                    <p className="truncate text-xs text-muted-foreground">{[c.note, c.by, when(c.createdAt)].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className={`shrink-0 font-medium tabular-nums ${c.delta > 0 ? "text-success" : "text-foreground"}`}>{c.delta > 0 ? `+${c.delta}` : c.delta}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Subscription history</CardTitle></CardHeader>
        <CardContent>
          {data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription activity yet.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {data.events.map((e) => (
                <div key={e.id} className="py-2">
                  <p className="text-foreground">
                    {e.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase())}
                    {e.toStatus && e.fromStatus !== e.toStatus ? ` → ${e.toStatus.toLowerCase().replace("_", " ")}` : ""}
                    {e.amountCents != null ? ` · ${usd(e.amountCents)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{[e.plan, e.by, e.detail, when(e.createdAt)].filter(Boolean).join(" · ")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

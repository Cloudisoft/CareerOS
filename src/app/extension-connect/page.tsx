"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ConnectContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "denied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ label: string; version: string | null; createdAt: string; code: string; valid: boolean } | null>(null);

  useEffect(() => {
    if (!state) return;
    fetch(`/api/extension/connect/info?state=${encodeURIComponent(state)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "This connection request couldn't be loaded.");
        setInfo(json.data);
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, [state]);

  async function respond(action: "approve" | "deny") {
    if (!state) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/extension/connect/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus(action === "approve" ? "approved" : "denied");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (!state) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-foreground">Missing connection request</p>
          <p className="text-sm text-muted-foreground">
            Open this page from the Career OS browser extension.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "approved") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="font-medium text-foreground">Browser connected</p>
          <p className="text-sm text-muted-foreground">
            You can close this tab and return to the extension.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "denied") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <XCircle className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">Connection declined</p>
          <p className="text-sm text-muted-foreground">You can close this tab.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <p className="font-medium text-foreground">Connect this browser to Career OS?</p>
        {info && (
          <div className="w-full rounded-lg border border-border p-3 text-left text-sm">
            <p className="text-foreground">
              <span className="font-medium">{info.label}</span>
              {info.version ? <span className="text-muted-foreground"> · extension {info.version}</span> : null}
            </p>
            <p className="text-muted-foreground">Asked {new Date(info.createdAt).toLocaleTimeString()}</p>
            <p className="mt-2 text-muted-foreground">
              Code: <span className="font-mono text-base font-semibold tracking-widest text-foreground">{info.code}</span>
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Approve only if you just pressed Sign in in the Career OS extension and its notification shows the same
          code. The extension will be able to read your Career Profile, resumes, and Auto Apply settings, and record
          applications it submits on your behalf.
        </p>
        {info && !info.valid && <p className="text-sm text-destructive">This request has expired. Press Sign in in the extension again.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="mt-2 flex gap-3">
          <Button variant="secondary" onClick={() => respond("deny")} disabled={status === "loading"}>
            Decline
          </Button>
          <Button onClick={() => respond("approve")} disabled={status === "loading" || !info || !info.valid}>
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExtensionConnectPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8">
        <Logo priority />
      </div>
      <div className="w-full max-w-sm">
        <Suspense>
          <ConnectContent />
        </Suspense>
      </div>
    </div>
  );
}

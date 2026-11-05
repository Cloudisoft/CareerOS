"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-next";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { AccountTypeTabs, accountTypeFrom, type AccountType } from "@/components/auth/account-type-tabs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [accountType, setAccountType] = useState<AccountType>(() => accountTypeFrom(searchParams.get("as")));
  const next = searchParams.get("next");
  const fromSearch = searchParams.get("from") === "search";
  const searchedFor = (() => {
    try {
      return next ? new URL(next, "http://x").searchParams.get("q") : null;
    } catch {
      return null;
    }
  })();
  const [error, setError] = useState<string | null>(() => {
    const e = searchParams.get("error");
    if (e === "idle_timeout") return "You were signed out after 30 minutes of inactivity. Please log in again.";
    return e;
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push(safeNext(searchParams.get("next")));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fromSearch ? "Log in to see your results" : "Welcome back"}</CardTitle>
        <CardDescription>
          {fromSearch
            ? searchedFor
              ? `Your search for “${searchedFor}” is ready. Log in or create a free account to view it.`
              : "Log in or create a free account to view the jobs."
            : "Log in to your Career OS account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountTypeTabs value={accountType} onChange={setAccountType} />
        <GoogleButton
          type={accountType}
          next={next}
          from="login"
          label={accountType === "CANDIDATE" ? "Continue with Google as a job seeker" : "Continue with Google as an employer"}
        />
        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Career OS?{" "}
          <Link
            href={`/signup?as=${accountType}${next ? `&next=${encodeURIComponent(safeNext(next))}` : ""}`}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

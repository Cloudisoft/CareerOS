"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api, ErrorBanner, SuccessBanner } from "@/components/enterprise/shared";

interface Listing {
  id: string;
  title: string;
  description: string;
  applyUrl: string;
  published: boolean;
  createdAt: string;
}

const EMPTY = { title: "", description: "", applyUrl: "", published: true };

export default function ManageCareersPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [forbidden, setForbidden] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ listings: Listing[] }>("/api/careers/manage");
    if (res.status === 401 || res.status === 403) return setForbidden(res.error);
    if (!res.ok) return setError(res.error);
    setListings(res.data!.listings);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <Card className="mx-auto mt-8 max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {forbidden} <Link className="text-primary" href="/careers">Back to Career OS Careers</Link>
        </CardContent>
      </Card>
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = editing
      ? await api(`/api/careers/manage/${editing}`, { method: "PATCH", json: form })
      : await api("/api/careers/manage", { method: "POST", json: form });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setNotice(editing ? "Listing updated." : "Listing published.");
    setForm(EMPTY);
    setEditing(null);
    load();
  }

  async function togglePublished(l: Listing) {
    const res = await api(`/api/careers/manage/${l.id}`, { method: "PATCH", json: { published: !l.published } });
    if (!res.ok) return setError(res.error);
    load();
  }

  async function remove(l: Listing) {
    if (!confirm(`Remove "${l.title}"?`)) return;
    const res = await api(`/api/careers/manage/${l.id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-0 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Manage Career OS Careers</h1>
        <Button asChild variant="ghost" size="sm"><Link href="/careers">View board</Link></Button>
      </div>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      <Card>
        <CardHeader><CardTitle className="text-base">{editing ? "Edit listing" : "New listing"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Job title" maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea rows={8} placeholder="Job description" maxLength={20000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Job link (https://…)" type="url" value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} />
          <p className="text-xs text-muted-foreground">The job link is never shown to visitors — the Apply Now button sends them there.</p>
          <div className="flex gap-2">
            <Button disabled={saving || !form.title.trim() || !form.description.trim() || !form.applyUrl.trim()} onClick={save}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Publish"}
            </Button>
            {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      {!listings ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : listings.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No listings yet.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{l.title} {!l.published && <Badge variant="outline" className="ml-1">Hidden</Badge>}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.applyUrl}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => togglePublished(l)}>{l.published ? "Hide" : "Publish"}</Button>
                  <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => { setEditing(l.id); setForm({ title: l.title, description: l.description, applyUrl: l.applyUrl, published: l.published }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => remove(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

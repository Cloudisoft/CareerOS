"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

const EMPTY_FORM = { title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" };

export function ExperienceEditor({ initial }: { initial: ExperienceItem[] }) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: ExperienceItem) {
    setEditingId(item.id);
    setAdding(false);
    setForm({
      title: item.title,
      company: item.company,
      location: item.location ?? "",
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate?.slice(0, 10) ?? "",
      isCurrent: item.isCurrent,
      description: item.description ?? "",
    });
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      company: form.company,
      location: form.location || undefined,
      startDate: form.startDate,
      endDate: form.isCurrent ? null : form.endDate || null,
      isCurrent: form.isCurrent,
      description: form.description || undefined,
      achievements: [],
    };

    const url = editingId ? `/api/profile/experience/${editingId}` : "/api/profile/experience";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      const saved = json.data.experience as ExperienceItem;
      setItems((prev) => (editingId ? prev.map((i) => (i.id === editingId ? saved : i)) : [saved, ...prev]));
      cancel();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/profile/experience/${id}`, { method: "DELETE" });
  }

  const isEditorOpen = adding || editingId !== null;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.company}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })} —{" "}
                {item.isCurrent ? "Present" : item.endDate ? new Date(item.endDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : ""}
              </p>
              {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(item.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {isEditorOpen ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input
                  type="date"
                  disabled={form.isCurrent}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={form.isCurrent} onCheckedChange={(c) => setForm({ ...form, isCurrent: Boolean(c) })} />
              I currently work here
            </label>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.title || !form.company || !form.startDate}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="secondary" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Add experience
        </Button>
      )}
    </div>
  );
}

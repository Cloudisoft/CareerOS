"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Story {
  id: string;
  title: string;
  category: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string | null;
}

const EMPTY_FORM = { title: "", category: "achievement", situation: "", task: "", action: "", result: "", reflection: "" };

export default function StoryBankPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/interview/stories");
    const json = await res.json();
    setStories(json.data?.stories ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(story: Story) {
    setEditingId(story.id);
    setAdding(false);
    setForm({
      title: story.title,
      category: story.category,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      reflection: story.reflection ?? "",
    });
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    setSaving(true);
    const url = editingId ? `/api/interview/stories/${editingId}` : "/api/interview/stories";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      cancelForm();
      load();
    }
  }

  async function remove(id: string) {
    setStories((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/interview/stories/${id}`, { method: "DELETE" });
  }

  const showForm = adding || editingId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/interview-ai" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Interview AI
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Story bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A reusable set of STAR stories you can pull from for any behavioral question. Write your own, or save one
            from a scored interview answer.
          </p>
        </div>
        {!showForm && (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Led a rescue project under deadline" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="leadership, conflict, failure…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Situation</Label>
              <Textarea rows={2} value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Textarea rows={2} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Textarea rows={3} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Textarea rows={2} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Reflection (optional)</Label>
              <Textarea rows={2} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.title.trim() || !form.action.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button variant="ghost" onClick={cancelForm}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No stories yet. Add one, or save one from a completed interview answer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <Card key={story.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{story.title}</p>
                    <Badge variant="outline">{story.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(story)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(story.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {story.situation && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">S:</span> {story.situation}</p>}
                {story.task && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">T:</span> {story.task}</p>}
                {story.action && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">A:</span> {story.action}</p>}
                {story.result && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">R:</span> {story.result}</p>}
                {story.reflection && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Reflection:</span> {story.reflection}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Textarea } from "./ui";
import { HIERARCHY_TEMPLATES, MAX_HIERARCHY_DEPTH } from "@/app/lib/hierarchy";

const TEMPLATE_INFO: Record<string, { label: string; hint: string }> = {
  course: { label: "Course-style", hint: "Course → Module → Lesson" },
  book: { label: "Book-style", hint: "Chapter → Section" },
  freeform: { label: "Free-form", hint: "No fixed levels — add children freely" },
  custom: { label: "Custom", hint: "Define your own level names" },
};

export default function PathForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<keyof typeof TEMPLATE_INFO>("course");
  const [customLevels, setCustomLevels] = useState<string[]>(["", "", ""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError("");
    if (!name.trim()) {
      setError("Please give your path a name.");
      return;
    }
    const hierarchy =
      template === "custom" ? customLevels.filter((l) => l.trim()) : HIERARCHY_TEMPLATES[template];
    if (template === "custom" && hierarchy.length === 0) {
      setError("Add at least one level name for custom hierarchies.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, template, hierarchy }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setName("");
    setDescription("");
    setCustomLevels(["", "", ""]);
    setTemplate("course");
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a new learning path">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Python for Data Science" autoFocus />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you want to learn?" rows={2} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Structure</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TEMPLATE_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTemplate(key as keyof typeof TEMPLATE_INFO)}
                className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                  template === key
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{info.label}</p>
                <p className="text-xs text-zinc-500">{info.hint}</p>
              </button>
            ))}
          </div>
        </div>
        {template === "custom" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Level names (top to bottom, max {MAX_HIERARCHY_DEPTH})
            </label>
            <div className="space-y-2">
              {customLevels.map((level, i) => (
                <Input
                  key={i}
                  value={level}
                  onChange={(e) => {
                    const next = [...customLevels];
                    next[i] = e.target.value;
                    setCustomLevels(next);
                  }}
                  placeholder={`Level ${i + 1} name (e.g. ${
                    i === 0 ? "Part" : i === 1 ? "Chapter" : i === 2 ? "Topic" : "Section"
                  })`}
                />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create path</Button>
        </div>
      </div>
    </Modal>
  );
}
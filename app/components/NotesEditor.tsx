"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button, Textarea } from "./ui";

export default function NotesEditor({
  node,
}: {
  node: {
    id: string;
    content: string | null;
  };
}) {
  const router = useRouter();
  const [content, setContent] = useState(node.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/nodes/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your own notes: what you learned, key points, code snippets..."
        rows={16}
      />

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          <Save size={14} /> {saved ? "Saved!" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}

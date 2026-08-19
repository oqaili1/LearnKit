"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button, Input, Modal } from "./ui";
import { labelForDepth, nextLabel } from "@/app/lib/hierarchy";

export type TreeNodeData = {
  id: string;
  title: string;
  depth: number;
  parentId: string | null;
  order: number;
  hasContent: boolean;
  hasSummaries: boolean;
};

export default function NodeTree({
  pathId,
  hierarchy,
  nodes,
}: {
  pathId: string;
  hierarchy: string[];
  nodes: TreeNodeData[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addTarget, setAddTarget] = useState<{ parentId: string | null; depth: number } | null>(null);
  const [editing, setEditing] = useState<TreeNodeData | null>(null);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, TreeNodeData[]>();
    for (const n of nodes) {
      const key = n.parentId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [nodes]);

  const filteredIds = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const matched = new Set(nodes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id));
    for (const n of nodes) {
      if (matched.has(n.id)) {
        let cur = n;
        while (cur.parentId) {
          matched.add(cur.parentId);
          cur = nodes.find((x) => x.id === cur.parentId)!;
        }
      }
    }
    return matched;
  }, [query, nodes]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteNode(id: string) {
    if (!confirm("Delete this item and everything under it?")) return;
    await fetch(`/api/nodes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(id: string, direction: "up" | "down") {
    await fetch(`/api/nodes/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    router.refresh();
  }

  function renderNode(node: TreeNodeData) {
    const childCount = childrenOf.get(node.id)?.length ?? 0;
    const hasChildren = childCount > 0;
    const isExpanded = expanded.has(node.id);
    const label = labelForDepth(hierarchy, node.depth);
    const childLabel = nextLabel(hierarchy, node.depth);
    const filtered = filteredIds !== null && !filteredIds.has(node.id);
    const canAddChild = childLabel !== null;

    return (
      <div key={node.id} className={filtered ? "hidden" : ""}>
        <div
          className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggle(node.id)}
              className="cursor-pointer rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          ) : (
            <span className="p-0.5 text-zinc-300 dark:text-zinc-600">
              <FileText size={15} />
            </span>
          )}
          <Link
            href={`/paths/${pathId}/nodes/${node.id}`}
            className="flex-1 truncate text-sm text-zinc-800 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400"
          >
            {node.title}
          </Link>
          {childCount > 0 && (
            <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
              {childCount} {childCount === 1 ? "item" : "items"}
            </span>
          )}
          <span className="hidden shrink-0 text-[10px] uppercase tracking-wide text-zinc-400 group-hover:inline">{label}</span>
          {node.hasSummaries && (
            <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 group-hover:inline" title="Has AI summary" />
          )}
          {node.hasContent && (
            <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 group-hover:inline" title="Has notes" />
          )}
          <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
            {canAddChild && (
              <button
                onClick={() => setAddTarget({ parentId: node.id, depth: node.depth })}
                title={`Add ${childLabel}`}
                className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-700"
              >
                <Plus size={13} />
              </button>
            )}
            <button
              onClick={() => move(node.id, "up")}
              title="Move up"
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-700"
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={() => move(node.id, "down")}
              title="Move down"
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-700"
            >
              <ChevronDown size={13} />
            </button>
            <button
              onClick={() => setEditing(node)}
              title="Edit"
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-700"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => deleteNode(node.id)}
              title="Delete"
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white hover:text-red-500 dark:hover:bg-zinc-700"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && childrenOf.get(node.id)!.map(renderNode)}
      </div>
    );
  }

  const firstLevelLabel = hierarchy.length > 0 ? hierarchy[0] : "Item";

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this path..." className="pl-8" />
        </div>
        <Button onClick={() => setAddTarget({ parentId: null, depth: -1 })}>
          <Plus size={14} /> Add {firstLevelLabel}
        </Button>
      </div>

      <div className="space-y-0.5">
        {childrenOf.get(null)?.map(renderNode) ?? (
          <p className="py-8 text-center text-sm text-zinc-400">
            Nothing here yet. Add your first {firstLevelLabel.toLowerCase()} to get started.
          </p>
        )}
      </div>

      <AddNodeModal
        pathId={pathId}
        hierarchy={hierarchy}
        target={addTarget}
        onClose={() => setAddTarget(null)}
        onSaved={() => {
          setAddTarget(null);
          router.refresh();
        }}
      />
      <EditNodeModal node={editing} onClose={() => setEditing(null)} onSaved={() => {
        setEditing(null);
        router.refresh();
      }} />
    </div>
  );
}

function AddNodeModal({
  pathId,
  hierarchy,
  target,
  onClose,
  onSaved,
}: {
  pathId: string;
  hierarchy: string[];
  target: { parentId: string | null; depth: number } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!target) return null;
  const t = target;
  const label = labelForDepth(hierarchy, t.depth + 1);
  const isLeafLevel = hierarchy.length > 0 && t.depth + 1 >= hierarchy.length - 1;

  async function submit() {
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathId, parentId: t.parentId, title }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setTitle("");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={`Add ${label.toLowerCase()}`}>
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          {isLeafLevel ? "This is the deepest level — it can hold notes and AI summaries." : "This level can have children below it."}
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{label} title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g. ${label === "Lesson" ? "Pandas DataFrames" : label === "Chapter" ? "Chapter 3: Lists" : "My first " + label.toLowerCase()}`}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditNodeModal({ node, onClose, onSaved }: { node: TreeNodeData | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(node?.title ?? "");
  const [saving, setSaving] = useState(false);

  if (!node) return null;
  const n = node;

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/nodes/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Rename item">
      <div className="space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
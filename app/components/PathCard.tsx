"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Trash2 } from "lucide-react";

export type PathCardData = {
  id: string;
  name: string;
  description: string | null;
  hierarchy: string[];
  nodeCount: number;
};

export default function PathCard({ path }: { path: PathCardData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${path.name}" and everything inside it? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/paths/${path.id}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={remove}
        disabled={deleting}
        title="Delete path"
        className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-950 dark:hover:text-red-400 cursor-pointer"
      >
        <Trash2 size={15} />
      </button>

      <Link href={`/paths/${path.id}`} className="block">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <BookOpen size={18} />
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {path.hierarchy.length === 0 ? "Free-form" : path.hierarchy.join(" → ")}
          </span>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
          {path.name}
        </h2>
        {path.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{path.description}</p>}
        <p className="mt-3 text-xs text-zinc-400">
          {path.nodeCount} {path.nodeCount === 1 ? "item" : "items"}
        </p>
      </Link>
    </div>
  );
}

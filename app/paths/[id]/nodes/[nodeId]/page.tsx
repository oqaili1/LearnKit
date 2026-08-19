import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderTree, Sparkles, StickyNote } from "lucide-react";
import { db } from "@/app/lib/db";
import { parseHierarchy, labelForDepth } from "@/app/lib/hierarchy";
import NotesEditor from "@/app/components/NotesEditor";
import SummaryPanel from "@/app/components/SummaryPanel";

export const dynamic = "force-dynamic";

export default async function NodePage({ params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id, nodeId } = await params;
  const node = await db.node.findUnique({
    where: { id: nodeId },
    include: { path: true, summaries: { orderBy: { createdAt: "desc" } } },
  });
  if (!node || node.pathId !== id) notFound();

  const hierarchy = parseHierarchy(node.path.hierarchy);
  const label = labelForDepth(hierarchy, node.depth);
  const isLeaf = hierarchy.length === 0 || node.depth >= hierarchy.length - 1;

  const summaries = node.summaries.map((s) => ({
    id: s.id,
    inputType: s.inputType,
    sourceUrl: s.sourceUrl,
    result: s.result,
    model: s.model,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div>
      <Link
        href={`/paths/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} /> <FolderTree size={14} /> {node.path.name}
      </Link>

      <div className="mb-6">
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {label}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{node.title}</h1>
        {!isLeaf && (
          <p className="mt-1 text-xs text-zinc-400">
            Parent item — add a summary here, or visit its children (the actual lessons) instead.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <StickyNote size={16} className="text-indigo-600 dark:text-indigo-400" /> My notes
          </h2>
          <NotesEditor
            node={{
              id: node.id,
              content: node.content,
            }}
          />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" /> AI summaries
          </h2>
          <SummaryPanel
            nodeId={node.id}
            nodeTitle={node.title}
            nodeLabel={label}
            nodeNotes={node.content ?? ""}
            summaries={summaries}
          />
        </section>
      </div>
    </div>
  );
}
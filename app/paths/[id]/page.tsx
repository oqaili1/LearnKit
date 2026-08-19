import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { db } from "@/app/lib/db";
import { parseHierarchy } from "@/app/lib/hierarchy";
import NodeTree from "@/app/components/NodeTree";

export const dynamic = "force-dynamic";

export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = await db.path.findUnique({ where: { id } });
  if (!path) notFound();

  const hierarchy = parseHierarchy(path.hierarchy);
  const nodes = await db.node.findMany({
    where: { pathId: id },
    orderBy: [{ depth: "asc" }, { order: "asc" }],
    include: { _count: { select: { summaries: true } } },
  });

  const treeData = nodes.map((n) => ({
    id: n.id,
    title: n.title,
    depth: n.depth,
    parentId: n.parentId,
    order: n.order,
    hasContent: Boolean(n.content?.trim()),
    hasSummaries: n._count.summaries > 0,
  }));

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> All paths
      </Link>
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Layers size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{path.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {path.description || "No description"}
            {hierarchy.length > 0 && (
              <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {hierarchy.join(" → ")}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <NodeTree pathId={id} hierarchy={hierarchy} nodes={treeData} />
      </div>
    </div>
  );
}
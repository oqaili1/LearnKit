import { db } from "@/app/lib/db";
import { parseHierarchy } from "@/app/lib/hierarchy";
import PathCard from "@/app/components/PathCard";
import NewPathButton from "@/app/components/NewPathButton";
import { EmptyState } from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const paths = await db.path.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { nodes: { where: { depth: 0 } } } } },
  });

  const data = paths.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    hierarchy: parseHierarchy(p.hierarchy),
    nodeCount: p._count.nodes,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your learning paths</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Each path defines its own structure — courses, chapters, topics, or whatever fits.
          </p>
        </div>
        <NewPathButton />
      </div>
      {data.length === 0 ? (
        <EmptyState
          title="No paths yet"
          hint="Create your first learning path to start organizing your summaries."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}

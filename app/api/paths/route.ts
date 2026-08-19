import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { HIERARCHY_TEMPLATES, MAX_HIERARCHY_DEPTH, parseHierarchy } from "@/app/lib/hierarchy";

export async function GET() {
  const paths = await db.path.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { nodes: { where: { depth: 0 } } } } },
  });

  const result = paths.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    hierarchy: parseHierarchy(p.hierarchy),
    nodeCount: p._count.nodes,
    createdAt: p.createdAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const templateKey = body.template as string;
  let hierarchy: string[] | null = null;
  if (templateKey && templateKey in HIERARCHY_TEMPLATES) {
    hierarchy = HIERARCHY_TEMPLATES[templateKey];
  } else if (Array.isArray(body.hierarchy)) {
    hierarchy = body.hierarchy
      .map((l: unknown) => (typeof l === "string" ? l.trim() : ""))
      .filter(Boolean)
      .slice(0, MAX_HIERARCHY_DEPTH);
  }

  const path = await db.path.create({
    data: {
      name,
      description: (body.description ?? "").trim() || null,
      hierarchy: JSON.stringify(hierarchy ?? []),
    },
  });

  return NextResponse.json(path, { status: 201 });
}

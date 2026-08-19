import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { parseHierarchy } from "@/app/lib/hierarchy";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pathId = body.pathId as string;
  const title = (body.title ?? "").trim();
  if (!pathId || !title) return NextResponse.json({ error: "Path and title are required." }, { status: 400 });

  const path = await db.path.findUnique({ where: { id: pathId } });
  if (!path) return NextResponse.json({ error: "Path not found." }, { status: 404 });

  const hierarchy = parseHierarchy(path.hierarchy);
  const parentId = body.parentId ?? null;

  let depth = 0;
  if (parentId) {
    const parent = await db.node.findUnique({ where: { id: parentId } });
    if (!parent) return NextResponse.json({ error: "Parent not found." }, { status: 404 });
    if (hierarchy.length > 0 && parent.depth >= hierarchy.length - 1) {
      return NextResponse.json({ error: `A ${hierarchy[parent.depth]} cannot have children (deepest level reached).` }, { status: 400 });
    }
    depth = parent.depth + 1;
  }

  const siblings = await db.node.findMany({
    where: { pathId, parentId: parentId ?? null },
    select: { order: true },
  });
  const order = siblings.length === 0 ? 0 : Math.max(...siblings.map((s) => s.order)) + 1;

  const node = await db.node.create({
    data: { pathId, parentId, depth, title, order },
  });

  return NextResponse.json(node, { status: 201 });
}

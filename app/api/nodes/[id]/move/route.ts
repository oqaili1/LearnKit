import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const direction = body.direction === "down" ? "down" : "up";

  const node = await db.node.findUnique({ where: { id } });
  if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

  const siblings = await db.node.findMany({
    where: { pathId: node.pathId, parentId: node.parentId },
    orderBy: { order: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === node.id);
  if (idx === -1) return NextResponse.json({ error: "Node not in sibling list." }, { status: 400 });

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) {
    return NextResponse.json({ ok: true });
  }
  const other = siblings[swapIdx];

  await db.$transaction([
    db.node.update({ where: { id: node.id }, data: { order: other.order } }),
    db.node.update({ where: { id: other.id }, data: { order: node.order } }),
  ]);

  return NextResponse.json({ ok: true });
}

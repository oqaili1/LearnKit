import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const node = await db.node.findUnique({ where: { id } });
  if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim() || node.title;
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.appendContent === "string") data.content = `${node.content ?? ""}${body.appendContent}`;
  if (typeof body.sourceUrl === "string") data.sourceUrl = body.sourceUrl.trim() || null;

  const updated = await db.node.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.node.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

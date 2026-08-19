import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { geminiModel } from "@/app/lib/gemini";

function envFile(): string {
  return join(process.cwd(), ".env.local");
}

function readEnv(): Record<string, string> {
  const file = envFile();
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function writeEnv(patch: Record<string, string>) {
  const env = readEnv();
  Object.assign(env, patch);
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  writeFileSync(envFile(), lines.join("\n") + "\n");
}

export async function GET() {
  const env = readEnv();
  return NextResponse.json({
    configured: Boolean(env.GEMINI_API_KEY),
    model: env.GEMINI_MODEL || geminiModel(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const patch: Record<string, string> = {};
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    patch.GEMINI_API_KEY = body.apiKey.trim();
  }
  if (typeof body.model === "string" && body.model.trim()) {
    patch.GEMINI_MODEL = body.model.trim();
  }
  try {
    writeEnv(patch);
  } catch (e) {
    return NextResponse.json({ error: `Could not write .env.local: ${(e as Error).message}` }, { status: 500 });
  }
  const env = readEnv();
  return NextResponse.json({ configured: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || geminiModel() });
}

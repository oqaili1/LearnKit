import { NextResponse } from "next/server";
import { testGeminiConnection } from "@/app/lib/gemini";

export async function GET() {
  try {
    const text = await testGeminiConnection();
    return NextResponse.json({ ok: true, message: `Connection OK. Gemini replied: "${text}"` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
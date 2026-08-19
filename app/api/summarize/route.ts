import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { generateWithGemini, geminiModel } from "@/app/lib/gemini";
import { buildSummaryPrompt, SUMMARIZE_SYSTEM_PROMPT } from "@/app/lib/prompts";
import { parseHierarchy, labelForDepth, MAX_SUMMARY_CHARS } from "@/app/lib/hierarchy";
import { fetchYoutubeTranscript } from "@/app/lib/youtube";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body.mode as "text" | "transcript" | "youtube";
  const nodeId = body.nodeId as string;
  const extraInstructions = (body.extraInstructions ?? "").trim();

  if (!["text", "transcript", "youtube"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
  }
  if (!nodeId) return NextResponse.json({ error: "nodeId is required." }, { status: 400 });

  const node = await db.node.findUnique({
    where: { id: nodeId },
    include: { path: true },
  });
  if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

  let content = "";
  let sourceUrl: string | null = null;

  if (mode === "youtube") {
    const url = (body.url ?? "").trim();
    if (!url) return NextResponse.json({ error: "Please paste a YouTube URL." }, { status: 400 });
    let transcript: string;
    try {
      transcript = await fetchYoutubeTranscript(url);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    content = transcript;
    sourceUrl = url;
  } else {
    content = (body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "Please paste the content to summarize." }, { status: 400 });
  }

  if (content.length > MAX_SUMMARY_CHARS) {
    content = content.slice(0, MAX_SUMMARY_CHARS);
  }

  const hierarchy = parseHierarchy(node.path.hierarchy);
  const levelLabel = labelForDepth(hierarchy, node.depth);

  let summaryText: string;
  try {
    summaryText = await generateWithGemini(SUMMARIZE_SYSTEM_PROMPT, buildSummaryPrompt(content, levelLabel, extraInstructions));
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: `AI request failed: ${msg}` },
      { status: 429 }
    );
  }

  const summary = await db.summary.create({
    data: {
      nodeId,
      inputType: mode,
      inputText: mode === "youtube" ? null : content,
      sourceUrl,
      result: summaryText,
      model: geminiModel(),
    },
  });

  return NextResponse.json(summary, { status: 201 });
}

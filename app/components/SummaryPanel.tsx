"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Sparkles, MonitorPlay, Captions, FileText, Trash2, FileDown, FileType } from "lucide-react";
import { Button, Textarea } from "./ui";
import Markdown from "./Markdown";
import { downloadMarkdown, downloadPdf } from "@/app/lib/export";

export type SummaryData = {
  id: string;
  inputType: string;
  sourceUrl: string | null;
  result: string;
  model: string;
  createdAt: string;
};

const MODES = [
  { key: "text", label: "Text", icon: FileText, hint: "Paste an article or book excerpt" },
  { key: "transcript", label: "Transcript", icon: Captions, hint: "Paste a video transcript or captions" },
  { key: "youtube", label: "YouTube URL", icon: MonitorPlay, hint: "Auto-fetch captions and summarize" },
] as const;

export default function SummaryPanel({ nodeId, nodeTitle, nodeLabel, nodeNotes, summaries }: {
  nodeId: string;
  nodeTitle: string;
  nodeLabel: string;
  nodeNotes: string;
  summaries: SummaryData[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    if (mode === "youtube" && !url.trim()) {
      setError("Please paste a YouTube URL.");
      return;
    }
    if (mode !== "youtube" && !content.trim()) {
      setError(`Please paste the ${mode === "transcript" ? "transcript" : "content"} to summarize.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          mode,
          content,
          url,
          extraInstructions: extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setContent("");
      setUrl("");
      setExtra("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeSummary(id: string) {
    await fetch(`/api/summaries/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function exportSummary(s: SummaryData, format: "md" | "pdf") {
    const doc = {
      title: nodeTitle,
      label: nodeLabel,
      sourceUrl: s.sourceUrl,
      notes: nodeNotes,
      summary: s.result,
      model: s.model,
      createdAt: s.createdAt,
    };
    if (format === "md") downloadMarkdown(doc);
    else downloadPdf(doc);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-colors cursor-pointer ${
                mode === m.key
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <Icon size={18} className={mode === m.key ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"} />
              <span className={`text-xs font-medium ${mode === m.key ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-300"}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "youtube" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">YouTube video URL</label>
          <Textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            rows={2}
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <Link2 size={12} /> The app fetches the video captions, then summarizes them.
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {mode === "transcript" ? "Paste the transcript" : "Paste the content to summarize"}
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === "transcript" ? "Paste the full transcript here..." : "Paste text from a book, article, or lesson here..."}
            rows={7}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Extra instructions (optional)</label>
        <Textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="e.g. Focus on code examples, explain like I'm a beginner, summarize in 5 bullets..."
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button onClick={generate} loading={loading} className="w-full">
        <Sparkles size={15} /> Generate AI summary
      </Button>

      {summaries.length > 0 && (
        <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Summary history ({summaries.length})
          </h3>
          {summaries.map((s) => (
            <div key={s.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400">
                  {s.inputType} · {s.model} · {new Date(s.createdAt).toLocaleString()}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => exportSummary(s, "md")} title="Download as Markdown">
                    <FileType size={13} /> MD
                  </Button>
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => exportSummary(s, "pdf")} title="Download as PDF">
                    <FileDown size={13} /> PDF
                  </Button>
                  <Button variant="ghost" className="!px-2 !py-1 text-xs text-red-500" onClick={() => removeSummary(s.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                  <Link2 size={12} /> {s.sourceUrl}
                </a>
              )}
              <Markdown content={s.result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

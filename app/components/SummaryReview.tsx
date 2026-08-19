"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Link2, Sparkles } from "lucide-react";
import Markdown from "./Markdown";
import type { SummaryData } from "./SummaryPanel";

export default function SummaryReview({ summaries }: {
  summaries: SummaryData[];
}) {
  const [index, setIndex] = useState(0);
  const count = summaries.length;
  if (count === 0) return null;

  const safeIndex = Math.min(index, count - 1);
  const current = summaries[safeIndex];
  const isLatest = safeIndex === 0;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
          Summary
          {isLatest && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              Latest of {count}
            </span>
          )}
        </h2>
        {count > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              title="Older summary"
              className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-zinc-400">
              {safeIndex + 1} / {count}
            </span>
            <button
              onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
              disabled={safeIndex === count - 1}
              title="Newer summary"
              className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
        <span>
          {current.inputType} · {current.model} · {new Date(current.createdAt).toLocaleString()}
        </span>
        {current.sourceUrl && (
          <a
            href={current.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Link2 size={12} /> {current.sourceUrl}
          </a>
        )}
      </div>

      <Markdown content={current.result} />
    </section>
  );
}
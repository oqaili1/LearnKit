import { jsPDF } from "jspdf";

export type ExportContent = {
  title: string;
  label: string;
  sourceUrl: string | null;
  notes: string;
  summary: string;
  model: string;
  createdAt: string;
};

export function buildExportMarkdown(ec: ExportContent): string {
  const lines: string[] = [];
  lines.push(`# ${ec.title}`);
  lines.push("");
  if (ec.label) lines.push(`*${ec.label}*`);
  if (ec.sourceUrl) lines.push(`Source: ${ec.sourceUrl}`);
  lines.push(`Generated: ${formatDate(ec.createdAt)} · Model: ${ec.model}`);
  lines.push("");

  if (ec.notes.trim()) {
    lines.push("## My notes");
    lines.push("");
    lines.push(ec.notes.trim());
    lines.push("");
  }

  lines.push("## AI summary");
  lines.push("");
  lines.push(ec.summary.trim());
  lines.push("");
  lines.push("---");
  lines.push(`*Exported from LearnKit on ${formatDate(new Date().toISOString())}*`);
  lines.push("");
  return lines.join("\n");
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "summary"
  );
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(ec: ExportContent) {
  downloadTextFile(`${slugify(ec.title)}-summary.md`, buildExportMarkdown(ec), "text/markdown");
}

export function downloadPdf(ec: ExportContent) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(ec.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  const meta = [
    ec.label ? ec.label : null,
    ec.sourceUrl ? `Source: ${ec.sourceUrl}` : null,
    `Generated: ${formatDate(ec.createdAt)} · Model: ${ec.model}`,
  ]
    .filter(Boolean)
    .join("  |  ");
  const metaLines = doc.splitTextToSize(meta, maxWidth);
  doc.text(metaLines, margin, y);
  y += metaLines.length * 13 + 6;

  doc.setDrawColor(180);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setTextColor(0);

  const markdown = buildExportMarkdown(ec);
  renderMarkdownToPdf(doc, markdown, { margin, maxWidth, initialY: y });
  doc.save(`${slugify(ec.title)}-summary.pdf`);
}

function renderMarkdownToPdf(
  doc: jsPDF,
  markdown: string,
  opts: { margin: number; maxWidth: number; initialY: number }
) {
  const { margin, maxWidth } = opts;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = opts.initialY;

  function ensureSpace(height: number) {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  const rawLines = markdown.split("\n");
  let inCode = false;
  let codeBuf: string[] = [];

  function flushCode() {
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    for (const line of codeBuf) {
      const wrapped = doc.splitTextToSize(line, maxWidth - 16);
      ensureSpace(wrapped.length * 11 + 1);
      doc.text(wrapped, margin + 10, y);
      y += wrapped.length * 11 + 1;
    }
    y += 4;
    codeBuf = [];
  }

  for (const raw of rawLines) {
    const line = raw.replace(/\r$/, "");
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (!line.trim()) {
      y += 8;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const size = level === 1 ? 16 : level === 2 ? 13.5 : 12;
      ensureSpace(size + 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.text(stripInline(heading[2]), margin, y);
      y += size + 8;
      continue;
    }

    const bullet = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      const indent = margin + Math.min(bullet[1].length, 8) * 5;
      const text = stripInline(bullet[2]);
      const wrapped = doc.splitTextToSize(text, maxWidth - Math.min(bullet[1].length, 8) * 5 - 14);
      ensureSpace(wrapped.length * 13 + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text("\u2022", indent, y);
      doc.text(wrapped, indent + 12, y);
      y += wrapped.length * 13 + 2;
      continue;
    }

    const paragraph = doc.splitTextToSize(stripInline(line), maxWidth);
    ensureSpace(paragraph.length * 13 + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(paragraph, margin, y);
    y += paragraph.length * 13 + 3;
  }

  if (inCode) flushCode();
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

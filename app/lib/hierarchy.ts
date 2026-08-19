export type HierLevel = { label: string; depth: number };

export function parseHierarchy(json: string | null): string[] {
  try {
    const parsed = JSON.parse(json ?? "[]");
    if (Array.isArray(parsed)) return parsed.filter((l) => typeof l === "string");
  } catch {
    // fall through
  }
  return [];
}

export const HIERARCHY_TEMPLATES: Record<string, string[]> = {
  course: ["Course", "Module", "Lesson"],
  book: ["Chapter", "Section"],
  freeform: [],
};

export const MAX_HIERARCHY_DEPTH = 5;
export const MAX_SUMMARY_CHARS = 60_000;

export function labelForDepth(hierarchy: string[], depth: number): string {
  if (hierarchy.length === 0) return "Item";
  return hierarchy[Math.min(depth, hierarchy.length - 1)];
}

export function nextLabel(hierarchy: string[], depth: number): string | null {
  if (depth >= hierarchy.length - 1) return null;
  return hierarchy[depth + 1];
}

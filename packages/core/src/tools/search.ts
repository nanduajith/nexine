import type { ToolMeta } from './types';

/**
 * Lightweight, dependency-free relevance search over tool metadata. Deterministic
 * and pure so it's trivially testable. Not a full fuzzy engine — it weights exact
 * and prefix matches on the fields that matter (name > keywords > description).
 */
export function searchTools<T extends ToolMeta>(tools: readonly T[], query: string): readonly T[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;

  const scored = tools
    .map((tool) => ({ tool, score: scoreTool(tool, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));

  return scored.map((entry) => entry.tool);
}

function scoreTool(tool: ToolMeta, q: string): number {
  const name = tool.name.toLowerCase();
  const id = tool.id.toLowerCase();

  if (name === q || id === q) return 100;

  let score = 0;
  if (name.startsWith(q)) score += 60;
  else if (name.includes(q)) score += 35;

  if (id.includes(q)) score += 20;

  for (const keyword of tool.keywords) {
    const k = keyword.toLowerCase();
    if (k === q) score += 25;
    else if (k.startsWith(q)) score += 15;
    else if (k.includes(q)) score += 8;
  }

  if (tool.description.toLowerCase().includes(q)) score += 5;

  return score;
}

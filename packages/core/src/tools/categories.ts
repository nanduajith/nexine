import type { ToolCategory } from './types';

export interface CategoryMeta {
  readonly id: ToolCategory;
  readonly label: string;
  /** Display order in the sidebar (ascending). */
  readonly order: number;
}

/** Ordered category metadata, driving sidebar grouping and labels. */
export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'encoding', label: 'Encoding', order: 10 },
  { id: 'crypto', label: 'Crypto & Security', order: 20 },
  { id: 'web', label: 'Web', order: 30 },
  { id: 'data', label: 'Data', order: 40 },
  { id: 'text', label: 'Text', order: 50 },
  { id: 'generators', label: 'Generators', order: 60 },
  { id: 'time', label: 'Time', order: 70 },
];

const CATEGORY_BY_ID = new Map<ToolCategory, CategoryMeta>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: ToolCategory): CategoryMeta {
  const meta = CATEGORY_BY_ID.get(id);
  // Every ToolCategory is present in CATEGORIES; this guards against drift.
  if (!meta) throw new Error(`Unknown tool category: ${id}`);
  return meta;
}

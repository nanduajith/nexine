export const CASE_FORMATS = [
  'camel',
  'pascal',
  'snake',
  'kebab',
  'constant',
  'title',
  'sentence',
  'lower',
  'upper',
] as const;

export type CaseFormat = (typeof CASE_FORMATS)[number];

export const CASE_LABELS: Record<CaseFormat, string> = {
  camel: 'camelCase',
  pascal: 'PascalCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  constant: 'CONSTANT_CASE',
  title: 'Title Case',
  sentence: 'Sentence case',
  lower: 'lower case',
  upper: 'UPPER CASE',
};

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

/** Split arbitrary input into lowercase words, handling camelCase boundaries. */
function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

const CONVERTERS: Record<CaseFormat, (words: string[]) => string> = {
  camel: (words) => words.map((word, index) => (index === 0 ? word : capitalize(word))).join(''),
  pascal: (words) => words.map(capitalize).join(''),
  snake: (words) => words.join('_'),
  kebab: (words) => words.join('-'),
  constant: (words) => words.map((word) => word.toUpperCase()).join('_'),
  title: (words) => words.map(capitalize).join(' '),
  sentence: (words) => capitalize(words.join(' ')),
  lower: (words) => words.join(' '),
  upper: (words) => words.map((word) => word.toUpperCase()).join(' '),
};

export function convertCase(input: string, format: CaseFormat): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  return CONVERTERS[format](words);
}

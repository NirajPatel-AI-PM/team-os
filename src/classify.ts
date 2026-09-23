export type Level = 'public' | 'internal' | 'restricted';

// ponytail: pattern heuristics with known misses; a real deployment calls the organization's DLP classifier here.
const RESTRICTED: Array<[string, RegExp]> = [
  ['US social security number', /\b\d{3}-\d{2}-\d{4}\b/],
  ['medical record number', /\bMRN[:#\s]*\d{6,}\b/i],
  ['payment card number', /\b(?:\d[ -]?){13,16}\b/],
  ['classification label', /\b(RESTRICTED|CONFIDENTIAL)\b/],
];
const INTERNAL: Array<[string, RegExp]> = [
  ['email address', /\b[\w.+-]+@[\w-]+\.[\w.]+\b/],
  ['classification label', /\bINTERNAL\b/],
];

export function classify(text: string): { level: Level; reasons: string[] } {
  const restricted = RESTRICTED.filter(([, re]) => re.test(text)).map(([why]) => why);
  if (restricted.length) return { level: 'restricted', reasons: restricted };
  const internal = INTERNAL.filter(([, re]) => re.test(text)).map(([why]) => why);
  if (internal.length) return { level: 'internal', reasons: internal };
  return { level: 'public', reasons: [] };
}

export function isOutbound(toolName: string, input: Record<string, unknown>): boolean {
  if (toolName === 'WebFetch' || toolName === 'WebSearch' || toolName.startsWith('mcp__')) return true;
  if (toolName === 'Bash') return /\b(curl|wget|nc|scp|ssh|gh|git\s+push)\b|https?:\/\//.test(String(input.command ?? ''));
  return false;
}

import { mkdirSync, writeFileSync } from 'node:fs';
import { summarize } from '../src/adoption.ts';
import { renderDashboard } from '../src/dashboard.ts';
import { readRecords, recordsPath } from '../src/records.ts';

const src = process.argv[2] ?? recordsPath();
const out = process.argv[3] ?? 'docs/dashboard.html';
mkdirSync('docs', { recursive: true });
writeFileSync(out, renderDashboard(summarize(readRecords(src)), { source: process.argv[4] ?? src, generated: new Date().toISOString().slice(0, 10) }));
console.log(`wrote ${out}`);

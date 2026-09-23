import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export type EventKind = 'session' | 'skill' | 'agent' | 'rating';

// Content-free by design: no prompt, path, argument or output ever lands here.
export type UsageRecord = {
  ts: string;
  user: string;
  session: string;
  event: EventKind;
  name?: string;
  rating?: 'up' | 'down';
};

export function recordsPath(): string {
  return process.env.TEAM_OS_RECORDS ?? join(homedir(), '.claude', 'team-os', 'records.jsonl');
}

// Pseudonymous, not anonymous: anyone who knows a session id can recompute its hash.
export function pseudonym(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function currentUser(): string {
  const dir = dirname(recordsPath());
  const idPath = join(dir, 'user-id');
  if (existsSync(idPath)) return readFileSync(idPath, 'utf8').trim();
  mkdirSync(dir, { recursive: true });
  const id = randomBytes(6).toString('hex');
  writeFileSync(idPath, id);
  return id;
}

export function appendRecord(rec: UsageRecord, path = recordsPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(rec) + '\n');
}

export function readRecords(path = recordsPath()): UsageRecord[] {
  if (!existsSync(path)) return [];
  const out: UsageRecord[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as UsageRecord;
      if (Number.isNaN(Date.parse(rec.ts))) continue;
      if (rec.name !== undefined && typeof rec.name !== 'string') continue;
      out.push(rec);
    } catch {}
  }
  return out;
}

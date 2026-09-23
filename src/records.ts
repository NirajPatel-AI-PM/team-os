import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir, userInfo } from 'node:os';
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

// Pseudonymous, not anonymous: anyone who can guess an email can recompute its id.
export function pseudonym(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function currentUser(): string {
  try {
    const email = execFileSync('git', ['config', 'user.email'], { encoding: 'utf8' }).trim();
    if (email) return pseudonym(email);
  } catch {}
  return pseudonym(userInfo().username);
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
      out.push(JSON.parse(line) as UsageRecord);
    } catch {}
  }
  return out;
}

import type { UsageRecord } from './records.ts';

export type Week = { week: string; activeUsers: number; sessions: number; sessionsPerUser: number };
export type Usage = { kind: 'skill' | 'agent'; name: string; count: number };
export type Summary = { users: number; weeks: Week[]; usage: Usage[]; ratings: { up: number; down: number; upRate: number | null } };

export function weekOf(ts: string): string {
  const d = new Date(ts);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

export function summarize(records: UsageRecord[]): Summary {
  const byWeek = new Map<string, { users: Set<string>; sessions: Set<string> }>();
  for (const r of records.filter((r) => r.event === 'session')) {
    const w = byWeek.get(weekOf(r.ts)) ?? { users: new Set(), sessions: new Set() };
    w.users.add(r.user);
    w.sessions.add(r.session);
    byWeek.set(weekOf(r.ts), w);
  }
  const weeks = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, w]) => ({ week, activeUsers: w.users.size, sessions: w.sessions.size, sessionsPerUser: w.sessions.size / w.users.size }));

  const counts = new Map<string, Usage>();
  for (const r of records) {
    if ((r.event !== 'skill' && r.event !== 'agent') || !r.name) continue;
    const key = `${r.event}:${r.name}`;
    const u = counts.get(key) ?? { kind: r.event, name: r.name, count: 0 };
    u.count++;
    counts.set(key, u);
  }
  const usage = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const up = records.filter((r) => r.event === 'rating' && r.rating === 'up').length;
  const down = records.filter((r) => r.event === 'rating' && r.rating === 'down').length;

  return { users: new Set(records.map((r) => r.user)).size, weeks, usage, ratings: { up, down, upRate: up + down ? up / (up + down) : null } };
}

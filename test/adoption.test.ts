import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, weekOf } from '../src/adoption.ts';
import type { UsageRecord } from '../src/records.ts';

const rec = (ts: string, user: string, session: string, event: UsageRecord['event'], extra: Partial<UsageRecord> = {}): UsageRecord =>
  ({ ts, user, session, event, ...extra });

test('weeks start on Monday, in UTC', () => {
  assert.equal(weekOf('2026-09-20T23:00:00.000Z'), '2026-09-14'); // a Sunday
  assert.equal(weekOf('2026-09-21T00:30:00.000Z'), '2026-09-21'); // the next Monday
});

test('active users and sessions are counted per week', () => {
  const s = summarize([
    rec('2026-09-14T09:00:00Z', 'a', 's1', 'session'),
    rec('2026-09-15T09:00:00Z', 'a', 's2', 'session'),
    rec('2026-09-15T10:00:00Z', 'b', 's3', 'session'),
    rec('2026-09-22T09:00:00Z', 'a', 's4', 'session'),
  ]);
  assert.equal(s.users, 2);
  assert.deepEqual(s.weeks, [
    { week: '2026-09-14', activeUsers: 2, sessions: 3, sessionsPerUser: 1.5 },
    { week: '2026-09-21', activeUsers: 1, sessions: 1, sessionsPerUser: 1 },
  ]);
});

test('usage is counted by kind and name, most used first', () => {
  const s = summarize([
    rec('2026-09-14T09:00:00Z', 'a', 's1', 'skill', { name: 'spec' }),
    rec('2026-09-14T09:01:00Z', 'a', 's1', 'skill', { name: 'spec' }),
    rec('2026-09-14T09:02:00Z', 'a', 's1', 'agent', { name: 'code-reviewer' }),
  ]);
  assert.deepEqual(s.usage, [
    { kind: 'skill', name: 'spec', count: 2 },
    { kind: 'agent', name: 'code-reviewer', count: 1 },
  ]);
});

test('the thumbs-up rate is null when nobody has rated, never a made-up zero', () => {
  assert.equal(summarize([]).ratings.upRate, null);
  const s = summarize([
    rec('2026-09-14T09:00:00Z', 'a', 's1', 'rating', { rating: 'up' }),
    rec('2026-09-14T09:00:00Z', 'a', 's1', 'rating', { rating: 'up' }),
    rec('2026-09-14T09:00:00Z', 'b', 's2', 'rating', { rating: 'down' }),
  ]);
  assert.deepEqual(s.ratings, { up: 2, down: 1, upRate: 2 / 3 });
});

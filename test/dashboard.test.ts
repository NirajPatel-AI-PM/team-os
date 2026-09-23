import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDashboard } from '../src/dashboard.ts';
import type { Summary } from '../src/adoption.ts';

const s: Summary = {
  users: 2,
  weeks: [
    { week: '2026-09-14', activeUsers: 2, sessions: 3, sessionsPerUser: 1.5 },
    { week: '2026-09-21', activeUsers: 1, sessions: 1, sessionsPerUser: 1 },
  ],
  usage: [{ kind: 'skill', name: '<script>alert(1)</script>', count: 2 }],
  ratings: { up: 2, down: 1, upRate: 2 / 3 },
};
const html = renderDashboard(s, { source: 'test fixture', generated: '2026-09-22' });

test('shows the latest week, engagement and satisfaction with its sample size', () => {
  assert.match(html, />1<\/span>\s*<span class="label">active users, week of 2026-09-21/);
  assert.match(html, /1\.0<\/span>\s*<span class="label">sessions per user/);
  assert.match(html, /67%<\/span>\s*<span class="label">thumbs up, n=3/);
});

test('escapes names so a skill name cannot inject markup', () => {
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('makes no external requests and supports dark mode', () => {
  assert.ok(!/(src|href)="https?:/.test(html));
  assert.ok(html.includes('prefers-color-scheme: dark'));
});

test('says so when nobody has rated, instead of showing a number', () => {
  const none = renderDashboard({ ...s, ratings: { up: 0, down: 0, upRate: null } }, { source: 'x', generated: 'y' });
  assert.match(none, /no ratings yet/);
});

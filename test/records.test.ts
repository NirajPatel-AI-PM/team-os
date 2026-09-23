import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendRecord, pseudonym, readRecords, type UsageRecord } from '../src/records.ts';

const tmp = () => join(mkdtempSync(join(tmpdir(), 'team-os-')), 'records.jsonl');

test('pseudonym is stable, short, and not the input', () => {
  assert.equal(pseudonym('a@example.com'), pseudonym('a@example.com'));
  assert.equal(pseudonym('a@example.com').length, 12);
  assert.notEqual(pseudonym('a@example.com'), pseudonym('b@example.com'));
  assert.ok(!pseudonym('a@example.com').includes('example'));
});

test('append then read returns the same records in order', () => {
  const path = tmp();
  const a: UsageRecord = { ts: '2026-09-21T10:00:00.000Z', user: 'u1', session: 's1', event: 'session' };
  const b: UsageRecord = { ts: '2026-09-21T10:01:00.000Z', user: 'u1', session: 's1', event: 'skill', name: 'spec' };
  appendRecord(a, path);
  appendRecord(b, path);
  assert.deepEqual(readRecords(path), [a, b]);
});

test('read skips blank and malformed lines rather than failing', () => {
  const path = tmp();
  writeFileSync(path, '\n{not json}\n{"ts":"t","user":"u","session":"s","event":"session"}\n');
  assert.equal(readRecords(path).length, 1);
});

test('reading a missing file returns no records', () => {
  assert.deepEqual(readRecords(join(tmpdir(), 'does-not-exist-ptp.jsonl')), []);
});

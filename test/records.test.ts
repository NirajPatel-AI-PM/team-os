import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendRecord, pseudonym, readRecords, type UsageRecord } from '../src/records.ts';
import { toRecord } from '../hooks/record.ts';

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

const now = new Date('2026-09-21T10:00:00.000Z');

test('a session start becomes a session record with a pseudonymous session id', () => {
  const r = toRecord({ hook_event_name: 'SessionStart', session_id: 'abc' }, 'u1', now);
  assert.deepEqual(r, { ts: now.toISOString(), user: 'u1', session: pseudonym('abc'), event: 'session' });
});

test('a skill call records the skill name and nothing else from its input', () => {
  const r = toRecord(
    { hook_event_name: 'PostToolUse', session_id: 'abc', tool_name: 'Skill', tool_input: { skill: 'team-os:spec', args: 'secret text' } },
    'u1',
    now,
  );
  assert.equal(r?.event, 'skill');
  assert.equal(r?.name, 'spec');
  assert.ok(!JSON.stringify(r).includes('secret'));
});

test('a subagent call records the agent type and not its prompt', () => {
  for (const tool_name of ['Task', 'Agent']) {
    const r = toRecord(
      { hook_event_name: 'PostToolUse', session_id: 'abc', tool_name, tool_input: { subagent_type: 'team-os:code-reviewer', prompt: 'secret text' } },
      'u1',
      now,
    );
    assert.equal(r?.event, 'agent');
    assert.equal(r?.name, 'code-reviewer');
    assert.ok(!JSON.stringify(r).includes('secret'));
  }
});

test('any other tool produces no record', () => {
  assert.equal(toRecord({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } }, 'u1', now), null);
});

test('skills and agents from outside Team OS produce no record', () => {
  for (const skill of ['other-plugin:deploy', 'spec']) {
    assert.equal(toRecord({ hook_event_name: 'PostToolUse', tool_name: 'Skill', tool_input: { skill } }, 'u1', now), null);
  }
  assert.equal(toRecord({ hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose' } }, 'u1', now), null);
});

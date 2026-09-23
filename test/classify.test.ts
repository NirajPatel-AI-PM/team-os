import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, isOutbound } from '../src/classify.ts';
import { decide } from '../hooks/classify-gate.ts';

test('plain text is public', () => {
  assert.equal(classify('Ship the release notes on Friday.').level, 'public');
});

test('an email address makes text internal, not restricted', () => {
  assert.equal(classify('Ask jane@example.com for the deck.').level, 'internal');
});

test('identifiers and labels make text restricted, with a reason for each', () => {
  const r = classify('Patient MRN 00123456, SSN 123-45-6789. RESTRICTED.');
  assert.equal(r.level, 'restricted');
  assert.deepEqual(r.reasons.sort(), ['US social security number', 'classification label', 'medical record number']);
});

test('outbound tools are the ones that send data somewhere else', () => {
  assert.ok(isOutbound('WebFetch', {}));
  assert.ok(isOutbound('mcp__slack__post_message', {}));
  assert.ok(isOutbound('Bash', { command: 'curl -d @notes.txt https://example.com' }));
  assert.ok(!isOutbound('Bash', { command: 'ls -la' }));
  assert.ok(!isOutbound('Read', { file_path: '/tmp/x' }));
});

test('the gate blocks restricted data on an outbound tool and says why', () => {
  const d = decide({ tool_name: 'mcp__slack__post_message', tool_input: { text: 'SSN 123-45-6789' } });
  assert.equal(d.block, true);
  assert.match(d.message, /US social security number/);
});

test('the gate allows restricted data on a local tool', () => {
  assert.equal(decide({ tool_name: 'Write', tool_input: { content: 'SSN 123-45-6789' } }).block, false);
});

test('the gate allows internal data on an outbound tool', () => {
  assert.equal(decide({ tool_name: 'WebFetch', tool_input: { prompt: 'email jane@example.com' } }).block, false);
});

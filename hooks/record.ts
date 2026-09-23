import { readFileSync, realpathSync } from 'node:fs';
import { appendRecord, currentUser, pseudonym, type UsageRecord } from '../src/records.ts';

export type HookEvent = {
  hook_event_name: string;
  session_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
};

// Other plugins' skill and agent names never reach a records file that may be shared.
const PREFIX = 'team-os:';
const ours = (v: unknown): string | null => (typeof v === 'string' && v.startsWith(PREFIX) ? v.slice(PREFIX.length) : null);

export function toRecord(event: HookEvent, user: string, now: Date): UsageRecord | null {
  const base = { ts: now.toISOString(), user, session: pseudonym(event.session_id ?? 'unknown') };
  if (event.hook_event_name === 'SessionStart') return { ...base, event: 'session' };
  if (event.hook_event_name !== 'PostToolUse') return null;

  const input = event.tool_input ?? {};
  if (event.tool_name === 'Skill') {
    const name = ours(input.skill);
    return name ? { ...base, event: 'skill', name } : null;
  }
  if (event.tool_name === 'Task' || event.tool_name === 'Agent') {
    const name = ours(input.subagent_type);
    return name ? { ...base, event: 'agent', name } : null;
  }
  return null;
}

if (process.argv[1] !== undefined && import.meta.filename === realpathSync(process.argv[1])) {
  // A recording failure must never interrupt the user's session.
  try {
    const rec = toRecord(JSON.parse(readFileSync(0, 'utf8')) as HookEvent, currentUser(), new Date());
    if (rec) appendRecord(rec);
  } catch {}
  process.exit(0);
}

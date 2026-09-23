import { readFileSync, realpathSync } from 'node:fs';
import { classify, isOutbound } from '../src/classify.ts';

export function decide(event: { tool_name?: string; tool_input?: Record<string, unknown> }): { block: boolean; message: string } {
  const tool = event.tool_name ?? '';
  const input = event.tool_input ?? {};
  if (!isOutbound(tool, input)) return { block: false, message: '' };

  const { level, reasons } = classify(JSON.stringify(input).replace(/\\[nrtbf]/g, ' '));
  if (level !== 'restricted') return { block: false, message: '' };
  return {
    block: true,
    message: `Blocked: ${tool} would send restricted data outside this machine (${reasons.join(', ')}). Remove it, or ask the data owner.`,
  };
}

if (process.argv[1] !== undefined && import.meta.filename === realpathSync(process.argv[1])) {
  let event;
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }
  const d = decide(event);
  if (d.block) {
    process.stderr.write(d.message + '\n');
    process.exit(2);
  }
  process.exit(0);
}

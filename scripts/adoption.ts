import { summarize } from '../src/adoption.ts';
import { readRecords } from '../src/records.ts';

const s = summarize(readRecords(process.argv[2]));
console.log(`Users: ${s.users}`);
console.log('\nWeek        Active  Sessions  Per user');
for (const w of s.weeks) console.log(`${w.week}  ${String(w.activeUsers).padStart(6)}  ${String(w.sessions).padStart(8)}  ${w.sessionsPerUser.toFixed(1).padStart(8)}`);
console.log('\nMost used');
for (const u of s.usage.slice(0, 10)) console.log(`  ${u.kind.padEnd(6)} ${u.name.padEnd(24)} ${u.count}`);
const rate = s.ratings.upRate === null ? 'no ratings yet' : `${Math.round(s.ratings.upRate * 100)}% up, n=${s.ratings.up + s.ratings.down}`;
console.log(`\nSatisfaction: ${rate}`);

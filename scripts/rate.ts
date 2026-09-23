import { appendRecord, currentUser, pseudonym } from '../src/records.ts';

const rating = process.argv[2];
if (rating !== 'up' && rating !== 'down') {
  console.error('usage: node scripts/rate.ts up|down');
  process.exit(1);
}
appendRecord({
  ts: new Date().toISOString(),
  user: currentUser(),
  session: pseudonym(process.env.CLAUDE_SESSION_ID ?? 'cli'),
  event: 'rating',
  rating,
});
console.log(`Recorded a thumbs ${rating}.`);

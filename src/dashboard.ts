import type { Summary } from './adoption.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bars(s: Summary): string {
  const w = 640, h = 180, pad = 28;
  const max = Math.max(1, ...s.weeks.map((x) => x.activeUsers));
  const step = (w - pad * 2) / Math.max(1, s.weeks.length);
  const rects = s.weeks
    .map((x, i) => {
      const bh = ((h - pad * 2) * x.activeUsers) / max;
      const cx = pad + i * step;
      return `<rect x="${cx + step * 0.15}" y="${h - pad - bh}" width="${step * 0.7}" height="${bh}" rx="3"><title>${esc(x.week)}: ${x.activeUsers} active</title></rect>
<text x="${cx + step / 2}" y="${h - 8}" text-anchor="middle">${esc(x.week.slice(5))}</text>`;
    })
    .join('\n');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Active users per week">${rects}</svg>`;
}

export function renderDashboard(s: Summary, meta: { source: string; generated: string }): string {
  const last = s.weeks.at(-1);
  const rate = s.ratings.upRate === null ? 'no ratings yet' : `${Math.round(s.ratings.upRate * 100)}%`;
  const n = s.ratings.up + s.ratings.down;
  const tile = (value: string, label: string) => `<div class="tile"><span class="value">${esc(value)}</span>\n<span class="label">${esc(label)}</span></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Team OS adoption</title>
<style>
:root { --bg:#fbfbfa; --fg:#1d1d1b; --muted:#6b6b66; --card:#ffffff; --line:#e6e5e0; --accent:#2f5d8a; }
@media (prefers-color-scheme: dark) { :root { --bg:#161615; --fg:#ecebe6; --muted:#9a9993; --card:#1f1f1d; --line:#2e2e2b; --accent:#7fa8d1; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 16px 48px; }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 15px; margin: 32px 0 8px; }
.sub { color: var(--muted); margin: 0 0 24px; }
.tiles { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; }
.tile { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; display:flex; flex-direction:column; }
.value { font-size: 28px; font-weight: 600; font-variant-numeric: tabular-nums; }
.label { color: var(--muted); font-size: 13px; }
svg { width:100%; height:auto; background:var(--card); border:1px solid var(--line); border-radius:10px; }
svg rect { fill: var(--accent); }
svg text { fill: var(--muted); font-size: 11px; }
table { width:100%; border-collapse: collapse; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
th, td { text-align:left; padding:8px 12px; border-bottom:1px solid var(--line); font-variant-numeric: tabular-nums; }
th { color: var(--muted); font-weight: 500; font-size: 13px; }
tr:last-child td { border-bottom: 0; }
td.num, th.num { text-align: right; }
footer { color: var(--muted); font-size: 13px; margin-top: 32px; }
</style>
</head>
<body>
<main>
<h1>Team OS adoption</h1>
<p class="sub">${s.users} ${s.users === 1 ? 'user' : 'users'}. Source: ${esc(meta.source)}. Generated ${esc(meta.generated)}.</p>
<div class="tiles">
${tile(String(last?.activeUsers ?? 0), `active users, week of ${last?.week ?? 'none'}`)}
${tile((last?.sessionsPerUser ?? 0).toFixed(1), 'sessions per user, that week')}
${tile(rate, n ? `thumbs up, n=${n}` : 'thumbs up')}
</div>
<h2>Active users per week</h2>
${bars(s)}
<h2>Most used</h2>
<table>
<thead><tr><th>Kind</th><th>Name</th><th class="num">Uses</th></tr></thead>
<tbody>
${s.usage.slice(0, 12).map((u) => `<tr><td>${esc(u.kind)}</td><td>${esc(u.name)}</td><td class="num">${u.count}</td></tr>`).join('\n')}
</tbody>
</table>
<footer>Built from content-free records: time, pseudonymous user and session ids, event, name, rating. No prompts, paths or output are recorded.</footer>
</main>
</body>
</html>
`;
}

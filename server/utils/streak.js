// Pure streak logic (no database) so it is easy to test.
export const MAX_SAVES_PER_MONTH = 2;
export const LOOKBACK_DAYS = 90;

export const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z'));
export const shift = (d, n) => {
  const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
// Client sends its local date; accept anything within 2 days of server UTC (covers all timezones).
export const plausibleToday = s => isDate(s) && Math.abs(new Date(s) - new Date(new Date().toISOString().slice(0, 10))) <= 2 * 864e5;

// A day is "done" when the person hit THEIR OWN steps and water targets.
export const dayDone = (log, t = {}) =>
  !!log && (log.steps || 0) >= Math.max(1, t.steps ?? 10000) && (log.water || 0) >= Math.max(1, t.water ?? 8);

/**
 * members: [{ id, joined }]   targets: { id: {steps, water} }
 * logs: Map("id|date" -> log) savedDays: string[]   today: 'YYYY-MM-DD'
 */
export function groupStatus({ members, targets, logs, savedDays, today }) {
  const saved = new Set(savedDays);
  const done = (id, d) => dayDone(logs.get(id + '|' + d), targets[id]);
  const status = d => {
    const req = members.filter(m => m.joined <= d); // a new joiner never breaks past days
    if (!req.length) return 'none';
    if (req.every(m => done(m.id, d))) return 'done';
    if (saved.has(d)) return 'saved';
    return d === today ? 'pending' : 'missed';
  };
  let streak = 0;
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const s = status(shift(today, -i));
    if (s === 'pending') continue;          // today isn't over yet
    if (s === 'done') streak++;
    else if (s !== 'saved') break;          // saved days keep it alive without adding to it
  }
  const savesLeftFor = d => Math.max(0, MAX_SAVES_PER_MONTH - savedDays.filter(x => x.slice(0, 7) === d.slice(0, 7)).length);
  const yday = shift(today, -1);
  const saveable = status(yday) === 'missed' && savesLeftFor(yday) > 0 &&
    ['done', 'saved'].includes(status(shift(today, -2))) ? yday : null; // only worth saving a real streak
  const week = Array.from({ length: 7 }, (_, i) => { const d = shift(today, i - 6); return { date: d, status: status(d) }; });
  return { streak, week, saveable, savesLeft: savesLeftFor(today), done };
}

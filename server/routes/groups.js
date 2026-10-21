import { Router } from 'express';
import crypto from 'crypto';
import { Group, Log, Nudge, User } from '../models.js';
import protect from '../middleware/auth.js';
import { groupStatus, plausibleToday, shift, LOOKBACK_DAYS } from '../utils/streak.js';

const r = Router();
r.use(protect);
const MAX_MEMBERS = 6, MAX_GROUPS = 5;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no look-alike characters
const newCode = () => Array.from(crypto.randomBytes(6), b => ALPHABET[b % ALPHABET.length]).join('');
const fail = (s, e) => s.status(500).json({ message: e.message });
const todayOf = q => { const t = q.query.today || q.body?.today; return plausibleToday(t) ? t : null; };
const NO_DATE = { message: 'Missing or invalid date' };

// Builds what one member is allowed to see. Buddies only ever get done / not-done, never numbers.
async function view(g, me, today) {
  const ids = g.members.map(m => m.user);
  const [logs, users, nudges] = await Promise.all([
    Log.find({ user: { $in: ids }, date: { $gte: shift(today, -LOOKBACK_DAYS), $lte: today } }).lean(),
    User.find({ _id: { $in: ids } }).select('name targets').lean(),
    Nudge.find({ group: g._id, date: today, $or: [{ to: me }, { from: me }] }).lean(),
  ]);
  const logMap = new Map(logs.map(l => [l.user + '|' + l.date, l]));
  const byId = Object.fromEntries(users.map(u => [String(u._id), u]));
  const targets = Object.fromEntries(users.map(u => [String(u._id), u.targets || {}]));
  const st = groupStatus({
    members: g.members.map(m => ({ id: String(m.user), joined: m.joined })),
    targets, logs: logMap, savedDays: g.savedDays, today,
  });
  const sent = new Set(nudges.filter(n => String(n.from) === String(me)).map(n => String(n.to)));
  const members = g.members.map(m => {
    const id = String(m.user), isYou = id === String(me), done = st.done(id, today);
    return { id, name: byId[id]?.name || 'Member', isYou, done, canNudge: !isYou && !done && !sent.has(id) };
  });
  const received = nudges.filter(n => String(n.to) === String(me))
    .map(n => ({ kind: n.kind, from: byId[String(n.from)]?.name || 'A buddy' }));
  return { id: g._id, name: g.name, code: g.code, streak: st.streak, week: st.week, saveable: st.saveable,
    savesLeft: st.savesLeft, members, received };
}

const mine = (q, id) => Group.findOne({ _id: id, 'members.user': q.user });

// GET /api/groups?today=YYYY-MM-DD -> all my groups
r.get('/', async (q, s) => {
  try {
    const today = todayOf(q); if (!today) return s.status(400).json(NO_DATE);
    const gs = await Group.find({ 'members.user': q.user }).sort({ createdAt: 1 });
    s.json(await Promise.all(gs.map(g => view(g, q.user, today))));
  } catch (e) { fail(s, e); }
});

// POST /api/groups {name, today} -> create
r.post('/', async (q, s) => {
  try {
    const today = todayOf(q); if (!today) return s.status(400).json(NO_DATE);
    const name = String(q.body.name || '').trim();
    if (!name || name.length > 40) return s.status(400).json({ message: 'Group name must be 1–40 characters' });
    if (await Group.countDocuments({ 'members.user': q.user }) >= MAX_GROUPS)
      return s.status(400).json({ message: `You can be in up to ${MAX_GROUPS} groups` });
    for (let i = 0; i < 5; i++) {
      try {
        const g = await Group.create({ name, code: newCode(), members: [{ user: q.user, joined: today }] });
        return s.json(await view(g, q.user, today));
      } catch (e) { if (e.code !== 11000) throw e; } // code clash -> try another
    }
    s.status(500).json({ message: 'Could not create group, try again' });
  } catch (e) { fail(s, e); }
});

// POST /api/groups/join {code, today}
r.post('/join', async (q, s) => {
  try {
    const today = todayOf(q); if (!today) return s.status(400).json(NO_DATE);
    const g = await Group.findOne({ code: String(q.body.code || '').trim().toUpperCase() });
    if (!g) return s.status(404).json({ message: 'No group found with that code' });
    if (g.members.some(m => String(m.user) === String(q.user))) return s.status(409).json({ message: 'You are already in this group' });
    if (g.members.length >= MAX_MEMBERS) return s.status(400).json({ message: `This group is full (${MAX_MEMBERS} members)` });
    if (await Group.countDocuments({ 'members.user': q.user }) >= MAX_GROUPS)
      return s.status(400).json({ message: `You can be in up to ${MAX_GROUPS} groups` });
    g.members.push({ user: q.user, joined: today });
    await g.save();
    s.json(await view(g, q.user, today));
  } catch (e) { fail(s, e); }
});

// POST /api/groups/:id/nudge {to, kind, today}
r.post('/:id/nudge', async (q, s) => {
  try {
    const today = todayOf(q); if (!today) return s.status(400).json(NO_DATE);
    const { to, kind } = q.body;
    if (!['wave', 'water'].includes(kind)) return s.status(400).json({ message: 'Invalid nudge' });
    const g = await mine(q, q.params.id);
    if (!g) return s.status(404).json({ message: 'Group not found' });
    if (String(to) === String(q.user) || !g.members.some(m => String(m.user) === String(to)))
      return s.status(400).json({ message: 'Pick a buddy in this group' });
    try { await Nudge.create({ group: g._id, from: q.user, to, kind, date: today }); }
    catch (e) { if (e.code === 11000) return s.status(409).json({ message: 'You already nudged them today' }); throw e; }
    s.json(await view(g, q.user, today));
  } catch (e) { fail(s, e); }
});

// POST /api/groups/:id/save {today} -> forgive yesterday (max 2 per month, only if a streak is at stake)
r.post('/:id/save', async (q, s) => {
  try {
    const today = todayOf(q); if (!today) return s.status(400).json(NO_DATE);
    const g = await mine(q, q.params.id);
    if (!g) return s.status(404).json({ message: 'Group not found' });
    const v = await view(g, q.user, today);
    if (!v.saveable) return s.status(400).json({ message: 'There is nothing to save right now' });
    await Group.updateOne({ _id: g._id }, { $addToSet: { savedDays: v.saveable } });
    g.savedDays.push(v.saveable);
    s.json(await view(g, q.user, today));
  } catch (e) { fail(s, e); }
});

// DELETE /api/groups/:id -> leave (last one out deletes the group)
r.delete('/:id', async (q, s) => {
  try {
    const g = await mine(q, q.params.id);
    if (!g) return s.status(404).json({ message: 'Group not found' });
    if (g.members.length <= 1) { await g.deleteOne(); await Nudge.deleteMany({ group: g._id }); }
    else await Group.updateOne({ _id: g._id }, { $pull: { members: { user: q.user } } });
    s.json({ ok: true });
  } catch (e) { fail(s, e); }
});

export default r;

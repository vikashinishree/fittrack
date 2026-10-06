import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models.js';
import protect from '../middleware/auth.js';

const r = Router();
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => { const o = u.toObject(); delete o.password; return o; };
const fail = (res, e) => res.status(500).json({ message: e.message });

r.post('/signup', async (q, s) => {
  try {
    const { name, email, password } = q.body;
    if (!name || !email || !password || password.length < 6)
      return s.status(400).json({ message: 'Name, email and a password of 6+ characters are required' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return s.status(409).json({ message: 'That email is already registered' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    s.json({ token: sign(u), user: pub(u) });
  } catch (e) { fail(s, e); }
});

r.post('/login', async (q, s) => {
  try {
    const u = await User.findOne({ email: (q.body.email || '').toLowerCase() });
    if (!u || !(await bcrypt.compare(q.body.password || '', u.password)))
      return s.status(401).json({ message: 'Email or password is incorrect' });
    s.json({ token: sign(u), user: pub(u) });
  } catch (e) { fail(s, e); }
});

r.get('/me', protect, async (q, s) => {
  const u = await User.findById(q.user);
  u ? s.json(pub(u)) : s.status(404).json({ message: 'User not found' });
});

r.put('/me', protect, async (q, s) => {
  try {
    const upd = {};
    for (const k of ['name', 'age', 'gender', 'height', 'weight', 'targets'])
      if (q.body[k] !== undefined) upd[k] = q.body[k];
    s.json(pub(await User.findByIdAndUpdate(q.user, upd, { new: true })));
  } catch (e) { fail(s, e); }
});

export default r;

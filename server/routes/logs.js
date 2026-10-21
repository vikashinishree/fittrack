import { Router } from 'express';
import { Log } from '../models.js';
import protect from '../middleware/auth.js';

const r = Router();
r.use(protect);
const FIELDS = ['steps', 'caloriesIn', 'caloriesOut', 'water'];

// GET /api/logs?from=YYYY-MM-DD -> daily logs from that date onward
r.get('/', async (q, s) =>
  s.json(await Log.find({ user: q.user, date: { $gte: q.query.from || '0000-00-00' } }).sort({ date: 1 })));

// POST /api/logs/add {date, field, amount} -> adds to that day's total
r.post('/add', async (q, s) => {
  const { date, field, amount } = q.body;
  if (!FIELDS.includes(field) || !date || !Number.isFinite(+amount))
    return s.status(400).json({ message: 'Invalid entry' });
  s.json(await Log.findOneAndUpdate({ user: q.user, date }, { $inc: { [field]: +amount } }, { upsert: true, new: true }));
});

export default r;

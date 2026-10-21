import { Router } from 'express';
import { Workout } from '../models.js';
import protect from '../middleware/auth.js';

const r = Router();
r.use(protect);
const pick = b => ({ name: b.name, type: b.type, duration: +b.duration, calories: +b.calories, date: b.date });

r.get('/', async (q, s) => s.json(await Workout.find({ user: q.user }).sort({ date: -1 })));
r.post('/', async (q, s) => s.status(201).json(await Workout.create({ ...pick(q.body), user: q.user })));
r.put('/:id', async (q, s) => {
  const w = await Workout.findOneAndUpdate({ _id: q.params.id, user: q.user }, pick(q.body), { new: true });
  w ? s.json(w) : s.status(404).json({ message: 'Workout not found' });
});
r.delete('/:id', async (q, s) => {
  const w = await Workout.findOneAndDelete({ _id: q.params.id, user: q.user });
  w ? s.json({ ok: true }) : s.status(404).json({ message: 'Workout not found' });
});

export default r;

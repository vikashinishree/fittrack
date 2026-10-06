import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { day, sum } from '../api';
import { useAuth } from '../App.jsx';
import { Footprints, Flame, Droplets, Dumbbell, Trophy } from 'lucide-react';

function Bar({ v, max }) {
  return <div className="bar"><i style={{ width: Math.min(100, (v / max) * 100 || 0) + '%' }} /></div>;
}

function Quick({ label, unit, onAdd, onRemove }) {
  const [v, setV] = useState('');
  return (
    <div className="stack">
      <input type="number" min="0" placeholder={unit} value={v} onChange={e => setV(e.target.value)} />
      <button className="btn small" onClick={() => { onAdd(v); setV(''); }}>{label}</button>
      {onRemove && <button className="btn small alt" onClick={() => { onRemove(v); setV(''); }}>Remove</button>}
    </div>
  );
}

const local = s => new Date(s + 'T00:00:00');

function streaks(hit) {               // hit = Set of 'YYYY-MM-DD' days the goal was met
  let cur = 0;
  const d = new Date();
  if (!hit.has(day(d))) d.setDate(d.getDate() - 1);   // today isn't over yet
  while (hit.has(day(d))) { cur++; d.setDate(d.getDate() - 1); }

  let best = 0, run = 0, prev = null;
  [...hit].sort().forEach(s => {
    let next = null;
    if (prev) { next = local(prev); next.setDate(next.getDate() + 1); }
    run = next && day(next) === s ? run + 1 : 1;
    best = Math.max(best, run);
    prev = s;
  });
  return { cur, best };
}

export default function DashboardHome() {
  const { user } = useAuth();
  const t = user.targets, today = day();
  const [log, setLog] = useState({});
  const [ws, setWs] = useState([]);
  const [warn, setWarn] = useState('');
  const [hist, setHist] = useState([]);

  const load = () => {
  const from = new Date();
  from.setDate(from.getDate() - 89);
  api.get('/logs', { params: { from: day(from) } }).then(r => {
    setHist(r.data);
    setLog(r.data.find(l => l.date === today) || {});
  });
  api.get('/workouts').then(r => setWs(r.data));
};
  useEffect(load, []);
 
    const add = async (field, amount) => {
    if (!+amount) return;
    if (field === 'steps' && !user.weight) {
      setWarn('Add your weight in Profile first so we can estimate calories burnt from your steps.');
      return;
    }
    setWarn('');
    await api.post('/logs/add', { date: today, field, amount: +amount });
    if (field === 'steps') {
      await api.post('/logs/add', { date: today, field: 'caloriesOut', amount: Math.round(+amount * user.weight * 0.0005) });
    }
    load();
  };

  const remove = async amount => {
    const n = Math.min(+amount, log.steps || 0); // can't remove more than logged
    if (!(n > 0)) return;
    if (!user.weight) {
      setWarn('Add your weight in Profile first so we can adjust calories burnt.');
      return;
    }
    setWarn('');
    const kcal = Math.min(Math.round(n * user.weight * 0.0005), log.caloriesOut || 0);
    await api.post('/logs/add', { date: today, field: 'steps', amount: -n });
    if (kcal > 0) await api.post('/logs/add', { date: today, field: 'caloriesOut', amount: -kcal });
    load();
  };

  const todays = ws.filter(w => day(new Date(w.date)) === today);
  const burnt = (log.caloriesOut || 0) + sum(todays, 'calories');

  return (
    <div className="grid">
      <section className="card">
        <h3><Footprints size={18} /> Steps</h3>
        <p className="big">{log.steps || 0}<small> / {t.steps}</small></p>
        <Bar v={log.steps} max={t.steps} />
        <Quick label="Add steps" unit="steps" onAdd={v => add('steps', v)} onRemove={remove} />
        {warn && <p className="err">{warn} <Link to="/dashboard/profile">Go to Profile</Link></p>} 
      </section>
      <section className="card">
        <h3><Flame size={18} /> Calories</h3>
        <p className="big">{log.caloriesIn || 0}<small> eaten · {burnt} burnt</small></p>
        <Bar v={log.caloriesIn} max={t.calories} />
        <Quick label="Add intake" unit="kcal eaten" onAdd={v => add('caloriesIn', v)} />
        <Quick label="Add burnt" unit="kcal burnt" onAdd={v => add('caloriesOut', v)} />
      </section>
      <section className="card">
        <h3><Droplets size={18} /> Water</h3>
        <p className="big">{log.water || 0}<small> / {t.water} glasses</small></p>
        <Bar v={log.water} max={t.water} />
        <div className="stack">
        <button className="btn small" onClick={() => add('water', 1)}>+1 glass</button>
        <button className="btn small alt" disabled={!log.water} onClick={() => add('water', -1)}>−1 glass</button>
        </div>
      </section>
      <section className="card wide">
  <h3><Dumbbell size={18} /> Workout summary</h3>
  <div className="stats">
    <div><b>{todays.length}</b><span>workouts today</span></div>
    <div><b>{sum(todays, 'duration')}</b><span>minutes</span></div>
    <div><b>{sum(todays, 'calories')}</b><span>kcal burnt</span></div>
  <section className="card wide">
  <h3><Trophy size={18} /> Streaks</h3>
  <div className="stats">
    {[
      ['Steps goal', new Set(hist.filter(l => l.steps >= t.steps).map(l => l.date))],
      ['Water goal', new Set(hist.filter(l => l.water >= t.water).map(l => l.date))],
      ['Workout days', new Set(ws.map(w => day(new Date(w.date))))],
    ].map(([label, hit]) => {
      const s = streaks(hit);
      return <div key={label}><b>{s.cur} {s.cur === 1 ? 'day' : 'days'}</b><span>{label} · best {s.best}</span></div>;
    })}
  </div>
</section>  
  </div>
  {todays.length ? (
    <div className="chips">
      {todays.map(w => <span key={w._id}>{w.name} · {w.duration} min</span>)}
    </div>
  ) : <p>No workouts yet. Add one in Workouts.</p>}
</section> 
    </div>
  );
}

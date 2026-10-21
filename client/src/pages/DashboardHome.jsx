import { useEffect, useState } from 'react';
import { Footprints, Flame, Droplets, Dumbbell } from 'lucide-react';
import api, { day, sum } from '../api';
import { useAuth } from '../App.jsx';

function Bar({ v, max }) {
  return <div className="bar"><i style={{ width: Math.min(100, (v / max) * 100 || 0) + '%' }} /></div>;
}

function Quick({ label, unit, onAdd }) {
  const [v, setV] = useState('');
  return (
    <div className="row">
      <input type="number" min="0" placeholder={unit} value={v} onChange={e => setV(e.target.value)} />
      <button className="btn small" onClick={() => { onAdd(v); setV(''); }}>{label}</button>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const t = user.targets, today = day();
  const [log, setLog] = useState({});
  const [ws, setWs] = useState([]);

  const load = () => {
    api.get('/logs', { params: { from: today } }).then(r => setLog(r.data[0] || {}));
    api.get('/workouts').then(r => setWs(r.data));
  };
  useEffect(load, []);
  const add = async (field, amount) => { if (+amount) { await api.post('/logs/add', { date: today, field, amount: +amount }); load(); } };

  const todays = ws.filter(w => day(new Date(w.date)) === today);
  const burnt = (log.caloriesOut || 0) + sum(todays, 'calories');

  return (
    <div className="grid">
      <section className="card">
        <h3><Footprints size={18} /> Steps</h3>
        <p className="big">{log.steps || 0}<small> / {t.steps}</small></p>
        <Bar v={log.steps} max={t.steps} />
        <Quick label="Add steps" unit="steps" onAdd={v => add('steps', v)} />
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
        <div className="row"><button className="btn small" onClick={() => add('water', 1)}>+1 glass</button>
          <button className="btn small alt" onClick={() => add('water', -1)}>−1</button></div>
      </section>
      <section className="card">
        <h3><Dumbbell size={18} /> Workout summary</h3>
        <p className="big">{todays.length}<small> today · {sum(todays, 'duration')} min · {sum(todays, 'calories')} kcal</small></p>
        {todays.length ? todays.map(w => <p key={w._id}>{w.name} — {w.duration} min</p>) : <p>No workouts yet. Add one in Workouts.</p>}
      </section>
    </div>
  );
}

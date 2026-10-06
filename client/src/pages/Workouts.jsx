import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api, { day, errMsg } from '../api';

const TYPES = ['Cardio', 'Strength', 'Yoga', 'HIIT', 'Sports', 'Other'];
const blank = () => ({ name: '', type: 'Cardio', duration: '', calories: '', date: day() });

export default function Workouts() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(blank());
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.get('/workouts').then(r => setList(r.data));
  useEffect(() => { load(); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const save = async e => {
    e.preventDefault(); setErr('');
    try {
      editing ? await api.put('/workouts/' + editing, f) : await api.post('/workouts', f);
      setF(blank()); setEditing(null); load();
    } catch (x) { setErr(errMsg(x)); }
  };
  const edit = w => { setEditing(w._id); setF({ ...w, date: day(new Date(w.date)) }); window.scrollTo(0, 0); };
  const del = async id => { if (confirm('Delete this workout?')) { await api.delete('/workouts/' + id); load(); } };

  return (
    <>
      <form className="card form" onSubmit={save}>
        <h3>{editing ? 'Edit workout' : 'Add workout'}</h3>
        <input placeholder="Name (e.g. Morning run)" value={f.name} onChange={set('name')} required />
        <select value={f.type} onChange={set('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <input type="number" min="1" placeholder="Minutes" value={f.duration} onChange={set('duration')} required />
        <input type="number" min="0" placeholder="Calories burnt" value={f.calories} onChange={set('calories')} required />
        <input type="date" value={f.date} onChange={set('date')} required />
        {err && <p className="err">{err}</p>}
        <div className="row"><button className="btn">{editing ? 'Save changes' : 'Add workout'}</button>
          {editing && <button type="button" className="btn alt" onClick={() => { setEditing(null); setF(blank()); }}>Cancel</button>}</div>
      </form>
      <section className="card">
        <h3>Your workouts</h3>
        {!list.length && <p>No workouts yet. Add your first one above.</p>}
        {list.map(w => (
          <div className="item" key={w._id}>
            <div><b>{w.name}</b><br /><small>{w.type} · {w.duration} min · {w.calories} kcal · {day(new Date(w.date))}</small></div>
            <div className="row"><button className="icon" aria-label="Edit" onClick={() => edit(w)}><Pencil size={16} /></button>
              <button className="icon" aria-label="Delete" onClick={() => del(w._id)}><Trash2 size={16} /></button></div>
          </div>
        ))}
      </section>
    </>
  );
}

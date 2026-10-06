import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../App.jsx';


const Field = ({ label, children }) => <label>{label}{children}</label>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ ...user, targets: { ...user.targets } });
  const [msg, setMsg] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const tset = k => e => setF({ ...f, targets: { ...f.targets, [k]: +e.target.value } });
  const save = async e => {
    e.preventDefault();
    try { setUser((await api.put('/auth/me', f)).data); setMsg('Saved'); } catch (x) { setMsg(errMsg(x)); }
  };

  return (
    <form className="grid" onSubmit={save}>
      <section className="card form">
        <h3>Personal details</h3>
        <Field label="Name"><input value={f.name || ''} onChange={set('name')} required /></Field>
        <Field label="Age"><input type="number" value={f.age || ''} onChange={set('age')} /></Field>
        <Field label="Gender"><select value={f.gender || ''} onChange={set('gender')}>
          <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></Field>
        <Field label="Height (cm)"><input type="number" value={f.height || ''} onChange={set('height')} /></Field>
        <Field label="Weight (kg)"><input type="number" value={f.weight || ''} onChange={set('weight')} /></Field>
      </section>
      <section className="card form">
        <h3>Fitness targets</h3>
        <Field label="Daily steps"><input type="number" min="1" value={f.targets.steps} onChange={tset('steps')} /></Field>
        <Field label="Daily calories (kcal)"><input type="number" min="1" value={f.targets.calories} onChange={tset('calories')} /></Field>
        <Field label="Water (glasses)"><input type="number" min="1" value={f.targets.water} onChange={tset('water')} /></Field>
        <button className="btn">Save changes</button>
        {msg && <p>{msg}</p>}
      </section>
    </form>
  );
}

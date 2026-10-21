import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../App.jsx';
import { rules, allPassed } from '../passwordRules';

export function Home() {
  return (
    <div className="home">
      <div className="logo">FitTrack</div>
      <h1 className="hero">Every step, sip and set, counted.</h1>
      <p>Log your steps, calories, water and workouts in one place, then watch the week add up.</p>
      <div className="row"><Link className="btn" to="/signup">Create account</Link><Link className="btn alt" to="/login">Log in</Link></div>
    </div>
  );
}

export function AuthForm({ mode }) {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const signup = mode === 'signup';
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const checks = rules(f);
  const submit = async e => {
    e.preventDefault(); setErr('');
    if (signup && !allPassed(checks)) return setErr('Please meet all the password requirements below');
    try { login((await api.post('/auth/' + mode, f)).data); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form className="auth card" onSubmit={submit}>
      <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
      {signup && <input placeholder="Name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required />
      {signup && (
        <ul className="pw-rules">
          {checks.map(c => <li key={c.label} className={c.ok ? 'ok' : ''}>{c.ok ? '✓' : '○'} {c.label}</li>)}
        </ul>
      )}
      {err && <p className="err">{err}</p>}
      <button className="btn">{signup ? 'Sign up' : 'Log in'}</button>
      <p>{signup ? <>Have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Sign up</Link></>}</p>
    </form>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../App.jsx';
import { Footprints, LineChart, Trophy, Flame } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

export function Home() {
  const rings = [['Steps', 7420, 10000, '#2F5BFF'], ['Water', 6, 8, '#4AA3C7'], ['Calories', 1650, 2000, '#F2A33A']];
  const perks = [
    [Footprints, 'Log your day', 'Steps, meals, water and workouts, added in seconds.'],
    [LineChart, 'See your week', 'Charts show which days you hit your targets and which you missed.'],
    [Trophy, 'Keep streaks', 'Build runs of days in a row and try to beat your best.'],
  ];
  return (
    <div className="land">
      <header className="l-nav">
  <span className="logo">FitTrack</span>
  <ThemeToggle />
</header>

      <section className="l-hero">
        <div>
          <h1>Every step, sip and set, counted.</h1>
          <p className="l-sub">Log your day in under a minute, then watch your week add up against the goals you set.</p>
          <div className="row">
            <Link className="btn" to="/signup">Create account</Link>
            <Link className="btn alt" to="/login">Log in</Link>
           </div>
        </div>

        <div className="l-panel">
          <div className="l-card">
            <p className="l-day">Today</p>
            <div className="l-rings">
              {rings.map(([name, v, max, color]) => (
                <div key={name} className="ring" style={{ '--p': Math.round((v / max) * 100), '--c': color }}>
                  <b>{v}</b><span>{name}</span>
                </div>
              ))}
            </div>
            <div className="l-streak"><Flame size={16} /> 5-day steps streak</div>
          </div>
        </div>
      </section>

      <section className="l-perks">
        {perks.map(([Icon, title, text]) => (
          <div key={title}><Icon size={22} /><h3>{title}</h3><p>{text}</p></div>
        ))}
      </section>
    </div>
  );
}

export function AuthForm({ mode }) {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const signup = mode === 'signup';
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    try { login((await api.post('/auth/' + mode, f)).data); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form className="auth card" onSubmit={submit}>
      <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
      {signup && <input placeholder="Name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
      {err && <p className="err">{err}</p>}
      <button className="btn">{signup ? 'Sign up' : 'Log in'}</button>
      <p>{signup ? <>Have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Sign up</Link></>}</p>
    </form>
  );
}

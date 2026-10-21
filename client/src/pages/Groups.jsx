import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import api, { day, errMsg } from '../api';

const DOT = { done: '✓', saved: '🛟', missed: '✕', pending: '·', none: '' };
const MSG = { wave: 'is cheering you on 👋', water: 'says: have some water 💧' };

function GroupCard({ g, act, leave }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(g.code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const left = g.members.filter(m => !m.done).length;
  return (
    <section className="card">
      <div className="row between">
        <h3>{g.name}</h3>
        <button className="icon" onClick={copy} title="Copy invite code">{copied ? 'Copied!' : 'Code: ' + g.code}</button>
      </div>

      {g.received.map((n, i) => <p key={i} className="nudge-in">{n.from} {MSG[n.kind]}</p>)}

      <p className="big"><Flame size={28} color="#E8590C" /> {g.streak}<small> day streak{g.streak ? '' : ' — start it today!'}</small></p>
      <p className="muted">{left === 0 ? 'Everyone is done today 🎉' : `${left} of ${g.members.length} still to finish today`}</p>

      <div className="week">
        {g.week.map(w => <span key={w.date} className={'dot ' + w.status} title={w.date + ' · ' + w.status}>{DOT[w.status]}</span>)}
      </div>

      {g.saveable && (
        <div className="save-box">
          <p>Yesterday was missed. Use a streak save to keep the streak alive? ({g.savesLeft} left this month)</p>
          <button className="btn small" onClick={() => act(g.id, 'save')}>🛟 Save our streak</button>
        </div>
      )}

      <div className="members">
        {g.members.map(m => (
          <div className="item" key={m.id}>
            <span>{m.name}{m.isYou && ' (you)'}</span>
            <span className="row">
              <b className={m.done ? 'ok' : 'muted'}>{m.done ? '✓ done' : 'not yet'}</b>
              {m.canNudge && <>
                <button className="icon" title="Cheer" onClick={() => act(g.id, 'nudge', { to: m.id, kind: 'wave' })}>👋</button>
                <button className="icon" title="Remind to drink water" onClick={() => act(g.id, 'nudge', { to: m.id, kind: 'water' })}>💧</button>
              </>}
            </span>
          </div>
        ))}
      </div>
      <p className="muted small-note">A day counts when someone hits their own steps and water goals. Buddies only see done / not yet, never your numbers.</p>
      <button className="ghost dark" onClick={() => leave(g)}>Leave group</button>
    </section>
  );
}

export default function Groups() {
  const today = day();
  const [groups, setGroups] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get('/groups', { params: { today } }).then(r => setGroups(r.data)).catch(x => setErr(errMsg(x)));
  useEffect(() => { load(); }, []);

  const run = async fn => { setErr(''); try { await fn(); await load(); } catch (x) { setErr(errMsg(x)); } };
  const create = e => { e.preventDefault(); run(async () => { await api.post('/groups', { name, today }); setName(''); }); };
  const join = e => { e.preventDefault(); run(async () => { await api.post('/groups/join', { code, today }); setCode(''); }); };
  const act = (id, what, body = {}) => run(() => api.post(`/groups/${id}/${what}`, { ...body, today }));
  const leave = g => { if (confirm(`Leave "${g.name}"?`)) run(() => api.delete('/groups/' + g.id)); };

  return (
    <div>
      <p className="muted">Buddy Streaks: build a streak together. It grows only on days when everyone finishes their own goals.</p>
      {err && <p className="err">{err}</p>}
      <div className="grid">
        <form className="card form" onSubmit={create}>
          <h3>Start a group</h3>
          <input placeholder="Group name (e.g. Family Fit)" value={name} maxLength={40} onChange={e => setName(e.target.value)} required />
          <button className="btn">Create group</button>
        </form>
        <form className="card form" onSubmit={join}>
          <h3>Join with a code</h3>
          <input placeholder="6-letter code" value={code} maxLength={6} onChange={e => setCode(e.target.value.toUpperCase())} required />
          <button className="btn alt">Join group</button>
        </form>
      </div>
      <div className="grid" style={{ marginTop: '1rem' }}>
        {groups?.map(g => <GroupCard key={g.id} g={g} act={act} leave={leave} />)}
      </div>
      {groups && !groups.length && <p className="muted">You are not in a group yet. Create one and share its code with friends or family (up to 6 people).</p>}
    </div>
  );
}

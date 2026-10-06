import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import api, { day } from '../api';
import { useAuth } from '../App.jsx';
import { Trophy } from 'lucide-react';

function Chart({ title, children }) {
  return <section className="card"><h3>{title}</h3><div style={{ height: 220 }}><ResponsiveContainer>{children}</ResponsiveContainer></div></section>;
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

export default function Progress() {
  const { user } = useAuth();
  const t = user.targets;
  const [hist, setHist] = useState([]);
  const [ws, setWs] = useState([]);
  const [data, setData] = useState([]);
  useEffect(() => {
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const from = new Date();
    from.setDate(from.getDate() - 89);
    api.get('/workouts').then(r => setWs(r.data));
    api.get('/logs', { params: { from: day(from) } }).then(r => {
      setHist(r.data);
      const by = Object.fromEntries(r.data.map(l => [l.date, l]));
      setData(days.map(d => ({ label: d.toLocaleDateString('en', { weekday: 'short' }), steps: 0, caloriesIn: 0, caloriesOut: 0, water: 0, ...by[day(d)] })));
    });
  }, []);
  const axes = <><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip /></>;

  return (
    <div className="grid">
      <Chart title="Weekly steps"><BarChart data={data}>{axes}<Bar dataKey="steps" fill="#2F5BFF" radius={[4, 4, 0, 0]} /></BarChart></Chart>
      <Chart title="Calories"><LineChart data={data}>{axes}<Legend />
        <Line dataKey="caloriesIn" name="Eaten" stroke="#3FA37F" strokeWidth={2} />
        <Line dataKey="caloriesOut" name="Burnt" stroke="#F2A33A" strokeWidth={2} /></LineChart></Chart>
      <Chart title="Water (glasses)"><BarChart data={data}>{axes}<Bar dataKey="water" fill="#4AA3C7" radius={[4, 4, 0, 0]} /></BarChart></Chart>
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
  );
}

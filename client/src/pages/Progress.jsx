import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import api, { day } from '../api';
import { useAuth } from '../App.jsx';

function Chart({ title, children }) {
  return <section className="card"><h3>{title}</h3><div style={{ height: 220 }}><ResponsiveContainer>{children}</ResponsiveContainer></div></section>;
}

export default function Progress() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  useEffect(() => {
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    api.get('/logs', { params: { from: day(days[0]) } }).then(r => {
      const by = Object.fromEntries(r.data.map(l => [l.date, l]));
      setData(days.map(d => ({ label: d.toLocaleDateString('en', { weekday: 'short' }), steps: 0, caloriesIn: 0, caloriesOut: 0, water: 0, ...by[day(d)] })));
    });
  }, []);
  const avg = k => Math.round(data.reduce((n, d) => n + d[k], 0) / (data.length || 1));
  const t = user.targets;
  const goals = [['Steps', 'steps', t.steps], ['Calories eaten', 'caloriesIn', t.calories], ['Water (glasses)', 'water', t.water]];
  const axes = <><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip /></>;

  return (
    <div className="grid">
      <Chart title="Weekly steps"><BarChart data={data}>{axes}<Bar dataKey="steps" fill="#2F5BFF" radius={[4, 4, 0, 0]} /></BarChart></Chart>
      <Chart title="Calories"><LineChart data={data}>{axes}<Legend />
        <Line dataKey="caloriesIn" name="Eaten" stroke="#3FA37F" strokeWidth={2} /> 
        <Line dataKey="caloriesOut" name="Burnt" stroke="#F2A33A" strokeWidth={2} /></LineChart></Chart>
      <Chart title="Water (glasses)"><BarChart data={data}>{axes}<Bar dataKey="water" fill="#4AA3C7" radius={[4, 4, 0, 0]} /></BarChart></Chart>
      <section className="card">
        <h3>Goals — 7-day average vs target</h3>
        {goals.map(([label, k, target]) => (
          <div key={k}><p>{label}: {avg(k)} / {target}</p>
            <div className="bar"><i style={{ width: Math.min(100, (avg(k) / target) * 100) + '%' }} /></div></div>
        ))}
      </section>
    </div>
  );
}

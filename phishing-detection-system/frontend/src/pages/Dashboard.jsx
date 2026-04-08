import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const { user, getToken } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/predict/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null));
  }, [getToken]);

  const cards = [
    {
      to: '/predict',
      title: 'Scan URL',
      desc: 'Enter a URL to get real-time phishing risk assessment with quantum-enhanced ML.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      accent: 'cyan',
    },
    {
      to: '/history',
      title: 'Prediction History',
      desc: 'View your past scans and results with confidence scores.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'violet',
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="page-heading">DASHBOARD</h1>
      <p className="page-subheading">
        Welcome back, <span className="text-cyan-400 font-medium">{user?.name}</span>.
      </p>

      <div className="grid gap-4 md:grid-cols-4 max-w-5xl mb-8">
        <div className="cyber-panel p-5">
          <p className="text-slate-500 text-sm">Total Scans</p>
          <p className="text-2xl font-bold text-cyan-400 font-mono">{stats?.totalPredictions ?? '-'}</p>
        </div>
        <div className="cyber-panel p-5">
          <p className="text-slate-500 text-sm">Phishing</p>
          <p className="text-2xl font-bold text-phishing font-mono">{stats?.phishingCount ?? '-'}</p>
        </div>
        <div className="cyber-panel p-5">
          <p className="text-slate-500 text-sm">Legitimate</p>
          <p className="text-2xl font-bold text-safe font-mono">{stats?.legitimateCount ?? '-'}</p>
        </div>
        <div className="cyber-panel p-5">
          <p className="text-slate-500 text-sm">Avg Confidence</p>
          <p className="text-2xl font-bold text-cyan-300 font-mono">
            {stats ? `${Math.round((stats.avgConfidence || 0) * 100)}%` : '-'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl stagger-children">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="cyber-panel p-8 md:p-10 block group hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className={`inline-flex p-3 rounded-xl mb-4 ${
                c.accent === 'cyan'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-violet-500/20 text-violet-400'
              } group-hover:shadow-cyber transition-shadow duration-300`}
            >
              {c.icon}
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors">
              {c.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
            <span className="inline-flex items-center gap-1 mt-4 text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Open
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      <div className="cyber-panel p-6 md:p-8 mt-8 max-w-5xl">
        <h2 className="font-display text-lg text-cyan-400 mb-4">Weekly Scan Trend</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.weeklyTrend || []}>
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="phishing" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="legitimate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

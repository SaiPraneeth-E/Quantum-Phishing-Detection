import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function History() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { getToken } = useAuth();
  const headers = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    axios
      .get(`${API}/api/predict/history`, { headers })
      .then(({ data }) => setList(data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [getToken]);

  const deleteItem = async (id) => {
    try {
      await axios.delete(`${API}/api/predict/history/${id}`, { headers });
      setList((prev) => prev.filter((x) => x._id !== id));
    } catch {
      // no-op UI fallback
    }
  };

  const exportCsv = () => {
    const rows = [
      ['URL', 'Prediction', 'Confidence', 'Timestamp'],
      ...filtered.map((r) => [
        r.inputUrl,
        r.prediction,
        `${Math.round(r.confidence * 100)}%`,
        new Date(r.timestamp).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediction-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = list.filter((row) => {
    const matchesQuery = row.inputUrl.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' ? true : row.prediction === filter;
    return matchesQuery && matchesFilter;
  });

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-500/50 border-t-cyan-400 animate-spin" />
          <p className="text-slate-500">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="page-heading">
        SCAN <span className="text-cyan-400">HISTORY</span>
      </h1>
      <p className="page-subheading">Past URL scans and verdicts</p>

      <div className="cyber-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="cyber-input flex-1"
            placeholder="Search by URL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="cyber-input max-w-[220px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="phishing">Phishing</option>
            <option value="legitimate">Legitimate</option>
          </select>
          <button type="button" className="cyber-btn text-white md:min-w-[140px]" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="cyber-panel p-12 md:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-slate-800 flex items-center justify-center text-slate-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500">No predictions yet.</p>
          <p className="text-slate-600 text-sm mt-1">Run a scan from the Predict page.</p>
        </div>
      ) : (
        <div className="cyber-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cyber-table w-full text-left">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-slate-800/50">
                  <th className="px-5 py-4 text-cyan-400/90 font-display text-sm font-medium">URL</th>
                  <th className="px-5 py-4 text-cyan-400/90 font-display text-sm font-medium">Result</th>
                  <th className="px-5 py-4 text-cyan-400/90 font-display text-sm font-medium">Confidence</th>
                  <th className="px-5 py-4 text-cyan-400/90 font-display text-sm font-medium">Date</th>
                  <th className="px-5 py-4 text-cyan-400/90 font-display text-sm font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row._id}
                    className="border-b border-slate-700/50"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-5 py-4 text-slate-300 font-mono text-sm truncate max-w-xs">
                      {row.inputUrl}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${
                          row.prediction === 'phishing'
                            ? 'bg-phishing/20 text-phishing border border-phishing/40'
                            : 'bg-safe/20 text-safe border border-safe/40'
                        }`}
                      >
                        {row.prediction}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-cyan-400 font-mono text-sm">
                      {Math.round(row.confidence * 100)}%
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-phishing border-phishing/40 hover:bg-phishing/10"
                        onClick={() => deleteItem(row._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

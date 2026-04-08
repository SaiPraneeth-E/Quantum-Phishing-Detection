import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || '';

export default function Predict() {
  const [url, setUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkResults, setBulkResults] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const { getToken } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/predict`,
        { url: url.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResult(data);
      addToast(
        data.prediction === 'phishing' ? 'Threat detected.' : 'URL appears safe.',
        data.prediction === 'phishing' ? 'error' : 'success'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Prediction failed';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPhishing = result?.prediction === 'phishing';
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBulkLoading(true);
    setBulkResults([]);
    try {
      const urls = bulkText
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      const { data } = await axios.post(
        `${API}/api/predict/bulk`,
        { urls },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setBulkResults(data.results || []);
      addToast(`Bulk scan complete (${data.count}).`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Bulk prediction failed';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="page-heading">
        URL <span className="text-cyan-400">SCANNER</span>
      </h1>
      <p className="page-subheading">Real-time phishing detection with quantum-enhanced ML</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="cyber-panel p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid bg-[size:30px_30px] opacity-50 pointer-events-none" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-cyan-500/50 border-t-cyan-400 animate-spin" />
                <p className="font-display text-cyan-400 text-sm tracking-wider">SCANNING...</p>
                <p className="text-slate-500 text-xs mt-1">Analyzing URL with quantum pipeline</p>
              </div>
            </div>
          )}
          <div className="relative">
            <label className="block text-cyan-400/90 text-sm font-medium mb-2">Enter URL to analyze</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="cyber-input flex-1"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="cyber-btn text-white font-display tracking-wide whitespace-nowrap sm:min-w-[140px]"
              >
                {loading ? 'Scanning' : 'Scan'}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="px-4 py-3 rounded-lg bg-phishing/10 border border-phishing/50 text-phishing text-sm animate-fade-in">
            {error}
          </div>
        )}
      </form>

      <form onSubmit={handleBulkSubmit} className="space-y-5 mt-8">
        <div className="cyber-panel p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid bg-[size:30px_30px] opacity-50 pointer-events-none" />
          <div className="relative">
            <label className="block text-cyan-400/90 text-sm font-medium mb-2">
              Bulk URL Scan (one URL per line, max 50)
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="cyber-input min-h-[160px]"
              placeholder={'https://example1.com\nhttps://example2.com'}
              disabled={bulkLoading}
              required
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={bulkLoading}
                className="cyber-btn text-white font-display tracking-wide whitespace-nowrap sm:min-w-[170px]"
              >
                {bulkLoading ? 'Bulk scanning...' : 'Run Bulk Scan'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {bulkResults.length > 0 && (
        <div className="mt-6 cyber-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cyber-table w-full text-left">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-slate-800/50">
                  <th className="text-cyan-400/90 font-display text-sm font-medium">URL</th>
                  <th className="text-cyan-400/90 font-display text-sm font-medium">Result</th>
                  <th className="text-cyan-400/90 font-display text-sm font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {bulkResults.map((r, idx) => (
                  <tr key={`${r.inputUrl}-${idx}`} className="border-b border-slate-700/50">
                    <td className="text-slate-300 font-mono text-sm truncate max-w-xs">{r.inputUrl}</td>
                    <td>
                      {r.error ? (
                        <span className="text-phishing text-sm">{r.error}</span>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${r.prediction === 'phishing'
                            ? 'bg-phishing/20 text-phishing border border-phishing/40'
                            : 'bg-safe/20 text-safe border border-safe/40'
                          }`}>
                          {r.prediction}
                        </span>
                      )}
                    </td>
                    <td className="text-cyan-400 font-mono text-sm">
                      {typeof r.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`mt-8 cyber-panel p-8 animate-fade-in-up relative overflow-hidden ${isPhishing ? 'border-phishing/40' : 'border-safe/40'
            }`}
        >
          <div
            className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${isPhishing ? 'bg-phishing' : 'bg-safe'
              }`}
          />
          <div className="relative">
            <p className="text-slate-500 text-sm mb-1">VERDICT</p>
            <div className="flex items-center gap-4 mb-4">
              <p
                className={`font-display text-3xl font-bold ${isPhishing ? 'text-phishing' : 'text-safe'
                  }`}
              >
                {isPhishing ? 'PHISHING' : 'LEGITIMATE'}
              </p>
              {isPhishing ? (
                <span className="px-3 py-1 rounded-lg bg-phishing/20 text-phishing text-sm font-medium border border-phishing/40">
                  Risk detected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-safe/20 text-safe text-sm font-medium border border-safe/40">
                  Safe
                </span>
              )}
            </div>
            <p className="text-slate-400 mb-4">Confidence: <span className="font-mono text-cyan-400">{confidencePct}%</span></p>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mb-6">
              <div
                className={`risk-meter-fill h-full rounded-full ${isPhishing ? 'bg-phishing shadow-phishing-glow' : 'bg-safe shadow-safe-glow'
                  }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>

            {/* Risk Factors */}
            {result.riskFactors && result.riskFactors.length > 0 && (
              <div className="mt-4 border-t border-slate-700/50 pt-4 animate-fade-in">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Risk Analysis</p>
                <div className="grid gap-2">
                  {result.riskFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <span className="text-phishing mt-0.5">⚠</span>
                      <span className="text-slate-300 text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

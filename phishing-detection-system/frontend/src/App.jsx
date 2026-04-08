import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CyberBackground from './components/CyberBackground';
import QuantumSimulation from './components/QuantumSimulation';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <CyberBackground variant="grid" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl border-2 border-cyan-500/50 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-xl bg-cyan-500/10 animate-pulse" />
          </div>
          <p className="font-display text-cyan-400/80 text-sm tracking-widest">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
          <Route path="/admin/login" element={user?.role === 'admin' ? <Navigate to="/admin" /> : <Login isAdmin />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/predict" element={<ProtectedRoute><Layout><Predict /></Layout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute admin><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute admin><Layout><Analytics /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex relative">
      <CyberBackground variant="grid" />
      <QuantumSimulation fixed={true} />
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col relative z-10 min-h-screen">
        <Navbar user={user} />
        <main className="flex-1 p-6 md:p-8 overflow-auto max-w-7xl w-full mx-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default App;

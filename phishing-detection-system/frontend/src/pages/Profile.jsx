import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || '';

export default function Profile() {
  const { user, getToken, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const { data } = await axios.patch(`${API}/api/auth/profile`, { name }, { headers });
      updateUser({ name: data.name });
      addToast('Profile updated.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    try {
      await axios.patch(
        `${API}/api/auth/password`,
        { currentPassword, newPassword },
        { headers }
      );
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="page-heading">PROFILE & SETTINGS</h1>
      <p className="page-subheading">Manage account details and password.</p>

      <div className="cyber-panel p-6 md:p-8 mb-6">
        <h2 className="font-display text-lg text-cyan-400 mb-4">Account Info</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input className="cyber-input" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              className="cyber-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button className="cyber-btn text-white" disabled={loadingProfile}>
            {loadingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="cyber-panel p-6 md:p-8">
        <h2 className="font-display text-lg text-cyan-400 mb-4">Change Password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              className="cyber-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">New Password</label>
            <input
              type="password"
              className="cyber-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button className="cyber-btn text-white" disabled={loadingPassword}>
            {loadingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}


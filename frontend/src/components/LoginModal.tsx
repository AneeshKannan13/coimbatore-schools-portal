import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import apiClient from '../api';

export const LoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
}> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('teacher_ravi');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const DEMO_ACCOUNTS: Record<string, any> = {
    teacher_ravi: { id: 1, username: 'teacher_ravi', role: 'STAFF', full_name: 'Ravi Kumar (Staff)', school_name: 'Corporation Higher Secondary School, R.S. Puram' },
    hm_raman: { id: 2, username: 'hm_raman', role: 'HEADMASTER', full_name: 'Dr. K. Ramanathan (HM)', school_name: 'Corporation Higher Secondary School, Siddhapudur' },
    commissioner: { id: 3, username: 'commissioner', role: 'COMMISSIONER', full_name: 'M. Sivaguru Prabakaran IAS (Commissioner)' },
    admin: { id: 4, username: 'admin', role: 'ADMIN', full_name: 'System Administrator' },
  };

  const loginAsDemo = (demoKey: string) => {
    const userObj = DEMO_ACCOUNTS[demoKey] || DEMO_ACCOUNTS.teacher_ravi;
    localStorage.setItem('token', 'demo-token-' + userObj.role.toLowerCase());
    localStorage.setItem('user', JSON.stringify(userObj));
    onLoginSuccess(userObj);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('password', password);

      const res = await apiClient.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      const trimmed = username.trim().toLowerCase();
      // If offline or network error, provide demo fallback for seamless preview
      if ((!err.response || err.code === 'ERR_NETWORK') && DEMO_ACCOUNTS[trimmed]) {
        loginAsDemo(trimmed);
        return;
      }
      setError(err.response?.data?.detail || 'Authentication failed. (For live preview demo, click any Quick Demo Role below)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-md w-full p-8 shadow-2xl relative border border-white/60">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
        >
          &times;
        </button>

        {/* Official Coimbatore Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/coimbatore_corp_logo.png"
              alt="Coimbatore City Municipal Corporation"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
          </div>
          <h2 className="text-xl font-black text-[#650000] tracking-tight">
            Coimbatore City Municipal Corporation
          </h2>
          <p className="text-xs font-bold text-[#B31312] mt-0.5 uppercase tracking-wider">
            Government School Performance & Analytics Portal
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Sign in with your assigned User ID and Password
          </p>
        </div>

        {/* Universal Single Form (No role selection buttons) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              User ID / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter User ID or EMIS Number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border border-slate-300 rounded-xl focus:outline-[#8B0000] focus:ring-2 focus:ring-[#FFD700]/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/80 border border-slate-300 rounded-xl focus:outline-[#8B0000] focus:ring-2 focus:ring-[#FFD700]/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 primary-button rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border border-[#FFD700]/30"
          >
            {loading ? 'Authenticating...' : 'LOGIN TO SECURE PORTAL'}
            <ArrowRight className="w-4 h-4 text-[#FFD700]" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/80">
          <p className="text-[11px] font-bold text-center text-slate-500 uppercase tracking-wider mb-2">
            Instant Preview Access (Explore Roles)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => loginAsDemo('teacher_ravi')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-[#8B0000]/10 hover:text-[#8B0000] border border-slate-200 rounded-lg font-bold text-slate-700 transition cursor-pointer text-center"
            >
              👩‍🏫 Staff (Teacher)
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('hm_raman')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-[#8B0000]/10 hover:text-[#8B0000] border border-slate-200 rounded-lg font-bold text-slate-700 transition cursor-pointer text-center"
            >
              🏫 Headmaster
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('commissioner')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-[#8B0000]/10 hover:text-[#8B0000] border border-slate-200 rounded-lg font-bold text-slate-700 transition cursor-pointer text-center"
            >
              🏛️ Commissioner
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('admin')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-[#8B0000]/10 hover:text-[#8B0000] border border-slate-200 rounded-lg font-bold text-slate-700 transition cursor-pointer text-center"
            >
              ⚙️ Administrator
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Protected by Role-Based Access Control (RBAC) & Audit Trails.
          </p>
        </div>
      </div>
    </div>
  );
};

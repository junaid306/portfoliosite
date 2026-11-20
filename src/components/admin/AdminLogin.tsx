import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { loginAdmin, setStoredToken } from '../../utils/apiClient';
import type { AdminUserPublic } from '../../types/cms';

interface AdminLoginProps {
  onSuccess: (user: AdminUserPublic) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToSite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginAdmin(email, password);
      setStoredToken(res.token);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      <div className="w-full max-w-md space-y-6">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Portfolio</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-900" />
              <span>Portfolio CMS Workspace</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Admin Sign In
            </h1>
            <p className="text-sm text-slate-600">
              Authenticate to manage themes, typography, design tokens, and live content.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ateliervance.studio"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            {error && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-60 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Sign In to CMS'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="text-xs font-medium text-slate-500">Seeded Accounts (Click to Fill)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@ateliervance.studio');
                  setPassword('Admin@2026!');
                }}
                className="text-left p-2.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Super Admin</div>
                <div className="text-slate-500 truncate font-mono text-[11px]">admin@ateliervance.studio</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('editor@ateliervance.studio');
                  setPassword('Editor@2026!');
                }}
                className="text-left p-2.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Studio Editor</div>
                <div className="text-slate-500 truncate font-mono text-[11px]">editor@ateliervance.studio</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

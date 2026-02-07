'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthModal() {
  const { register, recover, error } = useAuthStore();
  const [mode, setMode] = useState<'register' | 'recover'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        await register(name, email);
      } else {
        await recover(email);
      }
    } catch {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary">Trip</span>Link
          </h1>
          <p className="text-slate-400">
            Visualize your travels on a 3D globe
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-6">
            {mode === 'register' ? 'Get Started' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {mode === 'register' ? 'Email (for account recovery)' : 'Enter your email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 rounded-lg font-medium"
            >
              {isLoading
                ? 'Loading...'
                : mode === 'register'
                ? 'Start Planning'
                : 'Recover Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'register' ? 'recover' : 'register')}
              className="text-sm text-slate-400 hover:text-white"
            >
              {mode === 'register'
                ? "I've used this before"
                : 'Create new account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

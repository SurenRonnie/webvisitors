'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { saveToken } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.post('/auth/login', { email, password });
      saveToken(token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-panel border border-border rounded-xl p-8 space-y-4">
        <h1 className="text-xl font-semibold text-white">Log in to VisitorIQ</h1>
        {error && <p className="text-sm text-hot">{error}</p>}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent text-white text-sm font-medium py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-gray-400 text-center">
          No account? <a href="/signup" className="text-accent">Sign up</a>
        </p>
      </form>
    </div>
  );
}

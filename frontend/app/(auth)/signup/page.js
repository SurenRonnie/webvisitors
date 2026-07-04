'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { saveToken } from '../../../lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.post('/auth/signup', form);
      saveToken(token);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-panel border border-border rounded-xl p-8 space-y-4">
        <h1 className="text-xl font-semibold text-white">Create your VisitorIQ account</h1>
        {error && <p className="text-sm text-hot">{error}</p>}
        {[
          ['companyName', 'Company name', 'text'],
          ['name', 'Your name', 'text'],
          ['email', 'Work email', 'email'],
          ['password', 'Password', 'password'],
        ].map(([field, label, type]) => (
          <div key={field}>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <input
              type={type}
              required
              value={form[field]}
              onChange={update(field)}
              className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent text-white text-sm font-medium py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Start free trial'}
        </button>
        <p className="text-sm text-gray-400 text-center">
          Already have an account? <a href="/login" className="text-accent">Log in</a>
        </p>
      </form>
    </div>
  );
}

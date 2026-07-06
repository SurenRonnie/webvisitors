'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import TrackingSnippetPanel from './TrackingSnippetPanel';

const STEPS = ['Add your website', 'Install tracking snippet', 'Define your ICP', 'Done'];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState('');
  const [website, setWebsite] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [icp, setIcp] = useState({ industries: '', minEmployees: '', maxEmployees: '', countries: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (step !== 1 || !website) return;
    const interval = setInterval(async () => {
      const res = await api.get(`/websites/${website._id}/install-status`);
      if (res.installed) {
        setInstalled(true);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, website]);

  async function handleCreateWebsite(e) {
    e.preventDefault();
    setError('');
    try {
      const { website } = await api.post('/websites', { domain });
      setWebsite(website);
      setStep(1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveIcp(e) {
    e.preventDefault();
    try {
      await api.put('/account', {
        icp: {
          industries: icp.industries.split(',').map((s) => s.trim()).filter(Boolean),
          minEmployees: icp.minEmployees ? Number(icp.minEmployees) : undefined,
          maxEmployees: icp.maxEmployees ? Number(icp.maxEmployees) : undefined,
          countries: icp.countries.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-6">
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className={`flex-1 h-1 rounded ${i <= step ? 'bg-accent' : 'bg-border'}`} />
        ))}
      </div>

      {error && <p className="text-sm text-hot mb-4">{error}</p>}

      {step === 0 && (
        <form onSubmit={handleCreateWebsite} className="space-y-4">
          <h2 className="text-lg font-semibold text-white">What website do you want to track?</h2>
          <input
            type="text"
            required
            placeholder="yourcompany.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-md bg-panel border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-md bg-accent text-white text-sm font-medium py-2 px-4">
            Continue
          </button>
        </form>
      )}

      {step === 1 && website && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Install the tracking snippet</h2>
          <TrackingSnippetPanel trackingId={website.trackingId} />
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${installed ? 'bg-green-400' : 'bg-warm animate-pulse'}`} />
            <span className="text-gray-400">{installed ? 'Installed — traffic detected!' : 'Waiting for first visitor data…'}</span>
          </div>
          <button onClick={() => setStep(2)} className="rounded-md bg-accent text-white text-sm font-medium py-2 px-4">
            {installed ? 'Continue' : 'Skip for now'}
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSaveIcp} className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Define your Ideal Customer Profile</h2>
          <p className="text-sm text-gray-400">This tunes the lead scoring engine's "company fit" rule.</p>
          <input
            type="text"
            placeholder="Industries (comma-separated), e.g. Software, Fintech"
            value={icp.industries}
            onChange={(e) => setIcp({ ...icp, industries: e.target.value })}
            className="w-full rounded-md bg-panel border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Min employees"
              value={icp.minEmployees}
              onChange={(e) => setIcp({ ...icp, minEmployees: e.target.value })}
              className="w-full rounded-md bg-panel border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Max employees"
              value={icp.maxEmployees}
              onChange={(e) => setIcp({ ...icp, maxEmployees: e.target.value })}
              className="w-full rounded-md bg-panel border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
          </div>
          <input
            type="text"
            placeholder="Countries (comma-separated), e.g. US, CA"
            value={icp.countries}
            onChange={(e) => setIcp({ ...icp, countries: e.target.value })}
            className="w-full rounded-md bg-panel border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-md bg-accent text-white text-sm font-medium py-2 px-4">
            Continue
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-semibold text-white">You're all set</h2>
          <p className="text-sm text-gray-400">Leads will start appearing in your dashboard as visitors are identified.</p>
          <button onClick={() => router.push('/dashboard')} className="rounded-md bg-accent text-white text-sm font-medium py-2 px-4">
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import TrackingSnippetPanel from '../../../components/TrackingSnippetPanel';

export default function SettingsPage() {
  const [account, setAccount] = useState(null);
  const [team, setTeam] = useState([]);
  const [plans, setPlans] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [installStatus, setInstallStatus] = useState({});
  const [newDomain, setNewDomain] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '', password: '', role: 'sales' });
  const [message, setMessage] = useState('');

  async function load() {
    const { account } = await api.get('/account');
    setAccount(account);
    const { users } = await api.get('/account/team');
    setTeam(users);
    const { plans } = await api.get('/billing/plans');
    setPlans(plans);
    const { websites } = await api.get('/websites');
    setWebsites(websites);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleField(field) {
    await api.put('/account', { [field]: !account[field] });
    load();
  }

  async function inviteMember(e) {
    e.preventDefault();
    await api.post('/account/team', invite);
    setInvite({ name: '', email: '', password: '', role: 'sales' });
    setMessage('Team member added.');
    load();
  }

  async function upgradePlan(plan) {
    const { session } = await api.post('/billing/checkout', { plan });
    setMessage(`Mock checkout session created: ${session.url}`);
  }

  async function requestDeletion() {
    if (!confirm('This permanently deletes all websites, visits, sessions, and page views for this account. Continue?')) return;
    const result = await api.post('/account/gdpr/delete', {});
    setMessage(`Deleted ${result.websites} websites, ${result.visits} visits, ${result.sessions} sessions.`);
  }

  async function addWebsite(e) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    await api.post('/websites', { domain: newDomain.trim() });
    setNewDomain('');
    load();
  }

  async function checkInstall(website) {
    const result = await api.get(`/websites/${website._id}/install-status`);
    setInstallStatus((prev) => ({ ...prev, [website._id]: result.installed }));
  }

  if (!account) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-xl font-semibold text-white">Settings</h1>
      {message && <p className="text-sm text-accent">{message}</p>}

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Websites & tracking snippets</h2>
        <p className="text-xs text-gray-500 mb-3">
          Each website gets its own unique tracking key (<code>data-tracking-id</code>) — install a separate snippet on every site you want to track.
        </p>
        <div className="space-y-4 mb-4">
          {websites.map((website) => (
            <div key={website._id} className="bg-panel border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-white">{website.domain}</div>
                  <div className="text-xs text-gray-500">key: {website.trackingId}</div>
                </div>
                <div className="flex items-center gap-2">
                  {installStatus[website._id] !== undefined && (
                    <span className={`text-xs ${installStatus[website._id] ? 'text-green-400' : 'text-warm'}`}>
                      {installStatus[website._id] ? 'Receiving traffic' : 'No traffic yet'}
                    </span>
                  )}
                  <button onClick={() => checkInstall(website)} className="text-xs rounded-md bg-surface border border-border px-2 py-1 text-gray-300 hover:text-white">
                    Check status
                  </button>
                </div>
              </div>
              <TrackingSnippetPanel trackingId={website.trackingId} />
            </div>
          ))}
          {websites.length === 0 && <p className="text-sm text-gray-500">No websites added yet.</p>}
        </div>
        <form onSubmit={addWebsite} className="flex gap-2">
          <input
            placeholder="Add another website, e.g. blog.yourcompany.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1 rounded-md bg-panel border border-border px-3 py-2 text-sm text-white"
          />
          <button type="submit" className="rounded-md bg-accent text-white text-sm px-4">Add website</button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Team ({account.plan} plan)</h2>
        <div className="space-y-2 mb-4">
          {team.map((u) => (
            <div key={u._id} className="flex justify-between bg-panel border border-border rounded-lg px-4 py-2 text-sm">
              <span className="text-white">{u.name} <span className="text-gray-500">({u.email})</span></span>
              <span className="text-gray-400">{u.role}</span>
            </div>
          ))}
        </div>
        <form onSubmit={inviteMember} className="grid grid-cols-2 gap-2">
          <input required placeholder="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} className="rounded-md bg-panel border border-border px-3 py-2 text-sm text-white" />
          <input required type="email" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="rounded-md bg-panel border border-border px-3 py-2 text-sm text-white" />
          <input required type="password" placeholder="Temporary password" value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} className="rounded-md bg-panel border border-border px-3 py-2 text-sm text-white" />
          <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} className="rounded-md bg-panel border border-border px-3 py-2 text-sm text-white">
            <option value="admin">Admin</option>
            <option value="sales">Sales Rep</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="col-span-2 rounded-md bg-accent text-white text-sm font-medium py-2">Invite</button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Privacy & compliance (GDPR)</h2>
        <div className="space-y-2">
          <label className="flex items-center justify-between bg-panel border border-border rounded-lg px-4 py-2 text-sm text-gray-300">
            IP anonymization
            <input type="checkbox" checked={account.ipAnonymization} onChange={() => toggleField('ipAnonymization')} />
          </label>
          <label className="flex items-center justify-between bg-panel border border-border rounded-lg px-4 py-2 text-sm text-gray-300">
            Consent-mode tracking
            <input type="checkbox" checked={account.consentModeEnabled} onChange={() => toggleField('consentModeEnabled')} />
          </label>
        </div>
        <button onClick={requestDeletion} className="mt-3 text-xs text-hot hover:underline">
          Delete all account data (GDPR right-to-erasure)
        </button>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Billing</h2>
        {plans && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(plans).map(([key, plan]) => (
              <div key={key} className="bg-panel border border-border rounded-lg p-4">
                <div className="text-sm text-white capitalize">{key}</div>
                <div className="text-xl text-white font-semibold">${plan.priceUsd}/mo</div>
                <div className="text-xs text-gray-500 mb-3">up to {plan.monthlyCompanies} companies</div>
                <button onClick={() => upgradePlan(key)} className="w-full rounded-md bg-accent text-white text-xs py-1.5">
                  {account.plan === key ? 'Current plan' : 'Choose plan'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

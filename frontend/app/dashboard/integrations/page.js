'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const CRM_PROVIDERS = [
  { key: 'hubspot', label: 'HubSpot' },
  { key: 'salesforce', label: 'Salesforce' },
  { key: 'pipedrive', label: 'Pipedrive' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [slackUrl, setSlackUrl] = useState('');
  const [zapierUrl, setZapierUrl] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { integrations } = await api.get('/integrations');
    setIntegrations(integrations);
  }

  useEffect(() => {
    load();
  }, []);

  function statusFor(provider) {
    return integrations.find((i) => i.provider === provider)?.status || 'disconnected';
  }

  async function connectCrm(provider) {
    try {
      await api.post(`/integrations/crm/${provider}/connect`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disconnect(provider) {
    await api.del(`/integrations/${provider}`);
    load();
  }

  async function saveWebhook(provider, url, reset) {
    if (!url) return;
    try {
      await api.post(`/integrations/webhook/${provider}`, { webhookUrl: url });
      reset('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-white">Integrations</h1>
      {error && <p className="text-sm text-hot">{error}</p>}

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">CRM sync</h2>
        <p className="text-xs text-gray-500 mb-3">
          Note: these connectors are mock-backed in this environment (no live HubSpot/Salesforce/Pipedrive OAuth app is
          configured) — they exercise the same adapter interface a real connection would use.
        </p>
        <div className="space-y-2">
          {CRM_PROVIDERS.map(({ key, label }) => {
            const status = statusFor(key);
            return (
              <div key={key} className="flex items-center justify-between bg-panel border border-border rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm text-white">{label}</div>
                  <div className={`text-xs ${status === 'connected' ? 'text-green-400' : 'text-gray-500'}`}>{status}</div>
                </div>
                {status === 'connected' ? (
                  <button onClick={() => disconnect(key)} className="text-xs text-gray-400 hover:text-hot">Disconnect</button>
                ) : (
                  <button onClick={() => connectCrm(key)} className="text-xs bg-accent text-white rounded-md px-3 py-1.5">Connect</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Slack alerts</h2>
        <div className="flex gap-2">
          <input
            placeholder="https://hooks.slack.com/services/…"
            value={slackUrl}
            onChange={(e) => setSlackUrl(e.target.value)}
            className="flex-1 rounded-md bg-panel border border-border px-3 py-2 text-sm text-white"
          />
          <button onClick={() => saveWebhook('slack', slackUrl, setSlackUrl)} className="rounded-md bg-accent text-white text-sm px-4">
            Save
          </button>
        </div>
        <p className={`text-xs mt-1 ${statusFor('slack') === 'connected' ? 'text-green-400' : 'text-gray-500'}`}>{statusFor('slack')}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Zapier / Make webhook</h2>
        <div className="flex gap-2">
          <input
            placeholder="https://hooks.zapier.com/…"
            value={zapierUrl}
            onChange={(e) => setZapierUrl(e.target.value)}
            className="flex-1 rounded-md bg-panel border border-border px-3 py-2 text-sm text-white"
          />
          <button onClick={() => saveWebhook('zapier_webhook', zapierUrl, setZapierUrl)} className="rounded-md bg-accent text-white text-sm px-4">
            Save
          </button>
        </div>
        <p className={`text-xs mt-1 ${statusFor('zapier_webhook') === 'connected' ? 'text-green-400' : 'text-gray-500'}`}>{statusFor('zapier_webhook')}</p>
      </section>
    </div>
  );
}

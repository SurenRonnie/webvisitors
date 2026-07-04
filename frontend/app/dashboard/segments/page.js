'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import EmptyState from '../../../components/EmptyState';

export default function SegmentsPage() {
  const [segments, setSegments] = useState(null);
  const [form, setForm] = useState({ name: '', minScore: '', industry: '', country: '' });
  const [error, setError] = useState('');

  async function load() {
    const { segments } = await api.get('/segments');
    setSegments(segments);
  }

  useEffect(() => {
    load();
  }, []);

  async function createSegment(e) {
    e.preventDefault();
    try {
      const filter = {
        ...(form.minScore ? { minScore: Number(form.minScore) } : {}),
        ...(form.industry ? { industry: form.industry } : {}),
        ...(form.country ? { country: form.country } : {}),
      };
      await api.post('/segments', { name: form.name, filter });
      setForm({ name: '', minScore: '', industry: '', country: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSegment(id) {
    await api.del(`/segments/${id}`);
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-white mb-6">Saved segments</h1>

      <form onSubmit={createSegment} className="grid grid-cols-2 gap-3 mb-8 bg-panel border border-border rounded-xl p-4">
        {error && <p className="col-span-2 text-sm text-hot">{error}</p>}
        <input
          required
          placeholder="Segment name, e.g. Enterprise US pricing viewers"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="col-span-2 rounded-md bg-surface border border-border px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Min score"
          type="number"
          value={form.minScore}
          onChange={(e) => setForm({ ...form, minScore: e.target.value })}
          className="rounded-md bg-surface border border-border px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Industry"
          value={form.industry}
          onChange={(e) => setForm({ ...form, industry: e.target.value })}
          className="rounded-md bg-surface border border-border px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Country"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          className="rounded-md bg-surface border border-border px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="rounded-md bg-accent text-white text-sm font-medium py-2 col-span-2">
          Save segment
        </button>
      </form>

      {segments && segments.length === 0 && <EmptyState title="No saved segments yet" description="Save a filtered view of the Lead Feed to quickly get back to it later." />}

      <div className="space-y-2">
        {segments?.map((segment) => (
          <div key={segment._id} className="flex items-center justify-between bg-panel border border-border rounded-lg px-4 py-3">
            <div>
              <div className="text-sm text-white">{segment.name}</div>
              <div className="text-xs text-gray-500">{JSON.stringify(segment.filter)}</div>
            </div>
            <button onClick={() => removeSegment(segment._id)} className="text-xs text-gray-500 hover:text-hot">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

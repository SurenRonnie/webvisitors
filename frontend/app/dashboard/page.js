'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { connectSocket } from '../../lib/socket';
import FilterBar from '../../components/FilterBar';
import LeadFeedTable from '../../components/LeadFeedTable';
import EmptyState from '../../components/EmptyState';

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export default function LeadFeedPage() {
  const [filters, setFilters] = useState({});
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const query = buildQuery(filters);
      const { visits } = await api.get(`/companies/feed${query ? `?${query}` : ''}`);
      setVisits(visits);
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('lead:updated', load);
    socket.on('lead:hot', load);
    return () => {
      socket.off('lead:updated', load);
      socket.off('lead:hot', load);
    };
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Live Lead Feed</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <p className="text-sm text-hot mb-4">{error}</p>}
      {visits === null && <p className="text-sm text-gray-400">Loading…</p>}
      {visits && visits.length === 0 && (
        <EmptyState
          title="Waiting for your first visitor"
          description="Once someone from a company visits your site, they'll show up here — usually within a few minutes of installing the tracking snippet. It can take 24–48h to build a meaningful feed in production."
        />
      )}
      {visits && visits.length > 0 && <LeadFeedTable visits={visits} />}
    </div>
  );
}

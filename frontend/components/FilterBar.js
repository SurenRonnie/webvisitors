'use client';

export default function FilterBar({ filters, onChange }) {
  function update(field) {
    return (e) => onChange({ ...filters, [field]: e.target.value });
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select value={filters.tier || ''} onChange={update('tier')} className="rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white">
        <option value="">All tiers</option>
        <option value="hot">Hot</option>
        <option value="warm">Warm</option>
        <option value="cold">Cold</option>
      </select>

      <input
        type="number"
        placeholder="Min score"
        value={filters.minScore || ''}
        onChange={update('minScore')}
        className="w-28 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white placeholder-gray-500"
      />

      <input
        type="text"
        placeholder="Industry"
        value={filters.industry || ''}
        onChange={update('industry')}
        className="w-36 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white placeholder-gray-500"
      />

      <input
        type="text"
        placeholder="Country (US, DE…)"
        value={filters.country || ''}
        onChange={update('country')}
        className="w-40 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white placeholder-gray-500"
      />

      <select value={filters.visitType || ''} onChange={update('visitType')} className="rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white">
        <option value="">First & returning</option>
        <option value="first">First visit</option>
        <option value="returning">Returning</option>
      </select>

      <input
        type="text"
        placeholder="Page path e.g. /pricing"
        value={filters.page || ''}
        onChange={update('page')}
        className="w-48 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white placeholder-gray-500"
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import EmptyState from '../../../components/EmptyState';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/reports/pipeline-summary').then(setSummary);
    api.get('/reports/attribution').then((r) => setRows(r.rows));
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-xl font-semibold text-white">Reports & attribution</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            ['Total leads', summary.total],
            ['Hot', summary.hot],
            ['Warm', summary.warm],
            ['Cold', summary.cold],
          ].map(([label, value]) => (
            <div key={label} className="bg-panel border border-border rounded-lg p-4">
              <div className="text-2xl font-semibold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Campaign / source attribution</h2>
        <p className="text-xs text-gray-500 mb-3">Ranked by average lead score, not raw traffic volume — the source that drives the best leads should get more budget.</p>
        {rows && rows.length === 0 && <EmptyState title="No attribution data yet" description="Once visits are scored, this table ranks utm_source/campaign combinations by average lead quality." />}
        {rows && rows.length > 0 && (
          <div className="border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-border">
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Medium</th>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Sessions</th>
                  <th className="px-4 py-3 font-medium">Avg score</th>
                  <th className="px-4 py-3 font-medium">Hot leads</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-4 py-3 text-white">{row.source}</td>
                    <td className="px-4 py-3 text-gray-400">{row.medium}</td>
                    <td className="px-4 py-3 text-gray-400">{row.campaign}</td>
                    <td className="px-4 py-3 text-gray-400">{row.sessions}</td>
                    <td className="px-4 py-3 text-gray-400">{row.avgScore}</td>
                    <td className="px-4 py-3 text-gray-400">{row.hotLeads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import ScoreBadge from './ScoreBadge';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function LeadFeedTable({ visits }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-border">
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Industry</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Sessions</th>
            <th className="px-4 py-3 font-medium">Pages</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr
              key={visit._id}
              onClick={() => router.push(`/dashboard/companies/${visit._id}`)}
              className="border-b border-border/60 hover:bg-white/5 cursor-pointer"
            >
              <td className="px-4 py-3 text-white font-medium">{visit.company?.name || visit.company?.domain}</td>
              <td className="px-4 py-3"><ScoreBadge score={visit.score} tier={visit.tier} /></td>
              <td className="px-4 py-3 text-gray-400">{visit.company?.industry || '—'}</td>
              <td className="px-4 py-3 text-gray-400">{visit.company?.employeeCount ? `${visit.company.employeeCount} emp` : '—'}</td>
              <td className="px-4 py-3 text-gray-400">{visit.company?.country || '—'}</td>
              <td className="px-4 py-3 text-gray-400">{visit.sessionCount}{visit.sessionCount === 1 ? ' (new)' : ''}</td>
              <td className="px-4 py-3 text-gray-400">{visit.pageViewCount}</td>
              <td className="px-4 py-3 text-gray-400">{timeAgo(visit.lastSeenAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

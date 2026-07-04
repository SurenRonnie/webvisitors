'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import ScoreBadge from '../../../../components/ScoreBadge';
import CompanyTimeline from '../../../../components/CompanyTimeline';
import PageviewHeatmap from '../../../../components/PageviewHeatmap';
import ContactCard from '../../../../components/ContactCard';

export default function CompanyProfilePage() {
  const { visitId } = useParams();
  const [data, setData] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [tagText, setTagText] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const result = await api.get(`/companies/visits/${visitId}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [visitId]);

  async function submitNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.post(`/companies/visits/${visitId}/notes`, { body: noteText });
    setNoteText('');
    load();
  }

  async function addTag(e) {
    e.preventDefault();
    if (!tagText.trim()) return;
    const nextTags = [...(data.visit.tags || []), tagText.trim()];
    await api.put(`/companies/visits/${visitId}/tags`, { tags: nextTags });
    setTagText('');
    load();
  }

  async function pushToCrm(provider) {
    try {
      await api.post(`/integrations/crm/${provider}/push`, { visitId });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="text-sm text-hot">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading…</p>;

  const { visit, sessions, contacts, pageHeatmap } = data;
  const company = visit.company;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{company.name || company.domain}</h1>
          <p className="text-sm text-gray-400">
            {company.domain} · {company.industry || 'Unknown industry'} · {company.employeeCount ? `${company.employeeCount} employees` : 'Unknown size'} · {company.hqLocation}
          </p>
        </div>
        <ScoreBadge score={visit.score} tier={visit.tier} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => pushToCrm('hubspot')} className="rounded-md bg-panel border border-border px-3 py-1.5 text-xs text-gray-300 hover:text-white">
          Push to HubSpot
        </button>
        <button onClick={() => pushToCrm('salesforce')} className="rounded-md bg-panel border border-border px-3 py-1.5 text-xs text-gray-300 hover:text-white">
          Push to Salesforce
        </button>
        <button onClick={() => pushToCrm('pipedrive')} className="rounded-md bg-panel border border-border px-3 py-1.5 text-xs text-gray-300 hover:text-white">
          Push to Pipedrive
        </button>
        {visit.pushedToCrm && <span className="text-xs text-green-400 self-center">Synced ✓</span>}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Visit timeline</h2>
          <CompanyTimeline sessions={sessions} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Pages viewed</h2>
          <PageviewHeatmap pageHeatmap={pageHeatmap} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Suggested contacts</h2>
        <div className="grid grid-cols-3 gap-3">
          {contacts.map((c) => <ContactCard key={c._id} contact={c} />)}
          {contacts.length === 0 && <p className="text-sm text-gray-500">No contacts found yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {(visit.tags || []).map((tag) => (
              <span key={tag} className="text-xs bg-white/5 border border-border rounded-full px-2.5 py-1 text-gray-300">{tag}</span>
            ))}
          </div>
          <form onSubmit={addTag} className="flex gap-2">
            <input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="Add a tag"
              className="flex-1 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white"
            />
            <button type="submit" className="rounded-md bg-accent text-white text-xs px-3">Add</button>
          </form>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Notes</h2>
          <div className="space-y-2 mb-3">
            {(visit.notes || []).map((note, i) => (
              <div key={i} className="text-sm bg-panel border border-border rounded-md p-2">
                <p className="text-gray-200">{note.body}</p>
                <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submitNote} className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note"
              className="flex-1 rounded-md bg-panel border border-border px-3 py-1.5 text-sm text-white"
            />
            <button type="submit" className="rounded-md bg-accent text-white text-xs px-3">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}

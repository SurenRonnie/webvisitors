'use client';

import { useState } from 'react';
import { API_URL } from '../lib/api';

export default function TrackingSnippetPanel({ trackingId }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<script async src="${API_URL}/tracker.js" data-tracking-id="${trackingId}" data-endpoint="${API_URL}"></script>`;

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">Paste this snippet before the closing <code>&lt;/body&gt;</code> tag on every page:</p>
        <button onClick={copySnippet} className="text-xs rounded-md bg-panel border border-border px-2 py-1 text-gray-300 hover:text-white shrink-0 ml-3">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-black/40 rounded-md p-3 text-xs text-accent overflow-x-auto">{snippet}</pre>
    </div>
  );
}

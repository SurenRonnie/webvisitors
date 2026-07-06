export default function CompanyTimeline({ sessions }) {
  if (!sessions.length) return <p className="text-sm text-gray-500">No sessions yet.</p>;

  return (
    <ol className="space-y-4 border-l border-border pl-4">
      {sessions.map((session) => (
        <li key={session._id} className="relative">
          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent" />
          <div className="text-sm text-white">{new Date(session.startedAt).toLocaleString()}</div>
          <div className="text-xs text-gray-400">
            {session.referrer ? `via ${session.referrer}` : 'Direct traffic'}
            {session.utmSource ? ` · utm_source=${session.utmSource}` : ''}
            {' · '}
            {session.device || 'desktop'} / {session.browser || 'unknown browser'}
          </div>
        </li>
      ))}
    </ol>
  );
}

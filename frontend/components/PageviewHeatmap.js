export default function PageviewHeatmap({ pageHeatmap }) {
  const entries = Object.entries(pageHeatmap || {}).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  if (!entries.length) return <p className="text-sm text-gray-500">No page views recorded yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map(([path, count]) => (
        <div key={path} className="flex items-center gap-3">
          <span className="w-40 text-xs text-gray-400 truncate">{path}</span>
          <div className="flex-1 h-2 bg-border rounded">
            <div className="h-2 bg-accent rounded" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

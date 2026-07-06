const TIER_STYLES = {
  hot: 'bg-hot/20 text-hot border-hot/40',
  warm: 'bg-warm/20 text-warm border-warm/40',
  cold: 'bg-cold/20 text-cold border-cold/40',
};

export default function ScoreBadge({ score, tier }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[tier] || TIER_STYLES.cold}`}>
      <span className="uppercase tracking-wide">{tier}</span>
      <span className="opacity-70">{score}</span>
    </span>
  );
}

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Sprout,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const ICONS = { sprout: Sprout, trending: TrendingUp, wallet: Wallet, activity: Activity };

export default function StatCard({ label, value, note, trend, trendTone = 'up', icon = 'sprout' }) {
  const Icon = ICONS[icon] || Sprout;
  const TrendIcon = trendTone === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-bottom">
        {trend && (
          <span className={`trend trend-${trendTone}`}>
            <TrendIcon size={14} />
            {trend}
          </span>
        )}
        {note && <span className="stat-note">{note}</span>}
      </div>
    </article>
  );
}

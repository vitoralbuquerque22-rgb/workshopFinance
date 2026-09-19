import { TrendingUp, TrendingDown } from 'lucide-react';

const variants = {
  default: { card: 'bg-card border-border', icon: 'bg-primary/10 text-primary', value: 'text-foreground', label: 'text-muted-foreground', trend: 'text-muted-foreground' },
  primary: { card: 'bg-primary border-primary text-primary-foreground', icon: 'bg-white/20 text-white', value: 'text-white', label: 'text-white/80', trend: 'text-white/80' },
  success: { card: 'bg-emerald-500 border-emerald-500 text-white', icon: 'bg-white/20 text-white', value: 'text-white', label: 'text-white/80', trend: 'text-white/80' },
  danger: { card: 'bg-red-500 border-red-500 text-white', icon: 'bg-white/20 text-white', value: 'text-white', label: 'text-white/80', trend: 'text-white/80' },
  warning: { card: 'bg-amber-500 border-amber-500 text-white', icon: 'bg-white/20 text-white', value: 'text-white', label: 'text-white/80', trend: 'text-white/80' },
};

export default function KPICard({ title, value, icon: Icon, trend, trendLabel, variant = 'default' }) {
  const v = variants[variant] || variants.default;
  return (
    <div className={`${v.card} rounded-xl border p-5 card-hover`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium uppercase tracking-wide ${v.label}`}>{title}</p>
        {Icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${v.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold font-heading ${v.value}`}>{value}</p>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend >= 0 ? (
            <TrendingUp className={`w-3.5 h-3.5 ${v.trend}`} />
          ) : (
            <TrendingDown className={`w-3.5 h-3.5 ${v.trend}`} />
          )}
          <span className={`text-xs font-medium ${v.trend}`}>
            {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
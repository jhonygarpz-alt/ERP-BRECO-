import type { LucideIcon } from 'lucide-react';
import { Sparkline } from './charts';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: 'red' | 'blue' | 'green' | 'amber';
  sparkline?: number[];
}

const ACCENTS: Record<string, string> = {
  red: 'bg-breco-500/15 text-breco-500',
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-emerald-500/15 text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-400',
};

const SPARK_COLOR: Record<string, string> = {
  red: '#e11d2e',
  blue: '#60a5fa',
  green: '#34d399',
  amber: '#fbbf24',
};

export function StatCard({ label, value, icon: Icon, hint, accent = 'red', sparkline }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line-800 bg-bg-800 p-5 transition hover:border-line-700">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-500">{label}</span>
        <span className={`rounded-lg p-2 ${ACCENTS[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-600">{hint}</div>}
      {sparkline && (
        <div className="mt-2 -mb-1">
          <Sparkline data={sparkline} color={SPARK_COLOR[accent]} height={28} />
        </div>
      )}
    </div>
  );
}

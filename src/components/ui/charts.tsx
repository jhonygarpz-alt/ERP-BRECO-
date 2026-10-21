/** Graficas ligeras en SVG puro, sin dependencias externas. */

export function Sparkline({ data, color = '#60a5fa', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = 100 / (data.length - 1);
  const puntos = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={puntos} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface SegmentoDonut {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 140,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  segments: SegmentoDonut[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let acumulado = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-bg-700)" strokeWidth={thickness} />
        {total > 0 && (
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments
              .filter((s) => s.value > 0)
              .map((s) => {
                const frac = s.value / total;
                const dash = frac * circumference;
                const el = (
                  <circle
                    key={s.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-acumulado}
                  />
                );
                acumulado += dash;
                return el;
              })}
          </g>
        )}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          {centerValue && <span className="text-2xl font-bold text-ink-100">{centerValue}</span>}
          {centerLabel && <span className="text-[11px] text-ink-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

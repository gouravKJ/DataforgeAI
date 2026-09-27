import { cn } from "@/lib/utils";

export function QualityRing({ value, size = 44, className }: { value: number; size?: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 0.8 ? "hsl(160 84% 45%)" : pct >= 0.6 ? "hsl(191 91% 55%)" : pct >= 0.45 ? "hsl(38 92% 56%)" : "hsl(0 84% 62%)";
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold" style={{ color }}>
        {Math.round(pct * 100)}
      </span>
    </div>
  );
}

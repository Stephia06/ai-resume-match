interface Props { score: number; label: string; size?: number }

export function ScoreRing({ score, label, size = 140 }: Props) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = score >= 75 ? "var(--primary)" : score >= 50 ? "var(--accent)" : "var(--destructive)";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border)" strokeWidth={10} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={10} fill="none" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
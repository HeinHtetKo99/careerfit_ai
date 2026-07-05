export default function ScoreCircle({ score, size = 168 }) {
  const normalized = Math.min(100, Math.max(0, Number(score) || 0));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  const stroke =
    normalized >= 75 ? '#10b981' : normalized >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{Math.round(normalized)}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Match</span>
      </div>
    </div>
  );
}

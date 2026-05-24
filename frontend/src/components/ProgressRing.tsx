type Props = {
  ratio: number;    // 0–1
  size?: number;    // px, default 48
  strokeWidth?: number;
};

export function ProgressRing({ ratio, size = 48, strokeWidth = 4 }: Props) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(ratio, 0), 1));

  const color =
    ratio >= 1    ? "#059669"
    : ratio >= 0.6 ? "#D97706"
    :               "#3F6B57";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#DDE5DA"
          strokeWidth={strokeWidth}
        />
        {/* fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease, stroke 0.7s ease" }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color: "#172A21" }}
      >
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}

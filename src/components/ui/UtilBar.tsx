"use client";

export default function UtilBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? "var(--status-fail)" : pct >= 80 ? "var(--status-warn)" : "var(--status-pass)";
  return (
    <div className="flex items-center gap-2">
      <div className="utilisation-bar flex-1" style={{ minWidth: 80 }}>
        <div className="utilisation-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: pct >= 80 ? color : "var(--text-secondary)", fontWeight: 500, minWidth: 34 }}>
        {pct}%
      </span>
    </div>
  );
}

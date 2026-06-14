"use client";

const STATUS_MAP: Record<string, { bg: string; color: string; label?: string }> = {
  available:   { bg: "var(--status-pass-bg)",  color: "var(--status-pass)" },
  reserved:    { bg: "var(--status-info-bg)",  color: "var(--status-info)" },
  issued:      { bg: "var(--status-warn-bg)",  color: "var(--status-warn)" },
  returned:    { bg: "var(--bg-card)",          color: "var(--text-secondary)" },
  retired:     { bg: "var(--status-fail-bg)",  color: "var(--status-fail)" },
  expired:     { bg: "var(--status-fail-bg)",  color: "var(--status-fail)" },
  pass:        { bg: "var(--status-pass-bg)",  color: "var(--status-pass)" },
  fail:        { bg: "var(--status-fail-bg)",  color: "var(--status-fail)" },
  warning:     { bg: "var(--status-warn-bg)",  color: "var(--status-warn)" },
  pending:     { bg: "var(--status-info-bg)",  color: "var(--status-info)" },
  approved:    { bg: "var(--status-pass-bg)",  color: "var(--status-pass)" },
  verified:    { bg: "#e3f2fd",               color: "#1565c0" },
  rejected:    { bg: "var(--status-fail-bg)",  color: "var(--status-fail)" },
  printed:     { bg: "var(--bg-card)",          color: "var(--text-secondary)" },
  included:    { bg: "var(--status-pass-bg)",  color: "var(--status-pass)" },
  excluded:    { bg: "var(--status-fail-bg)",  color: "var(--status-fail)" },
  retrieved:   { bg: "var(--status-warn-bg)",  color: "var(--status-warn)" },
  "in use":    { bg: "var(--status-warn-bg)",  color: "var(--status-warn)" },
  discarded:   { bg: "var(--bg-card)",          color: "var(--text-muted)" },
};

export default function StatusTag({ status }: { status: string }) {
  const key = status.toLowerCase();
  const style = STATUS_MAP[key] ?? { bg: "var(--bg-card)", color: "var(--text-secondary)" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

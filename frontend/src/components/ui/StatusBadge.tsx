type StatusBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span className={`wowui-status-badge wowui-status-badge--${tone}`}>
      {label}
    </span>
  );
}
type PriorityBadgeTone =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "neutral";

type PriorityBadgeProps = {
  label: string;
  tone?: PriorityBadgeTone;
};

export function PriorityBadge({
  label,
  tone = "neutral",
}: PriorityBadgeProps) {
  return (
    <span className={`wowui-priority-badge wowui-priority-badge--${tone}`}>
      {label}
    </span>
  );
}
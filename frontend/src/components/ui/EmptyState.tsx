import type { ReactNode } from "react";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="wowui-empty-state">
      {eyebrow ? <span className="wowui-eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="wowui-empty-state__action">{action}</div> : null}
    </div>
  );
}
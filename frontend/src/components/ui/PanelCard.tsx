import type { ReactNode } from "react";

type PanelCardProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  stacked?: boolean;
  children: ReactNode;
};

export function PanelCard({
  eyebrow,
  title,
  subtitle,
  action,
  stacked = false,
  children,
}: PanelCardProps) {
  return (
    <section className="wowui-panel-card">
      {(eyebrow || title || subtitle || action) && (
        <div
          className={`wowui-panel-card__header ${
            stacked ? "wowui-panel-card__header--stacked" : ""
          }`}
        >
          <div>
            {eyebrow ? <span className="wowui-eyebrow">{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
            {subtitle ? (
              <p className="wowui-panel-card__subtitle">{subtitle}</p>
            ) : null}
          </div>

          {action ? action : null}
        </div>
      )}

      {children}
    </section>
  );
}
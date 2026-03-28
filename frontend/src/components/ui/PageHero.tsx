import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  sideEyebrow?: string;
  sideBadge?: ReactNode;
  sideDescription?: string;
  miniStats?: Array<{
    label: string;
    value: string | number;
  }>;
};

export function PageHero({
  eyebrow,
  title,
  description,
  chips = [],
  sideEyebrow,
  sideBadge,
  sideDescription,
  miniStats = [],
}: PageHeroProps) {
  return (
    <header className="wowui-hero">
      <div className="wowui-hero__content">
        <span className="wowui-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {chips.length > 0 ? (
          <div className="wowui-hero__chips">
            {chips.map((chip) => (
              <span key={chip} className="wowui-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="wowui-hero__sidecard">
        <div className="wowui-hero__sidecard-top">
          <span className="wowui-eyebrow">{sideEyebrow || eyebrow}</span>
          {sideBadge}
        </div>

        <p>{sideDescription || description}</p>

        {miniStats.length > 0 ? (
          <div className="wowui-hero__mini-grid">
            {miniStats.map((item) => (
              <div key={item.label} className="wowui-mini-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
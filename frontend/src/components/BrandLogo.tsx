import { Link } from "react-router-dom";

type BrandLogoProps = {
  to?: string;
  compact?: boolean;
  subtitle?: string;
};

export function BrandLogo({
  to = "/",
  compact = false,
  subtitle = "Ops SaaS Platform",
}: BrandLogoProps) {
  const content = (
    <div className={`brand-logo ${compact ? "compact" : ""}`}>
      <div className="brand-logo-mark" aria-hidden="true">
        <div className="brand-logo-core">W</div>
        <span className="brand-logo-node brand-logo-node-one" />
        <span className="brand-logo-node brand-logo-node-two" />
        <span className="brand-logo-node brand-logo-node-three" />
      </div>

      <div className="brand-logo-copy">
        <strong>WoWHUB</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );

  return (
    <Link to={to} className="brand-logo-link" aria-label="Ir para a página inicial do WoWHUB">
      {content}
    </Link>
  );
}
type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="wowui-stat-card">
      <span className="wowui-stat-card__label">{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}
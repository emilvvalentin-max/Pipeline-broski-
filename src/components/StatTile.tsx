export default function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card p-5 space-y-1">
      <p className="text-xs text-secondary">{label}</p>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

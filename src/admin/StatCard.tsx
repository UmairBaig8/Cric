export function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${accent ?? 'bg-primary/10 text-primary'}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-2xl font-bold leading-tight">{value}</div>
        {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}
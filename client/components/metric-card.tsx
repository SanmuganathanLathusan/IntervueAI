type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export const MetricCard = ({ label, value, hint }: MetricCardProps) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-sm leading-6 text-slate-300">{hint}</div> : null}
    </div>
  );
};

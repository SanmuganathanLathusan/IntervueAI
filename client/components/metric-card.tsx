type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: 'aqua' | 'green' | 'amber' | 'red';
};

const accentMap = {
  aqua: 'text-aqua-600 bg-aqua-50',
  green: 'text-emerald-600 bg-emerald-50',
  amber: 'text-amber-600 bg-amber-50',
  red: 'text-red-600 bg-red-50',
};

export const MetricCard = ({ label, value, hint, icon, accent = 'aqua' }: MetricCardProps) => {
  return (
    <div className="glass-panel p-6 flex flex-col justify-between min-h-[120px]">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${accentMap[accent]}`}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-sm text-slate-500 font-medium mb-1">{label}</div>
        <div className="text-3xl font-bold text-navy-900">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
      </div>
    </div>
  );
};

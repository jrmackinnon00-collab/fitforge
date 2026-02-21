const COLOR_MAP = {
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
  },
}

function StatCard({ title, value, subtitle, icon, color = 'orange', small = false }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.orange

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[96px]">
      {/* Icon + Title */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-tight">
          {title}
        </p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
            <span className={colors.text}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className={`font-black text-slate-900 dark:text-white leading-tight ${
            small || String(value).length > 8 ? 'text-sm' : 'text-2xl'
          }`}
        >
          {value ?? '—'}
        </p>
        {subtitle && (
          <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default StatCard

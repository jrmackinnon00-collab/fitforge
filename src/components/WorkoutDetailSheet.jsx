import { X, Clock, Calendar } from 'lucide-react'

function formatDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function WorkoutDetailSheet({ session, unit = 'lbs', onClose }) {
  if (!session) return null

  // Compute session totals for the summary bar
  let totalSets = 0
  let totalReps = 0
  let totalVolume = 0
  session.exercises?.forEach((ex) => {
    const doneSets = (ex.sets || []).filter((s) => s.reps !== '' || s.weight !== '')
    totalSets += doneSets.length
    doneSets.forEach((s) => {
      const r = Number(s.reps) || 0
      const w = Number(s.weight) || 0
      totalReps += r
      totalVolume += r * w
    })
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-0 shrink-0" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {session.planName || 'Workout'}
              </h2>
              {session.dayLabel && (
                <p className="text-orange-500 text-sm font-semibold">{session.dayLabel}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-slate-400 text-xs">
                  <Calendar size={11} />
                  {formatDisplayDate(session.date)}
                </span>
                {session.duration > 0 && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs">
                    <Clock size={11} />
                    {session.duration} min
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick-stats bar */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Exercises', value: session.exercises?.length ?? 0 },
              { label: 'Total Sets',  value: totalSets },
              { label: `Volume (${unit})`, value: totalVolume > 0 ? Math.round(totalVolume).toLocaleString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 text-center">
                <p className="text-slate-900 dark:text-white font-black text-base leading-tight">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable exercise list */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {session.exercises?.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No exercises recorded</p>
          )}

          {session.exercises?.map((exercise, exIdx) => {
            const doneSets = (exercise.sets || []).filter(
              (s) => s.reps !== '' || s.weight !== ''
            )
            if (doneSets.length === 0) return null
            return (
              <div key={exIdx}>
                <p className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  {exercise.name}
                </p>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-1 mb-1 px-1">
                  <span className="col-span-2 text-slate-400 text-xs text-center">Set</span>
                  <span className="col-span-4 text-slate-400 text-xs text-center">Reps</span>
                  <span className="col-span-4 text-slate-400 text-xs text-center">{unit}</span>
                  <span className="col-span-2 text-slate-400 text-xs text-center">RPE</span>
                </div>

                {doneSets.map((set, si) => (
                  <div
                    key={si}
                    className={`grid grid-cols-12 gap-1 py-2 px-1 rounded-lg ${
                      si % 2 === 0
                        ? 'bg-slate-50 dark:bg-slate-700/30'
                        : ''
                    }`}
                  >
                    <span className="col-span-2 text-slate-400 text-xs text-center font-semibold self-center">
                      {si + 1}
                    </span>
                    <span className="col-span-4 text-slate-900 dark:text-white text-sm text-center font-semibold self-center">
                      {set.reps || '—'}
                    </span>
                    <span className="col-span-4 text-slate-900 dark:text-white text-sm text-center font-semibold self-center">
                      {set.weight || '—'}
                    </span>
                    <span
                      className={`col-span-2 text-sm text-center font-bold self-center ${
                        set.rpe >= 9
                          ? 'text-red-400'
                          : set.rpe >= 7
                          ? 'text-orange-400'
                          : 'text-green-400'
                      }`}
                    >
                      {set.rpe || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Session notes */}
          {session.notes && (
            <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">
                Session Notes
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {session.notes}
              </p>
            </div>
          )}

          {/* Bottom padding so last item isn't flush against edge */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

export default WorkoutDetailSheet

/**
 * FPToast — animated Forge Points notification toast
 *
 * Usage:
 *   <FPToast events={fpEvents} onDone={() => setFpEvents([])} />
 *
 * events: array of { event, points } objects returned by processSession()
 * Shows one toast per FP event, cycling through them with a delay.
 */

import { useEffect, useState } from 'react'

const EVENT_LABELS = {
  session_complete:  'Session Complete!',
  full_day_complete: 'Full Day Bonus!',
  personal_record:   'Personal Record!',
  weight_increase:   'Weight Increase!',
  rep_increase:      'Rep Increase!',
  perfect_week:      'Perfect Week!',
  streak_7:          '7-Day Streak!',
  streak_30:         '30-Day Streak!',
  streak_90:         '90-Day Streak!',
  first_workout:     'First Workout!',
  profile_setup:     'Profile Complete!',
}

const EVENT_ICONS = {
  session_complete:  '🏋️',
  full_day_complete: '✅',
  personal_record:   '🥇',
  weight_increase:   '⬆️',
  rep_increase:      '📈',
  perfect_week:      '🗓️',
  streak_7:          '🔥',
  streak_30:         '💪',
  streak_90:         '🏆',
  first_workout:     '🎉',
  profile_setup:     '⚙️',
}

// Merge consecutive same-event types so we don't show 5 "Personal Record" toasts
function mergeEvents(events) {
  const merged = []
  for (const ev of events) {
    const last = merged[merged.length - 1]
    if (last && last.event === ev.event) {
      last.points += ev.points
      last.count  = (last.count || 1) + 1
    } else {
      merged.push({ ...ev, count: 1 })
    }
  }
  return merged
}

function SingleToast({ event, points, count, label, icon, visible }) {
  return (
    <div
      className={`flex items-center gap-3 bg-slate-900 dark:bg-slate-700 border border-orange-500/40 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 transition-all duration-500 ${
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      {/* Icon */}
      <span className="text-2xl leading-none">{icon}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">
          {label}
          {count > 1 && (
            <span className="text-slate-300 font-normal"> ×{count}</span>
          )}
        </p>
      </div>

      {/* FP badge */}
      <div className="bg-orange-500 text-white text-xs font-extrabold rounded-xl px-2.5 py-1 whitespace-nowrap shrink-0">
        +{points} FP
      </div>
    </div>
  )
}

export function FPToast({ events = [], onDone }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  const merged = mergeEvents(events)

  useEffect(() => {
    if (!merged.length) return

    setIndex(0)
    // Small delay so CSS transition fires
    const showTimer = setTimeout(() => setVisible(true), 50)

    return () => clearTimeout(showTimer)
  }, [events]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!merged.length || !visible) return

    const showDuration = 2200 // ms each toast is visible
    const fadeDuration = 500  // ms fade out

    const hideTimer = setTimeout(() => {
      setVisible(false)

      const nextTimer = setTimeout(() => {
        if (index + 1 < merged.length) {
          setIndex((i) => i + 1)
          setVisible(true)
        } else {
          // All toasts done
          onDone?.()
        }
      }, fadeDuration)

      return () => clearTimeout(nextTimer)
    }, showDuration)

    return () => clearTimeout(hideTimer)
  }, [index, visible, merged.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!merged.length || index >= merged.length) return null

  const current = merged[index]
  const label   = EVENT_LABELS[current.event] || 'Forge Points!'
  const icon    = EVENT_ICONS[current.event]  || '⚡'

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <div className="w-full max-w-sm pointer-events-auto">
        <SingleToast
          event={current.event}
          points={current.points}
          count={current.count}
          label={label}
          icon={icon}
          visible={visible}
        />
      </div>
    </div>
  )
}

export default FPToast

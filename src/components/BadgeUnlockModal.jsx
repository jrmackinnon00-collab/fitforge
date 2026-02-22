/**
 * BadgeUnlockModal — animated reveal when a badge is earned
 *
 * Props:
 *   badges   — array of badge objects (from BADGE_MAP) to show, one at a time
 *   onClose  — called when user dismisses or all badges have been shown
 */

import { useState, useEffect } from 'react'

function BadgeSlide({ badge, onNext, isLast }) {
  const [appear, setAppear] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppear(true), 80)
    return () => clearTimeout(t)
  }, [])

  if (!badge) return null

  const categoryColors = {
    consistency: 'from-blue-500 to-blue-700',
    strength:    'from-orange-500 to-red-600',
    plans:       'from-green-500 to-emerald-700',
    streaks:     'from-amber-500 to-orange-600',
    secret:      'from-purple-600 to-indigo-700',
  }
  const gradientClass = categoryColors[badge.category] || 'from-orange-500 to-red-600'

  return (
    <div
      className={`flex flex-col items-center text-center transition-all duration-500 ${
        appear ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-6'
      }`}
    >
      {/* Icon circle */}
      <div
        className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl mb-5 ring-4 ring-white/20`}
      >
        <span className="text-5xl leading-none">{badge.icon}</span>
      </div>

      {/* "Badge Unlocked!" label */}
      <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">
        Badge Unlocked
      </p>

      {/* Badge name */}
      <h2 className="text-white text-2xl font-extrabold mb-1">{badge.name}</h2>

      {/* Description */}
      <p className="text-slate-300 text-sm mb-4 max-w-xs">{badge.description}</p>

      {/* Flavour text */}
      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6 max-w-xs">
        <p className="text-slate-400 text-xs italic leading-relaxed">
          "{badge.flavourText}"
        </p>
      </div>

      {/* FP awarded */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-orange-500 text-white text-sm font-extrabold rounded-xl px-3 py-1.5">
          +{badge.pointsAwarded} FP
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onNext}
        className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all duration-200 text-base min-h-[56px]"
      >
        {isLast ? 'Awesome!' : 'Next Badge →'}
      </button>
    </div>
  )
}

export function BadgeUnlockModal({ badges = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [key, setKey] = useState(0) // force re-mount of slide for animation

  if (!badges.length) return null

  const handleNext = () => {
    if (currentIndex + 1 >= badges.length) {
      onClose?.()
    } else {
      setCurrentIndex((i) => i + 1)
      setKey((k) => k + 1)
    }
  }

  const badge = badges[currentIndex]
  const isLast = currentIndex === badges.length - 1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={handleNext}
      />

      {/* Modal panel */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm bg-slate-900 rounded-t-3xl sm:rounded-3xl px-6 pt-8 pb-10 mx-0 sm:mx-4 border border-white/10 shadow-2xl">
          {/* Progress dots for multiple badges */}
          {badges.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-6">
              {badges.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'bg-orange-500 w-4'
                      : i < currentIndex
                      ? 'bg-orange-500/50 w-1.5'
                      : 'bg-white/20 w-1.5'
                  }`}
                />
              ))}
            </div>
          )}

          <BadgeSlide
            key={key}
            badge={badge}
            onNext={handleNext}
            isLast={isLast}
          />
        </div>
      </div>
    </>
  )
}

export default BadgeUnlockModal

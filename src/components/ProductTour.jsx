import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to FitForge!',
    description: "Let's take a quick tour so you can hit the ground running. Tap Next to get started, or skip anytime.",
    tabIndex: null,
  },
  {
    emoji: '👤',
    title: 'Start With Your Profile',
    description: 'Set your equipment, goals, and training preferences here. The AI uses this to personalise your workout plans and exercise suggestions — so keep it up to date.',
    tabIndex: 4,
  },
  {
    emoji: '📋',
    title: 'Build a Workout Plan',
    description: 'Generate an AI-powered plan in seconds, or build your own from scratch. Swap exercises, reorder days, add notes, and activate when ready.',
    tabIndex: 1,
  },
  {
    emoji: '🏋️',
    title: 'Log Your Workouts',
    description: 'Track sets, reps, weight, and RPE as you train. You earn Fitness Points for every session — bonus points for personal records and progressive overload.',
    tabIndex: 2,
  },
  {
    emoji: '📈',
    title: 'Track Your Progress',
    description: 'Strength curves per exercise, a workout heatmap, and your full session history. Tap any session to review sets, reps, and volume in detail.',
    tabIndex: 3,
  },
  {
    emoji: '🏠',
    title: 'Your Home Dashboard',
    description: "Your stats at a glance: current streak, total workouts, weekly activity, and your rank card. Everything you need to stay motivated.",
    tabIndex: 0,
  },
  {
    emoji: '🏆',
    title: 'Badges & Ranks',
    description: 'Hit milestones to unlock badges and climb through 12 ranks — each unlocking a new theme. There are secret badges too. See if you can find them all.',
    tabIndex: null,
  },
  {
    emoji: '🚀',
    title: "You're All Set!",
    description: "That's the tour. Log your first workout and start earning Fitness Points. You can replay this tour anytime from your Profile.",
    tabIndex: null,
    isLast: true,
  },
]

function ProductTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState(null)

  useEffect(() => {
    const tabIndex = STEPS[step].tabIndex
    if (tabIndex === null) {
      setSpotlight(null)
      return
    }
    const id = setTimeout(() => {
      const navLinks = document.querySelectorAll('nav a')
      if (navLinks[tabIndex]) {
        const rect = navLinks[tabIndex].getBoundingClientRect()
        setSpotlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      }
    }, 60)
    return () => clearTimeout(id)
  }, [step])

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[200]">
      {/* SVG backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left - 6}
                y={spotlight.top - 6}
                width={spotlight.width + 12}
                height={spotlight.height + 12}
                rx="20"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#tour-mask)" />
      </svg>

      {/* Pulsing ring around spotlight target */}
      {spotlight && (
        <div
          className="absolute rounded-[20px] border-2 border-orange-400 animate-pulse pointer-events-none"
          style={{
            top: spotlight.top - 6,
            left: spotlight.left - 6,
            width: spotlight.width + 12,
            height: spotlight.height + 12,
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="absolute bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6"
        style={{
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Skip tour"
        >
          <X size={14} />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-5 h-2 bg-orange-500'
                  : i < step
                  ? 'w-2 h-2 bg-orange-300'
                  : 'w-2 h-2 bg-slate-200 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-4xl mb-3 leading-none">{current.emoji}</div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
          {current.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          {current.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={isFirst}
            className="flex items-center gap-1 text-sm font-semibold text-slate-400 disabled:opacity-0 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">
            {step + 1} / {STEPS.length}
          </span>

          <button
            onClick={isLast ? onComplete : () => setStep((s) => s + 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/30"
          >
            {isLast ? 'Get Started' : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductTour

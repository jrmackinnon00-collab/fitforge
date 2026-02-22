/**
 * RankUpModal — full-screen celebration when user reaches a new rank
 *
 * Props:
 *   rank     — the new rank object from ranks.js
 *   onClose  — called when user taps "Let's Go"
 */

import { useEffect, useState } from 'react'

// Simple confetti-style particle component rendered via CSS animation
function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    delay: Math.random() * 1.2,
    size: 4 + Math.random() * 6,
    color: ['#f97316', '#fb923c', '#fbbf24', '#f59e0b', '#ef4444'][
      Math.floor(Math.random() * 5)
    ],
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            backgroundColor: p.color,
            animation: `fall 2.5s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export function RankUpModal({ rank, onClose }) {
  const [appear, setAppear] = useState(false)

  useEffect(() => {
    if (!rank) return
    const t = setTimeout(() => setAppear(true), 80)
    return () => clearTimeout(t)
  }, [rank])

  if (!rank) return null

  // Map rank theme to background gradient
  const themeGradients = {
    gray:     'from-slate-800 to-slate-900',
    bronze:   'from-amber-900 to-slate-900',
    'bronze+': 'from-amber-800 to-slate-900',
    silver:   'from-slate-600 to-slate-900',
    'silver+': 'from-slate-500 to-slate-900',
    gold:     'from-yellow-700 to-slate-900',
    'gold+':  'from-yellow-600 to-slate-900',
    steel:    'from-blue-800 to-slate-900',
    ember:    'from-red-900 to-orange-950',
    obsidian: 'from-indigo-950 to-slate-950',
  }
  const bgGradient = themeGradients[rank.theme] || 'from-slate-800 to-slate-900'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />

      {/* Full-screen panel */}
      <div className={`fixed inset-0 z-50 bg-gradient-to-b ${bgGradient} flex flex-col items-center justify-center px-6 overflow-hidden`}>
        <Particles />

        <div
          className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ${
            appear ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-12'
          }`}
        >
          {/* "Rank Up!" label */}
          <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-6">
            Rank Up!
          </p>

          {/* Rank icon — big */}
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center mb-6 shadow-2xl ring-4 ring-white/20"
            style={{ backgroundColor: `${rank.colour}22`, border: `3px solid ${rank.colour}` }}
          >
            <span className="text-6xl leading-none">{rank.icon}</span>
          </div>

          {/* Rank title */}
          <h1 className="text-white text-4xl font-extrabold mb-1">{rank.title}</h1>
          <p className="text-slate-400 text-sm mb-6">Rank {rank.level} of 10</p>

          {/* Perk unlocked */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-8 max-w-xs w-full">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-wide mb-1.5">
              Perk Unlocked
            </p>
            <p className="text-white text-sm font-medium leading-snug">{rank.perk}</p>
          </div>

          {/* Points required label */}
          <p className="text-slate-500 text-xs mb-8">
            {rank.pointsRequired.toLocaleString()} FP milestone reached
          </p>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all duration-200 text-base min-h-[56px] shadow-lg shadow-orange-500/30"
          >
            Let's Go! 🔥
          </button>
        </div>
      </div>
    </>
  )
}

export default RankUpModal

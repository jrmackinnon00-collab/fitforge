/**
 * Achievements — full gallery of all badges + rank overview
 *
 * Tabs: All | Consistency | Strength | Plans | Streaks | Secret
 * Earned badges show full info. Locked visible badges show name + greyed out.
 * Locked hidden badges show "??? Secret Achievement" until earned.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Star } from 'lucide-react'
import { BADGES, BADGE_COUNTS } from '../data/badges'
import { getRankForPoints, getNextRank, getRankProgress, RANKS } from '../data/ranks'
import useAuthStore from '../store/useAuthStore'
import { useGamification } from '../hooks/useGamification'

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'strength',    label: 'Strength' },
  { id: 'plans',       label: 'Plans' },
  { id: 'streaks',     label: 'Streaks' },
  { id: 'secret',      label: 'Secret' },
]

// ─── Badge tile ───────────────────────────────────────────────────────────────
function BadgeTile({ badge, earned, earnedAt }) {
  if (!earned && badge.isHidden) {
    // Secret — locked
    return (
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center text-center border border-slate-200 dark:border-slate-700 opacity-60">
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
          <Lock size={22} className="text-slate-400" />
        </div>
        <p className="text-slate-400 font-semibold text-xs">??? Secret</p>
        <p className="text-slate-300 dark:text-slate-600 text-xs mt-0.5">Achievement</p>
      </div>
    )
  }

  const categoryColours = {
    consistency: 'from-blue-500 to-blue-700',
    strength:    'from-orange-500 to-red-600',
    plans:       'from-green-500 to-emerald-700',
    streaks:     'from-amber-500 to-orange-600',
    secret:      'from-purple-600 to-indigo-700',
  }
  const gradientClass = categoryColours[badge.category] || 'from-orange-500 to-red-600'

  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col items-center text-center border transition-all ${
        earned
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-50'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
          earned
            ? `bg-gradient-to-br ${gradientClass} shadow-md`
            : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span className={`text-2xl leading-none ${!earned ? 'grayscale opacity-40' : ''}`}>
          {badge.icon}
        </span>
      </div>

      {/* Badge name */}
      <p
        className={`font-bold text-xs leading-tight mb-0.5 ${
          earned ? 'text-slate-900 dark:text-white' : 'text-slate-400'
        }`}
      >
        {badge.name}
      </p>

      {/* Description */}
      <p className="text-slate-400 text-xs leading-tight mb-2 line-clamp-2">
        {badge.description}
      </p>

      {/* FP + earned date */}
      {earned ? (
        <div className="flex flex-col items-center gap-1">
          <div className="bg-orange-500/10 text-orange-500 text-xs font-bold rounded-lg px-2 py-0.5">
            +{badge.pointsAwarded} FP
          </div>
          {formattedDate && (
            <p className="text-slate-400 text-xs">{formattedDate}</p>
          )}
        </div>
      ) : (
        <div className="bg-slate-200 dark:bg-slate-700 text-slate-400 text-xs font-bold rounded-lg px-2 py-0.5">
          {badge.pointsAwarded} FP
        </div>
      )}
    </div>
  )
}

// ─── Rank ladder row ──────────────────────────────────────────────────────────
function RankRow({ rank, isCurrentRank, isEarned }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isCurrentRank
          ? 'bg-orange-500/10 border border-orange-500/30'
          : 'border border-transparent'
      }`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{
          backgroundColor: isEarned ? `${rank.colour}22` : undefined,
          border: isEarned ? `2px solid ${rank.colour}44` : '2px solid transparent',
          opacity: isEarned ? 1 : 0.35,
        }}
      >
        {isEarned ? rank.icon : <Lock size={16} className="text-slate-400" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-bold text-sm ${isEarned ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {rank.title}
          </p>
          {isCurrentRank && (
            <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              Current
            </span>
          )}
        </div>
        <p className="text-slate-400 text-xs truncate">{rank.perk}</p>
      </div>

      {/* Points required */}
      <p className={`text-xs font-semibold shrink-0 ${isEarned ? 'text-orange-500' : 'text-slate-400'}`}>
        {rank.pointsRequired.toLocaleString()} FP
      </p>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function Achievements() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { gamification, loading } = useGamification(user?.uid)

  // Active tab stored in URL hash for free navigation
  const hash = window.location.hash.replace('#', '') || 'all'
  const activeTab = TABS.find((t) => t.id === hash)?.id || 'all'
  const setTab = (id) => {
    window.location.hash = id
  }

  const totalPoints   = gamification?.totalPoints || 0
  const earnedBadges  = gamification?.earnedBadges || []
  const earnedMap     = Object.fromEntries(earnedBadges.map((b) => [b.badgeId, b.earnedAt]))
  const currentRank   = getRankForPoints(totalPoints)
  const nextRank      = getNextRank(currentRank.level)
  const progress      = getRankProgress(totalPoints)
  const streak        = gamification?.streakData?.currentStreakDays || 0

  const filteredBadges = activeTab === 'all'
    ? BADGES
    : BADGES.filter((b) => b.category === activeTab)

  const earnedCount   = earnedBadges.length
  const totalCount    = BADGES.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-400 text-sm">Loading achievements…</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Achievements</h1>
      </div>

      {/* Rank summary card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4 mb-4">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{
              backgroundColor: `${currentRank.colour}22`,
              border: `2px solid ${currentRank.colour}55`,
            }}
          >
            {currentRank.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-medium mb-0.5">Rank {currentRank.level} of 10</p>
            <p className="text-slate-900 dark:text-white font-extrabold text-xl leading-tight">
              {currentRank.title}
            </p>
            <p className="text-orange-500 font-bold text-sm">
              {totalPoints.toLocaleString()} FP total
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {nextRank ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-slate-400 text-xs">To {nextRank.title}</p>
              <p className="text-slate-400 text-xs">
                {(nextRank.pointsRequired - totalPoints).toLocaleString()} FP to go
              </p>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: currentRank.colour }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-500">
            <Star size={14} fill="currentColor" />
            <p className="text-sm font-bold">Maximum Rank Achieved — Prestige!</p>
          </div>
        )}

        {/* Mini stats */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-bold text-base">{streak}</p>
            <p className="text-slate-400 text-xs">day streak</p>
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-bold text-base">{earnedCount}</p>
            <p className="text-slate-400 text-xs">badges</p>
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-bold text-base">
              {gamification?.stats?.totalSessions || 0}
            </p>
            <p className="text-slate-400 text-xs">sessions</p>
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-bold text-base">
              {gamification?.perfectWeeks || 0}
            </p>
            <p className="text-slate-400 text-xs">perfect wks</p>
          </div>
        </div>
      </div>

      {/* Badge progress label */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Badges</h2>
        <p className="text-slate-400 text-sm font-medium">
          {earnedCount} / {totalCount}
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className={`ml-1 ${activeTab === tab.id ? 'text-white/70' : 'text-slate-400'}`}>
                {BADGE_COUNTS[tab.id] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredBadges.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            earned={!!earnedMap[badge.id]}
            earnedAt={earnedMap[badge.id]}
          />
        ))}
      </div>

      {/* Rank ladder */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Rank Ladder</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 space-y-1">
          {RANKS.map((rank) => (
            <RankRow
              key={rank.level}
              rank={rank}
              isCurrentRank={rank.level === currentRank.level}
              isEarned={totalPoints >= rank.pointsRequired}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Achievements

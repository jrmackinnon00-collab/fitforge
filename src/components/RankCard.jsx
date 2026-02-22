/**
 * RankCard — compact rank + FP + streak summary for the Dashboard
 *
 * Props:
 *   gamification  — gamification state object from useGamification
 *   onViewAll     — callback to navigate to Achievements screen
 */

import { useNavigate } from 'react-router-dom'
import { getRankForPoints, getNextRank, getRankProgress } from '../data/ranks'
import { ChevronRight, Flame, Star } from 'lucide-react'

export function RankCard({ gamification, onViewAll }) {
  const navigate = useNavigate()

  if (!gamification) return null

  const totalPoints = gamification.totalPoints || 0
  const rank        = getRankForPoints(totalPoints)
  const nextRank    = getNextRank(rank.level)
  const progress    = getRankProgress(totalPoints)
  const streak      = gamification.streakData?.currentStreakDays || 0
  const badges      = gamification.earnedBadges?.length || 0

  const handleViewAll = () => {
    if (onViewAll) onViewAll()
    else navigate('/dashboard/achievements')
  }

  // Progress bar colour matches rank colour
  const rankColour = rank.colour || '#f97316'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Rank icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${rankColour}22`, border: `2px solid ${rankColour}44` }}
          >
            {rank.icon}
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              Rank {rank.level}
            </p>
            <p className="text-slate-900 dark:text-white font-bold text-base leading-tight">
              {rank.title}
            </p>
          </div>
        </div>

        {/* FP total */}
        <div className="text-right">
          <p className="text-orange-500 font-extrabold text-lg leading-tight">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-slate-400 text-xs">FP</p>
        </div>
      </div>

      {/* Progress bar to next rank */}
      {nextRank && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-400 text-xs">Progress to {nextRank.title}</p>
            <p className="text-slate-400 text-xs">{progress}%</p>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: rankColour }}
            />
          </div>
          <p className="text-slate-400 text-xs mt-1 text-right">
            {(nextRank.pointsRequired - totalPoints).toLocaleString()} FP to go
          </p>
        </div>
      )}

      {/* Max rank */}
      {!nextRank && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 text-yellow-500">
            <Star size={13} fill="currentColor" />
            <p className="text-xs font-bold">Maximum Rank Achieved</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="border-t border-slate-100 dark:border-slate-700 flex divide-x divide-slate-100 dark:divide-slate-700">
        {/* Streak */}
        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <Flame size={14} className="text-orange-500" />
          <p className="text-slate-900 dark:text-white font-bold text-sm">{streak}</p>
          <p className="text-slate-400 text-xs">day streak</p>
        </div>

        {/* Badges */}
        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <span className="text-sm">🏅</span>
          <p className="text-slate-900 dark:text-white font-bold text-sm">{badges}</p>
          <p className="text-slate-400 text-xs">badges</p>
        </div>

        {/* View achievements */}
        <button
          onClick={handleViewAll}
          className="flex-1 flex flex-col items-center py-3 gap-0.5 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
        >
          <ChevronRight size={14} className="text-orange-500" />
          <p className="text-orange-500 font-bold text-xs">View All</p>
          <p className="text-slate-400 text-xs">achievements</p>
        </button>
      </div>
    </div>
  )
}

export default RankCard

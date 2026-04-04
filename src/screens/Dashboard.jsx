import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import RankCard from '../components/RankCard'
import { useGamification } from '../hooks/useGamification'
import { getRankForPoints } from '../data/ranks'
import { Dumbbell, Calendar, Flame, Trophy, Play, Trash2, TrendingUp, Zap, PersonStanding } from 'lucide-react'
import { ACTIVITY_MAP } from '../data/movementActivities'
import WorkoutDetailSheet from '../components/WorkoutDetailSheet'
import EditSessionSheet from '../components/EditSessionSheet'

// ─── Volume comparison helper ─────────────────────────────────────────────────
// volumeLbs should always be in lbs for threshold comparison.
// We convert the stored value to lbs if the user's unit is kg.
function getVolumeComparison(volume, unit) {
  const volumeLbs = unit === 'kg' ? volume * 2.205 : volume
  if (volumeLbs >= 1800000) return '🚀 More than a Space Shuttle!'
  if (volumeLbs >= 900000)  return '✈️ Heavier than a Boeing 747'
  if (volumeLbs >= 450000)  return '🗽 You\'ve lifted the Statue of Liberty'
  if (volumeLbs >= 300000)  return '🐳 That\'s a blue whale!'
  if (volumeLbs >= 100000)  return '🚌 A fully loaded school bus'
  if (volumeLbs >= 50000)   return '🐘 An African elephant!'
  if (volumeLbs >= 16000)   return '🚗 A full-size pickup truck'
  if (volumeLbs >= 6000)    return '🦏 A white rhino!'
  if (volumeLbs >= 2000)    return '🐂 A big ol\' bull!'
  return '💪 The journey starts here!'
}

function Dashboard() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const { gamification, rebuildGamification } = useGamification(user?.uid)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    workoutsThisMonth: 0,
    activePlanName: 'None',
    currentStreak: 0,
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [recentMovement, setRecentMovement] = useState([])
  const [movementThisWeek, setMovementThisWeek] = useState(0)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')

      // Fetch all sessions for total count
      const allSessionsSnap = await getDocs(sessionsRef)
      const totalWorkouts = allSessionsSnap.size

      // Sessions this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const monthQuery = query(
        sessionsRef,
        where('date', '>=', startOfMonth.toISOString().split('T')[0])
      )
      const monthSnap = await getDocs(monthQuery)
      const workoutsThisMonth = monthSnap.size

      // Recent sessions
      const recentQuery = query(sessionsRef, orderBy('date', 'desc'), limit(3))
      const recentSnap = await getDocs(recentQuery)
      const sessions = recentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Active plan
      const plansRef = collection(db, 'users', user.uid, 'plans')
      const activePlanQuery = query(plansRef, where('isActive', '==', true), limit(1))
      const activePlanSnap = await getDocs(activePlanQuery)
      let activePlanName = 'None'
      if (!activePlanSnap.empty) {
        activePlanName = activePlanSnap.docs[0].data().planName || 'Unnamed Plan'
      }

      // Movement data
      const movementRef = collection(db, 'users', user.uid, 'movement')
      const recentMovementQuery = query(movementRef, orderBy('date', 'desc'), limit(3))
      const recentMovementSnap = await getDocs(recentMovementQuery)
      const movementSessions = recentMovementSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setRecentMovement(movementSessions)

      // Movement sessions this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const movementWeekQuery = query(movementRef, where('date', '>=', weekStartStr))
      const movementWeekSnap = await getDocs(movementWeekQuery)
      setMovementThisWeek(movementWeekSnap.size)

      // Calculate streak
      const streak = calculateStreak(allSessionsSnap.docs.map((d) => d.data().date))

      setStats({
        totalWorkouts,
        workoutsThisMonth,
        activePlanName,
        currentStreak: streak,
      })
      setRecentSessions(sessions)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sessions', sessionId))
      setRecentSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setStats((prev) => ({ ...prev, totalWorkouts: Math.max(0, prev.totalWorkouts - 1) }))
      await rebuildGamification(profile)
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Failed to delete workout. Please try again.')
    }
  }

  const handleSessionSaved = async (updatedSession) => {
    setEditingSession(null)
    setSelectedSession(null)
    setRecentSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    )
    await rebuildGamification(profile)
  }

  const calculateStreak = (dates) => {
    if (!dates.length) return 0
    const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a))
    const today = new Date().toISOString().split('T')[0]
    // Streak is active only if the most recent workout was within the last 3 days
    const daysSinceLatest = Math.round(
      (new Date(today) - new Date(sortedDates[0])) / 86400000
    )
    if (daysSinceLatest > 3) return 0
    let streak = 1
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const gap = Math.round(
        (new Date(sortedDates[i]) - new Date(sortedDates[i + 1])) / 86400000
      )
      if (gap <= 3) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.displayName?.split(' ')[0] || 'Athlete'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {firstName} 👋
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div onClick={() => navigate('/dashboard/progress')} className="cursor-pointer active:scale-95 transition-transform">
          <StatCard
            title="Total Workouts ›"
            value={stats.totalWorkouts}
            icon={<Dumbbell size={20} />}
            color="orange"
          />
        </div>
        <StatCard
          title="This Month"
          value={stats.workoutsThisMonth}
          icon={<Calendar size={20} />}
          color="blue"
        />
        {/* Active Plan — tapping navigates to Plans */}
        <div onClick={() => navigate('/dashboard/plans')} className="cursor-pointer active:scale-95 transition-transform">
          <StatCard
            title="Active Plan ›"
            value={stats.activePlanName}
            icon={<Trophy size={20} />}
            color="green"
            small
          />
        </div>
        {/* Streak — always reads from gamification so it stays in sync with RankCard */}
        <StatCard
          title="Streak"
          value={`${gamification?.streakData?.currentStreakDays ?? stats.currentStreak} days`}
          icon={<Flame size={20} />}
          color="red"
        />
      </div>

      {/* Lifetime Volume Tile */}
      {gamification?.stats?.totalVolumeLbs > 0 && (() => {
        const unit = profile?.weightUnit || 'lbs'
        const volume = gamification.stats.totalVolumeLbs
        return (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide mb-1">
                  Lifetime Weight Lifted
                </p>
                <p className="text-3xl font-black leading-tight">
                  {Math.round(volume).toLocaleString()}
                  <span className="text-lg font-semibold ml-1 text-orange-200">{unit}</span>
                </p>
                <p className="text-orange-200 text-xs mt-1">
                  {getVolumeComparison(volume, unit)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Rank Card */}
      {gamification && (
        <RankCard
          gamification={gamification}
          onViewAll={() => navigate('/dashboard/achievements')}
        />
      )}

      {/* Weekly FP Summary — unlocked at Forgemaster (Rank 5) */}
      {(() => {
        const rankLevel = getRankForPoints(gamification?.totalPoints || 0).level
        if (rankLevel < 5 || !gamification?.pointsHistory?.length) return null
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const cutoff = sevenDaysAgo.toISOString()
        const weeklyFP = gamification.pointsHistory
          .filter((e) => e.timestamp >= cutoff)
          .reduce((sum, e) => sum + (e.points || 0), 0)
        const weeklyEvents = gamification.pointsHistory.filter((e) => e.timestamp >= cutoff).length
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">
                  This Week's Forge Points
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  +{weeklyFP.toLocaleString()}
                  <span className="text-base font-semibold ml-1 text-orange-500">FP</span>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {weeklyEvents} reward{weeklyEvents !== 1 ? 's' : ''} earned in the last 7 days
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Zap size={22} className="text-orange-500" />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Quick Start Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/dashboard/log')}
          className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 min-h-[56px] shadow-lg shadow-orange-500/20"
        >
          <Play size={20} fill="white" />
          Workout
        </button>
        <button
          onClick={() => navigate('/dashboard/movement')}
          className="flex-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 min-h-[56px]"
        >
          <PersonStanding size={20} />
          Movement
        </button>
      </div>

      {/* Movement Activity Tile */}
      <div
        onClick={() => navigate('/dashboard/movement')}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <PersonStanding size={16} className="text-blue-500" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Movement</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 rounded-full px-2.5 py-1">
              {movementThisWeek} this week
            </span>
            <span className="text-blue-500 text-sm font-medium">+ Log</span>
          </div>
        </div>

        {recentMovement.length === 0 ? (
          <p className="text-slate-400 text-sm">No movement logged yet — tap to add your first activity.</p>
        ) : (
          <div className="space-y-2">
            {recentMovement.map((m) => {
              const act = ACTIVITY_MAP[m.activityId]
              const distUnit = m.distanceUnit || 'miles'
              return (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{act?.icon || '💪'}</span>
                    <div>
                      <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-tight">
                        {m.activityLabel}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {m.duration} min
                        {m.distance ? ` · ${m.distance} ${distUnit}` : ''}
                        {m.steps ? ` · ${Number(m.steps).toLocaleString()} steps` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">{(() => {
                      const [y, mo, d] = m.date.split('-').map(Number)
                      return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    })()}</p>
                    {m.estimatedCalories > 0 && (
                      <p className="text-orange-500 text-xs font-semibold">{m.estimatedCalories} kcal</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Workouts</h2>
          <button
            onClick={() => navigate('/dashboard/progress')}
            className="text-orange-500 text-sm font-medium min-h-[44px] px-2"
          >
            View all
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="text-4xl mb-3">🏃</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No workouts yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Complete your first workout to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <Dumbbell size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {session.planName || 'Workout'}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {session.dayLabel || 'Training Session'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {formatDate(session.date)}
                      </p>
                      {session.duration && (
                        <p className="text-slate-400 text-xs">{session.duration} min</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete workout"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {session.exercises && session.exercises.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-xs">
                      {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
                      {session.exercises[0]?.name && ` • ${session.exercises.slice(0, 2).map(e => e.name).join(', ')}${session.exercises.length > 2 ? '...' : ''}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Detail Sheet */}
      {selectedSession && !editingSession && (
        <WorkoutDetailSheet
          session={selectedSession}
          unit={profile?.weightUnit || 'lbs'}
          onClose={() => setSelectedSession(null)}
          onEdit={(s) => { setEditingSession(s); setSelectedSession(null) }}
        />
      )}

      {/* Edit Session Sheet */}
      {editingSession && (
        <EditSessionSheet
          session={editingSession}
          unit={profile?.weightUnit || 'lbs'}
          onClose={() => setEditingSession(null)}
          onSaved={handleSessionSaved}
        />
      )}
    </div>
  )
}

export default Dashboard

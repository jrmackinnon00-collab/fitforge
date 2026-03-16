import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import RankCard from '../components/RankCard'
import { useGamification } from '../hooks/useGamification'
import { Dumbbell, Calendar, Flame, Trophy, Play, Trash2, TrendingUp } from 'lucide-react'
import WorkoutDetailSheet from '../components/WorkoutDetailSheet'

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
  const { gamification } = useGamification(user?.uid)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    workoutsThisMonth: 0,
    activePlanName: 'None',
    currentStreak: 0,
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)

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
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Failed to delete workout. Please try again.')
    }
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
        <StatCard
          title="Total Workouts"
          value={stats.totalWorkouts}
          icon={<Dumbbell size={20} />}
          color="orange"
        />
        <StatCard
          title="This Month"
          value={stats.workoutsThisMonth}
          icon={<Calendar size={20} />}
          color="blue"
        />
        <StatCard
          title="Active Plan"
          value={stats.activePlanName}
          icon={<Trophy size={20} />}
          color="green"
          small
        />
        <StatCard
          title="Streak"
          value={`${stats.currentStreak} days`}
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

      {/* Quick Start Button */}
      <button
        onClick={() => navigate('/dashboard/log')}
        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 min-h-[56px] shadow-lg shadow-orange-500/20"
      >
        <Play size={20} fill="white" />
        Start Today's Workout
      </button>

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
      {selectedSession && (
        <WorkoutDetailSheet
          session={selectedSession}
          unit={profile?.weightUnit || 'lbs'}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}

export default Dashboard

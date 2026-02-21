import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Dumbbell, Calendar, Flame, Trophy, Play } from 'lucide-react'

function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    workoutsThisMonth: 0,
    activePlanName: 'None',
    currentStreak: 0,
  })
  const [recentSessions, setRecentSessions] = useState([])

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

  const calculateStreak = (dates) => {
    if (!dates.length) return 0
    const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a))
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let checkDate = sortedDates[0] === today || sortedDates[0] === yesterday ? sortedDates[0] : null
    if (!checkDate) return 0

    for (let i = 0; i < sortedDates.length; i++) {
      if (sortedDates[i] === checkDate) {
        streak++
        const prev = new Date(checkDate)
        prev.setDate(prev.getDate() - 1)
        checkDate = prev.toISOString().split('T')[0]
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
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
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
                  <div className="text-right">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(session.date)}
                    </p>
                    {session.duration && (
                      <p className="text-slate-400 text-xs">{session.duration} min</p>
                    )}
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
    </div>
  )
}

export default Dashboard

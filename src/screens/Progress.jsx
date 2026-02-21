import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

const TABS = ['Overview', 'By Exercise', 'Consistency']

function Progress() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const [activeTab, setActiveTab] = useState(0)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState('')

  useEffect(() => {
    if (user) fetchSessions()
  }, [user])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const q = query(sessionsRef, orderBy('date', 'asc'))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setSessions(data)
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  // All exercise names from sessions
  const exerciseNames = useMemo(() => {
    const names = new Set()
    sessions.forEach((s) => {
      s.exercises?.forEach((e) => {
        if (e.name) names.add(e.name)
      })
    })
    return [...names].sort()
  }, [sessions])

  // Volume data (last 30 days)
  const volumeData = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const byDate = {}
    sessions.forEach((s) => {
      if (!s.date || new Date(s.date) < thirtyDaysAgo) return
      let vol = 0
      s.exercises?.forEach((ex) => {
        ex.sets?.forEach((set) => {
          const w = parseFloat(set.weight) || 0
          const r = parseInt(set.reps) || 0
          vol += w * r
        })
      })
      byDate[s.date] = (byDate[s.date] || 0) + vol
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, volume]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume),
      }))
  }, [sessions])

  // Heatmap data
  const heatmapData = useMemo(() => {
    const byDate = {}
    sessions.forEach((s) => {
      if (s.date) byDate[s.date] = (byDate[s.date] || 0) + 1
    })
    return Object.entries(byDate).map(([date, count]) => ({ date, count }))
  }, [sessions])

  // Streak
  const streak = useMemo(() => {
    const dates = [...new Set(sessions.map((s) => s.date))].sort(
      (a, b) => new Date(b) - new Date(a)
    )
    if (!dates.length) return 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    let check = dates[0] === today || dates[0] === yesterday ? dates[0] : null
    if (!check) return 0
    let count = 0
    for (const d of dates) {
      if (d === check) {
        count++
        const prev = new Date(check)
        prev.setDate(prev.getDate() - 1)
        check = prev.toISOString().split('T')[0]
      } else break
    }
    return count
  }, [sessions])

  // Exercise-specific data
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return { maxWeight: [], volume: [], pr: null }
    const byDate = {}
    sessions.forEach((s) => {
      const ex = s.exercises?.find(
        (e) => e.name?.toLowerCase() === selectedExercise.toLowerCase()
      )
      if (!ex) return
      let maxW = 0
      let vol = 0
      ex.sets?.forEach((set) => {
        const w = parseFloat(set.weight) || 0
        const r = parseInt(set.reps) || 0
        if (w > maxW) maxW = w
        vol += w * r
      })
      if (!byDate[s.date] || byDate[s.date].maxWeight < maxW) {
        byDate[s.date] = { maxWeight: maxW, volume: vol }
      }
    })
    const entries = Object.entries(byDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, d]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        maxWeight: d.maxWeight,
        volume: Math.round(d.volume),
      }))
    const pr = entries.length
      ? entries.reduce((max, e) => (e.maxWeight > max.maxWeight ? e : max), entries[0])
      : null
    return { maxWeight: entries, volume: entries, pr }
  }, [selectedExercise, sessions])

  // Weekly consistency data (last 12 weeks)
  const weeklyData = useMemo(() => {
    const weeks = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const count = sessions.filter((s) => {
        const d = new Date(s.date)
        return d >= weekStart && d <= weekEnd
      }).length
      weeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: count,
      })
    }
    return weeks
  }, [sessions])

  const unit = profile.weightUnit || 'lbs'

  const chartTooltipStyle = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#F8FAFC',
    fontSize: 12,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const heatmapStart = new Date()
  heatmapStart.setMonth(heatmapStart.getMonth() - 6)
  const heatmapEnd = new Date()

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Progress</h1>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === i
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Streak Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 text-xs font-medium mb-1">Current Streak</p>
              <p className="text-3xl font-black text-orange-500">{streak}</p>
              <p className="text-slate-400 text-xs">days</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 text-xs font-medium mb-1">Total Workouts</p>
              <p className="text-3xl font-black text-blue-500">{sessions.length}</p>
              <p className="text-slate-400 text-xs">all time</p>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Total Volume (30 days)
            </h2>
            {volumeData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v) => [`${v.toLocaleString()} ${unit}`, 'Volume']}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#F97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-slate-400 text-sm">Log workouts to see your volume chart</p>
              </div>
            )}
          </div>

          {/* Calendar Heatmap */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Workout Calendar
            </h2>
            <CalendarHeatmap
              startDate={heatmapStart}
              endDate={heatmapEnd}
              values={heatmapData}
              classForValue={(value) => {
                if (!value) return 'color-empty'
                if (value.count === 1) return 'color-scale-2'
                if (value.count === 2) return 'color-scale-3'
                return 'color-scale-4'
              }}
              tooltipDataAttrs={(value) => ({
                'data-tip': value?.date
                  ? `${value.date}: ${value.count} workout${value.count !== 1 ? 's' : ''}`
                  : 'No workout',
              })}
            />
          </div>
        </div>
      )}

      {/* Tab 2: By Exercise */}
      {activeTab === 1 && (
        <div className="space-y-6">
          {/* Exercise Selector */}
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px]"
          >
            <option value="">Select an exercise</option>
            {exerciseNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {selectedExercise && exerciseData.pr && (
            <>
              {/* PR Badge */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
                <p className="text-orange-100 text-xs font-semibold mb-1">PERSONAL RECORD</p>
                <p className="text-3xl font-black">{exerciseData.pr.maxWeight} {unit}</p>
                <p className="text-orange-200 text-xs mt-1">on {exerciseData.pr.date}</p>
              </div>

              {/* Max Weight Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Max Weight Over Time ({unit})
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={exerciseData.maxWeight}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [`${v} ${unit}`, 'Max Weight']}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#F97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Volume Over Time ({unit})
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={exerciseData.volume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [`${v.toLocaleString()} ${unit}`, 'Volume']}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {selectedExercise && !exerciseData.pr && (
            <div className="text-center py-12">
              <p className="text-slate-400">No data for {selectedExercise} yet</p>
            </div>
          )}

          {!selectedExercise && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-slate-400">Select an exercise to view progress</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Consistency */}
      {activeTab === 2 && (
        <div className="space-y-6">
          {/* Weekly Frequency Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Weekly Frequency (last 12 weeks)
            </h2>
            {weeklyData.some((w) => w.workouts > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={20}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v) => [v, 'Workouts']}
                  />
                  <Bar
                    dataKey="workouts"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <p className="text-slate-400 text-sm">No workouts logged yet</p>
              </div>
            )}
          </div>

          {/* Calendar Heatmap */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Activity Calendar
            </h2>
            <CalendarHeatmap
              startDate={heatmapStart}
              endDate={heatmapEnd}
              values={heatmapData}
              classForValue={(value) => {
                if (!value) return 'color-empty'
                if (value.count === 1) return 'color-scale-2'
                if (value.count === 2) return 'color-scale-3'
                return 'color-scale-4'
              }}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Avg per week</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {weeklyData.length
                  ? (weeklyData.reduce((a, w) => a + w.workouts, 0) / weeklyData.filter(w => w.workouts > 0).length || 0).toFixed(1)
                  : '0'}
              </p>
              <p className="text-slate-400 text-xs">workouts</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Best week</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {Math.max(...weeklyData.map((w) => w.workouts), 0)}
              </p>
              <p className="text-slate-400 text-xs">workouts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress

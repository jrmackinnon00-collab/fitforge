import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, ChevronDown, ChevronUp, Check, Clock, Calendar, Info, X } from 'lucide-react'

// ─── RPE Info Popover ─────────────────────────────────────────────────────────
const RPE_SCALE = [
  { level: '10', desc: 'Absolute maximum — could not do 1 more rep' },
  { level: '9',  desc: 'Could maybe do 1 more rep' },
  { level: '8',  desc: '2 reps left in the tank' },
  { level: '7',  desc: '3 reps left — challenging but comfortable' },
  { level: '6',  desc: '4+ reps left — moderate effort' },
  { level: '≤5', desc: 'Light / warm-up effort' },
]

function RPEPopover({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end px-4 pb-6 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-base">Rate of Perceived Exertion</h3>
            <p className="text-slate-400 text-xs mt-0.5">How hard did that set feel? (scale 1–10)</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:text-white shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-1.5">
          {RPE_SCALE.map(({ level, desc }) => (
            <div key={level} className="flex items-start gap-3 py-1.5 px-3 rounded-xl bg-slate-700/50">
              <span className="shrink-0 w-8 text-center font-bold text-orange-400 text-sm pt-0.5">
                {level}
              </span>
              <span className="text-slate-300 text-sm">{desc}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs mt-4 text-center">
          Tip: Most working sets should fall between RPE 7–9
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Parse the lower bound of a reps string like "8-12", "10", "8-10"
function parseLowReps(repsStr) {
  if (!repsStr) return ''
  const match = String(repsStr).match(/(\d+)/)
  return match ? match[1] : ''
}

// Build the initial set rows for an exercise using the plan's set count
function buildSets(plannedSets, plannedReps) {
  const count = Math.max(1, parseInt(plannedSets) || 1)
  const repHint = parseLowReps(plannedReps)
  return Array.from({ length: count }, () => ({
    reps: repHint,   // pre-fill with low end of planned reps range
    weight: '',
    rpe: 7,
    notes: '',
  }))
}

// Format today's date as YYYY-MM-DD in local time (not UTC)
function todayLocal() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Display a YYYY-MM-DD string as a friendly label
function formatDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── LogWorkout ───────────────────────────────────────────────────────────────
function LogWorkout() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const startTimeRef = useRef(Date.now())
  const dateInputRef = useRef(null)

  const [date, setDate] = useState(todayLocal())
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [exercises, setExercises] = useState([])
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previousPerformance, setPreviousPerformance] = useState({})
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [showRPEInfo, setShowRPEInfo] = useState(false)

  useEffect(() => {
    if (user) fetchPlans()
    const timer = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - startTimeRef.current) / 60000))
    }, 60000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    if (selectedPlanId && plans.length > 0) {
      const plan = plans.find((p) => p.id === selectedPlanId)
      if (plan?.days?.[selectedDayIndex]) {
        const planExercises = plan.days[selectedDayIndex].exercises || []
        const logExercises = planExercises.map((ex) => ({
          name: ex.name,
          plannedSets: ex.sets,
          plannedReps: ex.reps,
          rest: ex.rest,
          // Pre-populate one row per planned set, with reps hint from plan
          sets: buildSets(ex.sets, ex.reps),
        }))
        setExercises(logExercises)
        fetchPreviousPerformance(planExercises.map((e) => e.name))
      }
    }
  }, [selectedPlanId, selectedDayIndex, plans])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const plansRef = collection(db, 'users', user.uid, 'plans')
      const snap = await getDocs(plansRef)
      const planList = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => !p.archived)
      setPlans(planList)

      const activePlan = planList.find((p) => p.isActive)
      if (activePlan) {
        setSelectedPlanId(activePlan.id)
      } else if (planList.length > 0) {
        setSelectedPlanId(planList[0].id)
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviousPerformance = async (exerciseNames) => {
    try {
      const perf = {}
      for (const name of exerciseNames) {
        const sessionsRef = collection(db, 'users', user.uid, 'sessions')
        const q = query(sessionsRef, orderBy('date', 'desc'), limit(10))
        const snap = await getDocs(q)
        for (const doc of snap.docs) {
          const session = doc.data()
          const ex = session.exercises?.find(
            (e) => e.name?.toLowerCase() === name?.toLowerCase()
          )
          if (ex && ex.sets?.length > 0) {
            const lastSet = ex.sets[ex.sets.length - 1]
            perf[name] = `${ex.sets.length}x${lastSet.reps} @ ${lastSet.weight} ${profile.weightUnit || 'lbs'}`
            break
          }
        }
      }
      setPreviousPerformance(perf)
    } catch (err) {
      console.error('Error fetching previous performance:', err)
    }
  }

  const addSet = (exerciseIndex) => {
    const updated = [...exercises]
    const lastSet = updated[exerciseIndex].sets.at(-1)
    // Copy previous set's reps/weight as a convenient starting point
    updated[exerciseIndex].sets.push({
      reps: lastSet?.reps ?? '',
      weight: lastSet?.weight ?? '',
      rpe: lastSet?.rpe ?? 7,
      notes: '',
    })
    setExercises(updated)
  }

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises]
    updated[exerciseIndex].sets[setIndex][field] = value
    setExercises(updated)
  }

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises]
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1)
      setExercises(updated)
    }
  }

  const handleFinishWorkout = async () => {
    setSaving(true)
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 60000)
      const selectedPlan = plans.find((p) => p.id === selectedPlanId)
      const dayLabel = selectedPlan?.days?.[selectedDayIndex]?.dayLabel || 'Training Session'

      const sessionData = {
        date,
        planId: selectedPlanId || null,
        planName: selectedPlan?.planName || null,
        dayLabel,
        dayIndex: selectedDayIndex,
        exercises: exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.filter((s) => s.reps !== '' || s.weight !== ''),
        })),
        notes: sessionNotes,
        duration: duration > 0 ? duration : 1,
        completedAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error saving session:', err)
      alert('Error saving workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const selectedDay  = selectedPlan?.days?.[selectedDayIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Log Workout</h1>
        <div className="flex items-center gap-1 text-slate-400 text-sm">
          <Clock size={14} />
          <span>{elapsedMinutes} min</span>
        </div>
      </div>

      {/* ── Date Picker ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
          Date
        </label>
        {/* Styled button that opens the hidden native date input */}
        <div className="relative">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
            className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 hover:border-orange-400 focus:border-orange-500 focus:outline-none text-sm min-h-[48px] transition-colors"
          >
            <Calendar size={17} className="text-orange-500 shrink-0" />
            <span className="flex-1 text-left font-medium">
              {formatDisplayDate(date)}
            </span>
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          </button>
          {/* Hidden native input — positioned on top so its picker sheet opens correctly */}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            style={{ zIndex: -1 }}
          />
        </div>
      </div>

      {/* Plan Selector */}
      {plans.length > 0 && (
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Plan</label>
          <select
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value)
              setSelectedDayIndex(0)
            }}
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px]"
          >
            <option value="">No plan (free session)</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.planName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Day Selector */}
      {selectedPlan?.days && selectedPlan.days.length > 1 && (
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">Training Day</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {selectedPlan.days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedDayIndex === index
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {day.dayLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {selectedDay?.dayLabel || 'Exercises'}
          </h2>

          {exercises.map((exercise, exIndex) => (
            <div
              key={exIndex}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Exercise Header */}
              <button
                onClick={() => setExpandedExercise(expandedExercise === exIndex ? null : exIndex)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{exercise.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {exercise.plannedSets}×{exercise.plannedReps}
                    {exercise.rest && ` • ${exercise.rest} rest`}
                  </p>
                  {previousPerformance[exercise.name] && (
                    <p className="text-orange-400 text-xs mt-0.5">
                      Last: {previousPerformance[exercise.name]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Completed-sets badge */}
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      exercise.sets.filter((s) => s.reps !== '').length === exercise.sets.length
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {exercise.sets.filter((s) => s.reps !== '').length}/{exercise.sets.length} sets
                  </span>
                  {expandedExercise === exIndex ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Set Logger */}
              {expandedExercise === exIndex && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-4">
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                    <span className="col-span-1 text-slate-400 text-xs font-medium text-center">#</span>
                    <span className="col-span-4 text-slate-400 text-xs font-medium text-center">
                      Reps
                    </span>
                    <span className="col-span-4 text-slate-400 text-xs font-medium text-center">
                      {profile.weightUnit || 'lbs'}
                    </span>
                    {/* RPE header with info button */}
                    <button
                      onClick={() => setShowRPEInfo(true)}
                      className="col-span-2 flex items-center justify-center gap-0.5 text-slate-400 hover:text-orange-400 transition-colors"
                    >
                      <span className="text-xs font-medium">RPE</span>
                      <Info size={11} />
                    </button>
                    <span className="col-span-1"></span>
                  </div>

                  {/* Sets */}
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      {/* Set number — turns green when reps filled in */}
                      <span
                        className={`col-span-1 text-center text-xs font-bold ${
                          set.reps !== '' ? 'text-green-500' : 'text-slate-400'
                        }`}
                      >
                        {setIndex + 1}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.reps}
                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                        placeholder={exercise.plannedReps?.split('-')[0] || '0'}
                        className="col-span-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none min-h-[40px]"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                        placeholder="0"
                        className="col-span-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none min-h-[40px]"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.rpe}
                        onChange={(e) =>
                          updateSet(
                            exIndex, setIndex, 'rpe',
                            Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                          )
                        }
                        min={1}
                        max={10}
                        className="col-span-2 w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-1 py-2 text-sm text-center border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none min-h-[40px]"
                      />
                      <button
                        onClick={() => removeSet(exIndex, setIndex)}
                        className="col-span-1 w-6 h-6 flex items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors mx-auto"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add Set Button */}
                  <button
                    onClick={() => addSet(exIndex)}
                    className="w-full py-2 mt-2 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-orange-500 hover:border-orange-500 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    Add Set
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-sm">
            {selectedPlanId
              ? 'This day has no exercises. Edit your plan to add some.'
              : 'Select a plan to load exercises, or log a free session.'}
          </p>
        </div>
      )}

      {/* Session Notes */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
          Session Notes (optional)
        </label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="How did it go? Any PRs, injuries, energy level..."
          rows={3}
          className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm resize-none"
        />
      </div>

      {/* Finish Button */}
      <button
        onClick={handleFinishWorkout}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 min-h-[56px] active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-orange-500/20"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Check size={20} />
            Finish Workout
          </>
        )}
      </button>

      {/* RPE Info Sheet */}
      {showRPEInfo && <RPEPopover onClose={() => setShowRPEInfo(false)} />}
    </div>
  )
}

export default LogWorkout

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import useThemeStore from '../store/useThemeStore'
import useWorkoutDraftStore from '../store/useWorkoutDraftStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { FPToast } from '../components/FPToast'
import { BadgeUnlockModal } from '../components/BadgeUnlockModal'
import { RankUpModal } from '../components/RankUpModal'
import { useGamification } from '../hooks/useGamification'
import { Plus, ChevronDown, ChevronUp, Check, Clock, Calendar, Info, X, Youtube, Trash2 } from 'lucide-react'
import { exercises as exerciseLibrary } from '../data/exercises'

// ─── Exercise library lookup (mirrors PlanEditor) ─────────────────────────────
function findLibraryEntry(exerciseName) {
  if (!exerciseName) return null
  const needle = exerciseName.toLowerCase().trim()
  let found = exerciseLibrary.find((e) => e.name.toLowerCase() === needle)
  if (found) return found
  found = exerciseLibrary.find((e) => e.name.toLowerCase().includes(needle))
  if (found) return found
  found = exerciseLibrary.find((e) => needle.includes(e.name.toLowerCase()))
  if (found) return found
  const words = needle.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const tail = words.slice(-2).join(' ')
    found = exerciseLibrary.find((e) => e.name.toLowerCase().includes(tail))
    if (found) return found
  }
  return null
}

// ─── Technique Popover ────────────────────────────────────────────────────────
function TechniquePopover({ exerciseName, onClose }) {
  const libEntry = findLibraryEntry(exerciseName)
  if (!libEntry) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end px-4 pb-6 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <h3 className="text-white font-bold text-base">{libEntry.name}</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {libEntry.primaryMuscles.join(' · ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
        <span
          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${
            libEntry.type === 'Compound'
              ? 'bg-orange-500/15 text-orange-400'
              : 'bg-blue-500/15 text-blue-400'
          }`}
        >
          {libEntry.type}
        </span>
        <div className="bg-slate-700/50 rounded-2xl p-4 mb-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            {libEntry.techniqueDescription}
          </p>
        </div>
        {libEntry.youtubeUrl && (
          <a
            href={libEntry.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-semibold text-sm transition-colors active:scale-95"
          >
            <Youtube size={18} />
            Watch Demo on YouTube
          </a>
        )}
      </div>
    </div>
  )
}

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
  const { syncRankTheme } = useThemeStore()
  const { draft: storedDraft, saveDraft, clearDraft } = useWorkoutDraftStore()
  const navigate = useNavigate()
  const { processSession } = useGamification(user?.uid)

  // Restore an in-progress draft for this user (evaluated once at mount)
  const restoredDraft = storedDraft?.userId === user?.uid ? storedDraft : null
  // Prevents the plan-exercise effect from overwriting restored exercises (cleared after first fire)
  const skipExercisePopulateRef = useRef(!!restoredDraft)
  // Prevents fetchPlans from overriding the draft's plan selection (cleared after fetchPlans runs)
  const skipPlanAutoSelectRef = useRef(!!restoredDraft)
  // Names of draft exercises, used to prefetch previous performance on resume
  const draftExerciseNamesRef = useRef(restoredDraft?.exercises?.map((e) => e.name) ?? null)

  const startTimeRef = useRef(restoredDraft?.startTime ?? Date.now())
  const dateInputRef = useRef(null)

  const [date, setDate] = useState(restoredDraft?.date ?? todayLocal())
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(restoredDraft?.selectedPlanId ?? '')
  const [selectedDayIndex, setSelectedDayIndex] = useState(restoredDraft?.selectedDayIndex ?? 0)
  const [exercises, setExercises] = useState(restoredDraft?.exercises ?? [])
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [sessionNotes, setSessionNotes] = useState(restoredDraft?.sessionNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previousPerformance, setPreviousPerformance] = useState({})
  const [elapsedMinutes, setElapsedMinutes] = useState(
    restoredDraft ? Math.floor((Date.now() - restoredDraft.startTime) / 60000) : 0
  )
  const [showRPEInfo, setShowRPEInfo] = useState(false)
  const [techniqueExercise, setTechniqueExercise] = useState(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Gamification reward state
  const [fpEvents, setFpEvents] = useState([])
  const [pendingBadges, setPendingBadges] = useState([])
  const [rankUpData, setRankUpData] = useState(null)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showRankModal, setShowRankModal] = useState(false)

  useEffect(() => {
    if (user) fetchPlans()
    const timer = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - startTimeRef.current) / 60000))
    }, 60000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    // On first load after a draft restore, keep the draft exercises as-is
    if (skipExercisePopulateRef.current) {
      skipExercisePopulateRef.current = false
      if (draftExerciseNamesRef.current) {
        fetchPreviousPerformance(draftExerciseNamesRef.current)
        draftExerciseNamesRef.current = null
      }
      return
    }
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

  // Persist draft to localStorage on every meaningful change
  useEffect(() => {
    if (loading || !user || exercises.length === 0) return
    saveDraft({
      userId: user.uid,
      date,
      selectedPlanId,
      selectedDayIndex,
      exercises,
      sessionNotes,
      startTime: startTimeRef.current,
    })
  }, [date, selectedPlanId, selectedDayIndex, exercises, sessionNotes, loading, user, saveDraft])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const plansRef = collection(db, 'users', user.uid, 'plans')
      const snap = await getDocs(plansRef)
      const planList = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => !p.archived)
      setPlans(planList)

      // Don't override plan selection when resuming a draft
      if (skipPlanAutoSelectRef.current) {
        skipPlanAutoSelectRef.current = false
      } else {
        const activePlan = planList.find((p) => p.isActive)
        if (activePlan) {
          setSelectedPlanId(activePlan.id)
        } else if (planList.length > 0) {
          setSelectedPlanId(planList[0].id)
        }
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
            // Store the last 3 sets as structured data so the UI can render them individually
            const last3 = ex.sets.slice(-3)
            perf[name] = {
              date: session.date,
              sets: last3.map((s) => ({
                reps: s.reps,
                weight: s.weight,
                rpe: s.rpe,
              })),
            }
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

  const removeExercise = (exerciseIndex) => {
    const updated = exercises.filter((_, i) => i !== exerciseIndex)
    setExercises(updated)
    if (expandedExercise === exerciseIndex) setExpandedExercise(null)
    else if (expandedExercise > exerciseIndex) setExpandedExercise(expandedExercise - 1)
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
      clearDraft()

      // ── Gamification engine ──────────────────────────────────────────────────
      let hasBadgeModal = false
      let hasRankModal  = false
      let hasToasts     = false
      try {
        const rewards = await processSession(sessionData, selectedPlan, profile)
        if (rewards) {
          const { fpEvents: events, newBadges, rankUp } = rewards

          // FP toasts — shown while still on this screen
          if (events?.length) {
            setFpEvents(events)
            hasToasts = true
          }

          // Badge modal — stays on LogWorkout until user dismisses
          if (newBadges?.length) {
            setPendingBadges(newBadges)
            setShowBadgeModal(true)
            hasBadgeModal = true
          }

          // Rank-up modal — after badges, or immediately if no badges
          if (rankUp) {
            syncRankTheme(rankUp.level) // apply the new rank's app theme immediately
            setRankUpData(rankUp)
            hasRankModal = true
            if (!newBadges?.length) setShowRankModal(true)
          }
        }
      } catch (gamErr) {
        // Gamification errors should never block the workout save
        console.error('Gamification error:', gamErr)
      }

      // If modals are showing, they handle their own navigation when closed.
      // If only toasts (no modals), handleToastsDone will navigate when finished.
      // If no rewards at all, navigate immediately.
      if (!hasBadgeModal && !hasRankModal && !hasToasts) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error saving session:', err)
      alert('Error saving workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Called when badge modal closes — show rank-up if pending, else navigate
  const handleBadgeModalClose = () => {
    setShowBadgeModal(false)
    if (rankUpData) {
      setShowRankModal(true)
    } else {
      navigate('/dashboard')
    }
  }

  // Called when rank-up modal closes
  const handleRankModalClose = () => {
    setShowRankModal(false)
    navigate('/dashboard')
  }

  // Called when all FP toasts have cycled through
  // If no modals are showing, navigate to dashboard now
  const handleToastsDone = () => {
    setFpEvents([])
    if (!showBadgeModal && !showRankModal) {
      navigate('/dashboard')
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
                    <div className="mt-1.5">
                      <p className="text-slate-500 text-xs mb-1">
                        Last {previousPerformance[exercise.name].date}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {previousPerformance[exercise.name].sets.map((s, i) => {
                          const rpe = Number(s.rpe)
                          const rpeColor =
                            rpe >= 9
                              ? 'text-red-400'
                              : rpe >= 7
                              ? 'text-orange-400'
                              : 'text-green-400'
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-slate-700/60 rounded-lg px-2 py-1 text-xs"
                            >
                              <span className="text-white font-medium">
                                {s.reps}r × {s.weight}{profile.weightUnit || 'lbs'}
                              </span>
                              {s.rpe != null && s.rpe !== '' && (
                                <span className={`font-semibold ${rpeColor}`}>
                                  @{s.rpe}
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Technique info button */}
                  {findLibraryEntry(exercise.name) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setTechniqueExercise(exercise.name) }}
                      className="w-8 h-8 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors"
                      title="Form tips"
                    >
                      <Info size={15} />
                    </button>
                  )}
                  {/* YouTube link */}
                  {findLibraryEntry(exercise.name)?.youtubeUrl && (
                    <a
                      href={findLibraryEntry(exercise.name).youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                      title="Watch on YouTube"
                    >
                      <Youtube size={15} />
                    </a>
                  )}
                  {/* Remove exercise */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeExercise(exIndex) }}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                    title="Remove exercise"
                  >
                    <Trash2 size={15} />
                  </button>
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
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') {
                            updateSet(exIndex, setIndex, 'rpe', '')
                          } else {
                            const num = parseInt(raw)
                            if (!isNaN(num)) {
                              updateSet(exIndex, setIndex, 'rpe', Math.min(10, Math.max(1, num)))
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value)
                          updateSet(exIndex, setIndex, 'rpe', isNaN(val) ? 7 : Math.min(10, Math.max(1, val)))
                        }}
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

      {/* Discard workout */}
      {showDiscardConfirm ? (
        <div className="flex gap-3">
          <button
            onClick={() => { clearDraft(); navigate('/dashboard') }}
            className="flex-1 py-3 rounded-2xl text-red-500 border border-red-500/30 bg-red-500/10 text-sm font-semibold active:scale-95 transition-all"
          >
            Yes, discard
          </button>
          <button
            onClick={() => setShowDiscardConfirm(false)}
            className="flex-1 py-3 rounded-2xl text-slate-400 border border-slate-200 dark:border-slate-700 text-sm font-semibold active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowDiscardConfirm(true)}
          className="w-full py-2 text-slate-400 text-sm font-medium text-center"
        >
          Discard workout
        </button>
      )}

      {/* RPE Info Sheet */}
      {showRPEInfo && <RPEPopover onClose={() => setShowRPEInfo(false)} />}

      {/* Technique Popover */}
      {techniqueExercise && (
        <TechniquePopover
          exerciseName={techniqueExercise}
          onClose={() => setTechniqueExercise(null)}
        />
      )}

      {/* ── Gamification overlays ─────────────────────────────────────────── */}
      {/* FP toasts — appear bottom of screen during save */}
      <FPToast events={fpEvents} onDone={handleToastsDone} />

      {/* Badge unlock modal */}
      {showBadgeModal && (
        <BadgeUnlockModal badges={pendingBadges} onClose={handleBadgeModalClose} />
      )}

      {/* Rank-up modal */}
      {showRankModal && (
        <RankUpModal rank={rankUpData} onClose={handleRankModalClose} />
      )}
    </div>
  )
}

export default LogWorkout

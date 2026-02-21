import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import { useClaudeAI } from '../hooks/useClaudeAI'
import { exercises as exerciseLibrary } from '../data/exercises'
import ExercisePicker from './ExercisePicker'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  ChevronLeft, Sparkles, Plus, ChevronDown, ChevronUp,
  Trash2, X, GripVertical, Info, Youtube, Settings2
} from 'lucide-react'

// ─── AI Options Sheet ─────────────────────────────────────────────────────────
const SPLIT_OPTIONS = [
  { value: 'push_pull_legs', label: 'Push / Pull / Legs' },
  { value: 'upper_lower', label: 'Upper / Lower' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'bro_split', label: 'Body Part Split' },
  { value: 'arnold_split', label: 'Arnold Split' },
]
const SESSION_LENGTHS = ['30', '45', '60', '75', '90', '120']

function AIOptionsSheet({ profile, onGenerate, onClose }) {
  const [split, setSplit] = useState(profile.splitPreference || 'push_pull_legs')
  const [days, setDays] = useState(profile.daysPerWeek || 4)
  const [sessionLength, setSessionLength] = useState(profile.sessionLength || '60')
  const [supersets, setSupersets] = useState(false)

  const handleGenerate = () => {
    onGenerate({ split, days, sessionLength, supersets })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Plan Options</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Preferred Split */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Training Split
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SPLIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSplit(opt.value)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    split === opt.value
                      ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days per week */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Days Per Week: <span className="text-orange-500">{days}</span>
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    days === d
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Session length */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Session Length
            </label>
            <div className="flex flex-wrap gap-2">
              {SESSION_LENGTHS.map((len) => (
                <button
                  key={len}
                  onClick={() => setSessionLength(len)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    sessionLength === len
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {len === '120' ? '2h' : `${len}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Supersets toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Include Supersets</p>
              <p className="text-xs text-slate-400 mt-0.5">Pair exercises back-to-back to save time</p>
            </div>
            <button
              onClick={() => setSupersets(!supersets)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                supersets ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  supersets ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
        >
          <Sparkles size={20} />
          Generate My Plan
        </button>
      </div>
    </div>
  )
}

// ─── Fuzzy exercise library lookup ────────────────────────────────────────────
// Tries exact match first, then falls back to "does one name contain the other"
// so AI-generated names like "Bench Press" still match "Barbell Bench Press".
function findLibraryEntry(exerciseName) {
  if (!exerciseName) return null
  const needle = exerciseName.toLowerCase().trim()

  // 1. Exact match
  let found = exerciseLibrary.find((e) => e.name.toLowerCase() === needle)
  if (found) return found

  // 2. Library name contains the exercise name  (e.g. "Barbell Bench Press" ⊇ "Bench Press")
  found = exerciseLibrary.find((e) => e.name.toLowerCase().includes(needle))
  if (found) return found

  // 3. Exercise name contains the library name  (e.g. "Romanian Deadlift Dumbbell" ⊇ "Romanian Deadlift")
  found = exerciseLibrary.find((e) => needle.includes(e.name.toLowerCase()))
  if (found) return found

  // 4. Last two significant words match  (e.g. "Lat Pulldown" matches "Cable Lat Pulldown")
  const words = needle.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const tail = words.slice(-2).join(' ')
    found = exerciseLibrary.find((e) => e.name.toLowerCase().includes(tail))
    if (found) return found
  }

  return null
}

// ─── Technique Popover ────────────────────────────────────────────────────────
function TechniquePopover({ exercise, onClose }) {
  const libEntry = findLibraryEntry(exercise.name)
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

// ─── Exercise Row ─────────────────────────────────────────────────────────────
function ExerciseRow({
  exercise, dayIndex, exIndex,
  onUpdate, onRemove,
  onGripPointerDown,
  isDragging,
}) {
  const [showPopover, setShowPopover] = useState(false)
  const libEntry = findLibraryEntry(exercise.name)

  return (
    <>
      <div
        data-day={dayIndex}
        data-index={exIndex}
        className={`px-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 select-none transition-all ${
          isDragging ? 'opacity-40 bg-orange-500/5 scale-[0.98]' : 'opacity-100'
        }`}
      >
        {/* Top row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Grip handle — only element that initiates drag */}
          <div
            className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-500 shrink-0 touch-none p-0.5"
            onPointerDown={(e) => onGripPointerDown(e, exIndex, dayIndex)}
          >
            <GripVertical size={17} />
          </div>

          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onUpdate(dayIndex, exIndex, 'name', e.target.value)}
            className="flex-1 bg-transparent text-slate-900 dark:text-white font-medium text-sm focus:outline-none border-b border-transparent focus:border-orange-500 pb-0.5 min-w-0"
            placeholder="Exercise name"
          />

          {libEntry && (
            <button
              onClick={() => setShowPopover(true)}
              title="Form tips"
              className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors shrink-0"
            >
              <Info size={15} />
            </button>
          )}

          {libEntry?.youtubeUrl && (
            <a
              href={libEntry.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Watch on YouTube"
              className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
              <Youtube size={15} />
            </a>
          )}

          <button
            onClick={() => onRemove(dayIndex, exIndex)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Sets / Reps / Rest */}
        <div className="grid grid-cols-3 gap-2 pl-6">
          {[
            { label: 'Sets', field: 'sets', type: 'number' },
            { label: 'Reps', field: 'reps', type: 'text' },
            { label: 'Rest', field: 'rest', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="text-slate-400 text-xs mb-1 block">{label}</label>
              <input
                type={type}
                value={exercise[field]}
                onChange={(e) =>
                  onUpdate(
                    dayIndex, exIndex, field,
                    type === 'number' ? parseInt(e.target.value) || 1 : e.target.value
                  )
                }
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {exercise.notes && (
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 pl-6 italic">
            💡 {exercise.notes}
          </p>
        )}
      </div>

      {showPopover && (
        <TechniquePopover exercise={exercise} onClose={() => setShowPopover(false)} />
      )}
    </>
  )
}

// ─── PlanEditor ───────────────────────────────────────────────────────────────
function PlanEditor() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const { generatePlan, loading: aiLoading, error: aiError } = useClaudeAI()

  const [planName, setPlanName] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState([{ dayLabel: 'Day 1', exercises: [] }])
  const [expandedDay, setExpandedDay] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [pickerDayIndex, setPickerDayIndex] = useState(null)
  const [showAIOptions, setShowAIOptions] = useState(false)

  // ── Drag state ────────────────────────────────────────────────────────────
  // All mutable drag data lives in a ref so pointermove/pointerup handlers
  // (attached to window) never suffer from stale closure issues.
  const dragState = useRef({
    active: false,
    fromIndex: null,
    fromDay: null,
    overIndex: null,
  })
  const [draggingKey, setDraggingKey] = useState(null) // `${dayIndex}-${exIndex}` | null

  // Window-level pointer handlers — attached/removed dynamically so they only
  // exist while a drag is in progress.  Using window listeners avoids the
  // setPointerCapture routing problem: the captured element only fires events
  // on itself, but we need to hit-test arbitrary row elements.
  const handleWindowPointerMove = useCallback((e) => {
    if (!dragState.current.active) return

    const els = document.querySelectorAll('[data-day][data-index]')
    for (const el of els) {
      const rect = el.getBoundingClientRect()
      if (
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        parseInt(el.dataset.day) === dragState.current.fromDay
      ) {
        dragState.current.overIndex = parseInt(el.dataset.index)
        break
      }
    }
  }, [])

  const handleWindowPointerUp = useCallback((e) => {
    if (!dragState.current.active) return

    const { fromIndex, fromDay, overIndex } = dragState.current
    dragState.current = { active: false, fromIndex: null, fromDay: null, overIndex: null }
    setDraggingKey(null)

    // Remove window listeners now that the drag is finished
    window.removeEventListener('pointermove', handleWindowPointerMove)
    window.removeEventListener('pointerup', handleWindowPointerUp)
    window.removeEventListener('pointercancel', handleWindowPointerUp)

    if (fromIndex === null || overIndex === null || fromIndex === overIndex) return

    setDays((prev) =>
      prev.map((d, di) => {
        if (di !== fromDay) return d
        const exs = [...d.exercises]
        const [moved] = exs.splice(fromIndex, 1)
        exs.splice(overIndex, 0, moved)
        return { ...d, exercises: exs }
      })
    )
  }, [handleWindowPointerMove])

  // Clean up listeners if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
      window.removeEventListener('pointercancel', handleWindowPointerUp)
    }
  }, [handleWindowPointerMove, handleWindowPointerUp])

  const onGripPointerDown = useCallback((e, exIndex, dayIndex) => {
    e.preventDefault()
    dragState.current = {
      active: true,
      fromIndex: exIndex,
      fromDay: dayIndex,
      overIndex: exIndex,
    }
    setDraggingKey(`${dayIndex}-${exIndex}`)

    // Attach move/up listeners to window so they fire regardless of where
    // the pointer travels.
    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
  }, [handleWindowPointerMove, handleWindowPointerUp])

  const isEditing = Boolean(planId) && planId !== 'new'

  useEffect(() => {
    if (isEditing && user) loadPlan()
  }, [planId, user])

  const loadPlan = async () => {
    setLoadingPlan(true)
    try {
      const planDoc = await getDoc(doc(db, 'users', user.uid, 'plans', planId))
      if (planDoc.exists()) {
        const data = planDoc.data()
        setPlanName(data.planName || '')
        setDescription(data.description || '')
        setDays(data.days || [{ dayLabel: 'Day 1', exercises: [] }])
      }
    } catch (err) {
      console.error('Error loading plan:', err)
    } finally {
      setLoadingPlan(false)
    }
  }

  // ── AI generation ─────────────────────────────────────────────────────────
  const handleGenerateWithOptions = async ({ split, days: numDays, sessionLength, supersets }) => {
    setShowAIOptions(false)
    const overrides = {
      ...profile,
      splitPreference: split,
      daysPerWeek: numDays,
      sessionLength,
      supersets,
    }
    const result = await generatePlan(overrides)
    if (result) {
      setPlanName(result.planName || 'AI Generated Plan')
      setDescription(result.description || '')
      setDays(result.days || [])
      setExpandedDay(0)
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!planName.trim()) { alert('Please enter a plan name'); return }
    setSaving(true)
    try {
      const planData = {
        planName: planName.trim(),
        description: description.trim(),
        days,
        updatedAt: new Date().toISOString(),
      }
      if (isEditing) {
        await updateDoc(doc(db, 'users', user.uid, 'plans', planId), planData)
      } else {
        planData.createdAt = new Date().toISOString()
        planData.isActive = false
        planData.archived = false
        await addDoc(collection(db, 'users', user.uid, 'plans'), planData)
      }
      navigate('/dashboard/plans')
    } catch (err) {
      console.error('Error saving plan:', err)
      alert('Error saving plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Day helpers ───────────────────────────────────────────────────────────
  const addDay = () => {
    setDays((prev) => [...prev, { dayLabel: `Day ${prev.length + 1}`, exercises: [] }])
    setExpandedDay(days.length)
  }
  const removeDay = (i) => {
    setDays((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      if (expandedDay >= next.length) setExpandedDay(Math.max(0, next.length - 1))
      return next
    })
  }
  const updateDayLabel = (i, label) => {
    setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, dayLabel: label } : d))
  }

  // ── Exercise helpers ──────────────────────────────────────────────────────
  const openExercisePicker = (dayIndex) => {
    setPickerDayIndex(dayIndex)
    setShowExercisePicker(true)
  }

  const handleExercisesSelected = (selectedExercises) => {
    if (pickerDayIndex === null) return
    const newExercises = selectedExercises.map((ex) => ({
      name: ex.name,
      sets: 3,
      reps: '8-12',
      rest: '60 sec',
      notes: '',
    }))
    setDays((prev) =>
      prev.map((d, i) =>
        i === pickerDayIndex
          ? { ...d, exercises: [...d.exercises, ...newExercises] }
          : d
      )
    )
    setShowExercisePicker(false)
    setPickerDayIndex(null)
  }

  const updateExercise = (dayIndex, exIndex, field, value) => {
    setDays((prev) =>
      prev.map((d, di) =>
        di !== dayIndex ? d : {
          ...d,
          exercises: d.exercises.map((ex, ei) =>
            ei === exIndex ? { ...ex, [field]: value } : ex
          ),
        }
      )
    )
  }

  const removeExercise = (dayIndex, exIndex) => {
    setDays((prev) =>
      prev.map((d, di) =>
        di !== dayIndex ? d : {
          ...d,
          exercises: d.exercises.filter((_, ei) => ei !== exIndex),
        }
      )
    )
  }

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/plans')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Plan' : 'New Plan'}
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold min-h-[40px] active:scale-95 transition-all disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Plan Name */}
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Plan name (e.g. Push Pull Legs)"
          className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-4 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-base font-semibold placeholder:font-normal min-h-[56px]"
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm resize-none"
        />

        {/* AI Generate button — opens options sheet */}
        <button
          onClick={() => setShowAIOptions(true)}
          disabled={aiLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 min-h-[56px] active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-blue-500/20"
        >
          {aiLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate with AI
              <Settings2 size={15} className="opacity-70 ml-1" />
            </>
          )}
        </button>

        {aiError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {aiError}
          </div>
        )}

        {/* Training Days */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Training Days ({days.length})
            </h2>
            <button
              onClick={addDay}
              className="flex items-center gap-1 text-orange-500 text-sm font-semibold min-h-[44px] px-2"
            >
              <Plus size={16} />
              Add Day
            </button>
          </div>

          <div className="space-y-3">
            {days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Day Header */}
                <div className="flex items-center px-4 py-3">
                  <button
                    onClick={() =>
                      setExpandedDay(expandedDay === dayIndex ? null : dayIndex)
                    }
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    {expandedDay === dayIndex ? (
                      <ChevronUp size={18} className="text-orange-500 shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={day.dayLabel}
                      onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-slate-900 dark:text-white font-semibold text-sm focus:outline-none"
                      placeholder={`Day ${dayIndex + 1}`}
                    />
                  </button>
                  <span className="text-slate-400 text-xs mr-3">
                    {day.exercises.length} ex
                  </span>
                  {days.length > 1 && (
                    <button
                      onClick={() => removeDay(dayIndex)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Exercises */}
                {expandedDay === dayIndex && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    {day.exercises.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-slate-400 text-sm mb-3">No exercises added yet</p>
                        <button
                          onClick={() => openExercisePicker(dayIndex)}
                          className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                        >
                          + Add Exercise
                        </button>
                      </div>
                    ) : (
                      <div>
                        {day.exercises.map((exercise, exIndex) => (
                          <ExerciseRow
                            key={`${dayIndex}-${exIndex}-${exercise.name}`}
                            exercise={exercise}
                            dayIndex={dayIndex}
                            exIndex={exIndex}
                            onUpdate={updateExercise}
                            onRemove={removeExercise}
                            onGripPointerDown={onGripPointerDown}
                            isDragging={draggingKey === `${dayIndex}-${exIndex}`}
                          />
                        ))}

                        {day.exercises.length > 1 && (
                          <p className="text-slate-400 dark:text-slate-600 text-xs text-center py-1.5 select-none">
                            ☰ Drag the grip handle to reorder
                          </p>
                        )}

                        <div className="px-4 py-3">
                          <button
                            onClick={() => openExercisePicker(dayIndex)}
                            className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-orange-500 hover:border-orange-500 rounded-xl text-sm font-medium transition-colors"
                          >
                            + Add Exercise
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <ExercisePicker
          onSelectMultiple={handleExercisesSelected}
          onClose={() => setShowExercisePicker(false)}
        />
      )}

      {/* AI Options Sheet */}
      {showAIOptions && (
        <AIOptionsSheet
          profile={profile}
          onGenerate={handleGenerateWithOptions}
          onClose={() => setShowAIOptions(false)}
        />
      )}
    </div>
  )
}

export default PlanEditor

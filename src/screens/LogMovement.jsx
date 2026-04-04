import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import { useGamification } from '../hooks/useGamification'
import { FPToast } from '../components/FPToast'
import { BadgeUnlockModal } from '../components/BadgeUnlockModal'
import { RankUpModal } from '../components/RankUpModal'
import {
  MOVEMENT_ACTIVITIES,
  INTENSITY_OPTIONS,
  estimateCalories,
} from '../data/movementActivities'
import { Calendar, ChevronDown, Flame, Clock, ArrowLeftRight, Footprints } from 'lucide-react'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function LogMovement() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const { processMovementSession } = useGamification(user?.uid)
  const dateInputRef = useRef(null)

  // ── Form state ───────────────────────────────────────────────────────────────
  const [date, setDate] = useState(todayStr())
  const [activityId, setActivityId] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [steps, setSteps] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Reward state (mirrors LogWorkout) ────────────────────────────────────────
  const [fpEvents, setFpEvents] = useState([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [showRankModal, setShowRankModal] = useState(false)
  const [newRank, setNewRank] = useState(null)

  // ── Derived values ───────────────────────────────────────────────────────────
  const selectedActivity = MOVEMENT_ACTIVITIES.find((a) => a.id === activityId)
  const distanceUnit = profile?.weightUnit === 'kg' ? 'km' : 'miles'

  // Body weight in kg for calorie calc (profile stores weight in user's preferred unit)
  const bodyWeightKg = (() => {
    const w = Number(profile?.bodyweight)
    if (!w) return 70 // sensible default
    return profile?.weightUnit === 'kg' ? w : w / 2.205
  })()

  const estimatedCalories = estimateCalories(
    activityId,
    intensity,
    Number(duration),
    bodyWeightKg
  )

  const canSave = activityId && Number(duration) > 0

  // ── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const completedAt = new Date().toISOString()
      const session = {
        date,
        activityId,
        activityLabel: selectedActivity?.label || activityId,
        intensity,
        duration: Number(duration),
        distance: distance ? Number(distance) : null,
        distanceUnit: distance ? distanceUnit : null,
        steps: steps ? Number(steps) : null,
        estimatedCalories,
        notes: notes.trim(),
        completedAt,
      }

      await addDoc(collection(db, 'users', user.uid, 'movement'), session)

      // Trigger gamification (streak + FP)
      const result = await processMovementSession(session, profile)
      if (result) {
        const { fpEvents: events, newBadges, rankUp } = result
        if (events?.length) setFpEvents(events)
        if (newBadges?.length) { setEarnedBadges(newBadges); setShowBadgeModal(true) }
        if (rankUp) { setNewRank(rankUp); setShowRankModal(true) }
        if (!events?.length && !newBadges?.length && !rankUp) navigate('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error saving movement session:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleBadgeModalClose = () => {
    setShowBadgeModal(false)
    if (!showRankModal) navigate('/dashboard')
  }

  const handleRankModalClose = () => {
    setShowRankModal(false)
    navigate('/dashboard')
  }

  const handleToastsDone = () => {
    setFpEvents([])
    if (!showBadgeModal && !showRankModal) navigate('/dashboard')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Log Movement</h1>
        <p className="text-slate-400 text-sm mt-0.5">Track cardio, walks, hikes & more</p>
      </div>

      {/* ── Date ─────────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
          Date
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
            className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 hover:border-orange-400 transition-colors text-sm min-h-[48px]"
          >
            <Calendar size={17} className="text-orange-500 shrink-0" />
            <span className="flex-1 text-left font-medium">{formatDisplayDate(date)}</span>
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          </button>
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

      {/* ── Activity Picker ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          Activity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MOVEMENT_ACTIVITIES.map((activity) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => setActivityId(activity.id)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 border-2 transition-all duration-150 active:scale-95 ${
                activityId === activity.id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-2xl leading-none">{activity.icon}</span>
              <span className="text-xs font-semibold leading-tight text-center">
                {activity.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Duration & Distance ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duration */}
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            Duration (min)
          </label>
          <div className="relative">
            <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="number"
              min="1"
              max="999"
              placeholder="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px]"
            />
          </div>
        </div>

        {/* Distance — shown for applicable activities */}
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            Distance ({distanceUnit})
          </label>
          <div className="relative">
            <ArrowLeftRight size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={selectedActivity && !selectedActivity.hasDistance}
              className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px] disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* ── Steps (walk/hike only) ────────────────────────────────────────────── */}
      {selectedActivity?.hasSteps && (
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            Steps
          </label>
          <div className="relative">
            <Footprints size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="number"
              min="0"
              placeholder="optional"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px]"
            />
          </div>
        </div>
      )}

      {/* ── Intensity ────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          Intensity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setIntensity(opt.id)}
              className={`rounded-2xl py-3 px-2 border-2 transition-all duration-150 active:scale-95 text-center ${
                intensity === opt.id
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <p className={`text-sm font-bold ${intensity === opt.id ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Calorie Estimate ─────────────────────────────────────────────────── */}
      {estimatedCalories > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Flame size={24} className="text-white" />
          </div>
          <div>
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">
              Estimated Calories Burned
            </p>
            <p className="text-3xl font-black leading-tight">
              {estimatedCalories.toLocaleString()}
              <span className="text-base font-semibold ml-1 text-orange-200">kcal</span>
            </p>
            <p className="text-orange-200 text-xs mt-0.5">
              Based on {INTENSITY_OPTIONS.find(i => i.id === intensity)?.label.toLowerCase()} intensity
              {bodyWeightKg !== 70 ? ` · ${Math.round(bodyWeightKg)} kg` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Notes ────────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any highlights?"
          rows={3}
          className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none text-sm resize-none"
        />
      </div>

      {/* ── Save Button ───────────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 min-h-[56px] shadow-lg shadow-orange-500/20"
      >
        {saving ? 'Saving…' : 'Save Activity'}
      </button>

      {/* ── Reward overlays ──────────────────────────────────────────────────── */}
      {fpEvents.length > 0 && (
        <FPToast events={fpEvents} onDone={handleToastsDone} />
      )}
      {showBadgeModal && (
        <BadgeUnlockModal badges={earnedBadges} onClose={handleBadgeModalClose} />
      )}
      {showRankModal && newRank && (
        <RankUpModal rank={newRank} onClose={handleRankModalClose} />
      )}
    </div>
  )
}

/**
 * EditSessionSheet — bottom sheet for correcting a logged workout.
 *
 * Props:
 *   session  — the existing session object
 *   unit     — 'lbs' | 'kg'
 *   onClose  — called with no args when dismissed without saving
 *   onSaved  — called with the updated session object after a successful save
 */

import { useState, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import { X, Calendar, ChevronDown, Plus, Trash2 } from 'lucide-react'

function formatDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function EditSessionSheet({ session, unit = 'lbs', onClose, onSaved }) {
  const { user } = useAuthStore()
  const dateInputRef = useRef(null)

  const [date, setDate] = useState(session.date || '')
  const [exercises, setExercises] = useState(
    () => (session.exercises || []).map((ex) => ({
      name: ex.name,
      sets: (ex.sets || []).map((s) => ({
        reps:   String(s.reps ?? ''),
        weight: String(s.weight ?? ''),
        rpe:    String(s.rpe ?? ''),
      })),
    }))
  )
  const [notes, setNotes] = useState(session.notes || '')
  const [saving, setSaving] = useState(false)

  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const next = prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
          : ex
      )
      return next
    })
  }

  const addSet = (exIdx) => {
    setExercises((prev) => {
      const next = [...prev]
      const lastSet = next[exIdx].sets.at(-1) || { reps: '', weight: '', rpe: '7' }
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets, { reps: lastSet.reps, weight: lastSet.weight, rpe: lastSet.rpe }],
      }
      return next
    })
  }

  const removeSet = (exIdx, setIdx) => {
    setExercises((prev) => {
      const next = [...prev]
      if (next[exIdx].sets.length <= 1) return prev
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.filter((_, j) => j !== setIdx) }
      return next
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const updatedSession = {
        ...session,
        date,
        notes: notes.trim(),
        exercises: exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets
            .filter((s) => s.reps !== '' || s.weight !== '')
            .map((s) => ({
              reps:   s.reps   !== '' ? Number(s.reps)   : '',
              weight: s.weight !== '' ? Number(s.weight) : '',
              rpe:    s.rpe    !== '' ? Number(s.rpe)    : '',
            })),
        })),
      }
      await updateDoc(doc(db, 'users', user.uid, 'sessions', session.id), {
        date:      updatedSession.date,
        notes:     updatedSession.notes,
        exercises: updatedSession.exercises,
      })
      onSaved(updatedSession)
    } catch (err) {
      console.error('Error saving session edits:', err)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Workout</h2>
            <p className="text-slate-400 text-xs mt-0.5">{session.planName || 'Training Session'}{session.dayLabel ? ` — ${session.dayLabel}` : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">

          {/* Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Date</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                className="w-full flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600 hover:border-orange-400 transition-colors text-sm min-h-[48px]"
              >
                <Calendar size={15} className="text-orange-500 shrink-0" />
                <span className="flex-1 text-left font-medium">{formatDisplayDate(date)}</span>
                <ChevronDown size={15} className="text-slate-400 shrink-0" />
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

          {/* Exercises */}
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="space-y-2">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{ex.name}</p>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-1 px-1">
                <span className="col-span-2 text-slate-400 text-xs text-center">Set</span>
                <span className="col-span-4 text-slate-400 text-xs text-center">Reps</span>
                <span className="col-span-4 text-slate-400 text-xs text-center">{unit}</span>
                <span className="col-span-2 text-slate-400 text-xs text-center">RPE</span>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-2 text-slate-400 text-xs text-center font-semibold">{setIdx + 1}</span>
                  <input
                    type="number"
                    min="0"
                    value={set.reps}
                    onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    className="col-span-4 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-lg px-2 py-2 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm text-center min-h-[40px]"
                    placeholder="—"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                    className="col-span-4 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-lg px-2 py-2 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm text-center min-h-[40px]"
                    placeholder="—"
                  />
                  <button
                    onClick={() => removeSet(exIdx, setIdx)}
                    disabled={ex.sets.length <= 1}
                    className="col-span-2 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(exIdx)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-orange-400 hover:text-orange-500 text-xs font-semibold transition-colors"
              >
                <Plus size={13} />
                Add Set
              </button>
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm resize-none"
              placeholder="Session notes…"
            />
          </div>

          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

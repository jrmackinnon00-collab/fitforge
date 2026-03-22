import { useState, useMemo } from 'react'
import { exercises } from '../data/exercises'
import { Search, X, Check, Plus, ChevronRight } from 'lucide-react'

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core']
const EQUIPMENT_FILTERS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight']
const CUSTOM_MUSCLES = ['Chest', 'Back', 'Lats', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Abs', 'Traps', 'Lower Back']

function CustomExerciseForm({ onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [muscles, setMuscles] = useState([])
  const [type, setType] = useState('Compound')

  // Real-time library suggestions as user types
  const suggestions = useMemo(() => {
    if (name.length < 2) return []
    const needle = name.toLowerCase()
    return exercises
      .filter((ex) => ex.name.toLowerCase().includes(needle))
      .slice(0, 3)
  }, [name])

  const applySuggestion = (ex) => {
    setName(ex.name)
    setMuscles(ex.primaryMuscles)
    setType(ex.type)
  }

  const toggleMuscle = (muscle) => {
    setMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    )
  }

  const canConfirm = name.trim().length > 0 && muscles.length > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-md mx-auto bg-slate-800 rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl border-t border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base">Add Custom Exercise</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-400"
          >
            <X size={15} />
          </button>
        </div>

        {/* Name input */}
        <div className="mb-3">
          <label className="text-slate-400 text-xs font-semibold mb-1.5 block">EXERCISE NAME</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Straight Arm Pull Down"
            autoFocus
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
          />
        </div>

        {/* Library suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden border border-slate-600">
            <p className="text-slate-500 text-xs px-3 py-1.5 bg-slate-700/50">
              Library matches — tap to use
            </p>
            {suggestions.map((ex) => (
              <button
                key={ex.id}
                onClick={() => applySuggestion(ex)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between bg-slate-700/30 hover:bg-slate-700 border-t border-slate-600/50 transition-colors"
              >
                <div>
                  <p className="text-white text-sm font-medium">{ex.name}</p>
                  <p className="text-slate-400 text-xs">{ex.primaryMuscles.join(', ')}</p>
                </div>
                <ChevronRight size={14} className="text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Muscle groups */}
        <div className="mb-3">
          <label className="text-slate-400 text-xs font-semibold mb-1.5 block">
            PRIMARY MUSCLES <span className="text-orange-400">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CUSTOM_MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  muscles.includes(m)
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Compound / Isolation toggle */}
        <div className="mb-5">
          <label className="text-slate-400 text-xs font-semibold mb-1.5 block">TYPE</label>
          <div className="flex gap-2">
            {['Compound', 'Isolation'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  type === t
                    ? t === 'Compound'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-slate-700 text-slate-500 border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() =>
            canConfirm &&
            onConfirm({
              id: `custom_${Date.now()}`,
              name: name.trim(),
              primaryMuscles: muscles,
              secondaryMuscles: [],
              equipment: ['Any'],
              type,
              isCustom: true,
            })
          }
          disabled={!canConfirm}
          className="w-full bg-orange-500 disabled:bg-slate-600 disabled:text-slate-400 text-white py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all"
        >
          {canConfirm ? `Add "${name.trim()}"` : 'Enter name & select muscles'}
        </button>
      </div>
    </div>
  )
}

function ExercisePicker({ onSelectMultiple, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [customExercises, setCustomExercises] = useState([])
  const [showCustomForm, setShowCustomForm] = useState(false)

  const allExercises = useMemo(() => [...exercises, ...customExercises], [customExercises])

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch =
        searchQuery === '' ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesMuscle =
        selectedMuscle === 'All' ||
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(selectedMuscle.toLowerCase())) ||
        ex.secondaryMuscles.some((m) => m.toLowerCase().includes(selectedMuscle.toLowerCase()))

      const matchesEquipment =
        selectedEquipment === 'All' ||
        ex.equipment.some((eq) => eq.toLowerCase().includes(selectedEquipment.toLowerCase())) ||
        (selectedEquipment === 'Bodyweight' &&
          (ex.equipment.includes('None') ||
            ex.equipment.length === 0 ||
            ex.equipment.includes('Bodyweight')))

      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [searchQuery, selectedMuscle, selectedEquipment, allExercises])

  const toggleSelect = (exercise) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(exercise.id)) {
        next.delete(exercise.id)
      } else {
        next.add(exercise.id)
      }
      return next
    })
  }

  const handleAddSelected = () => {
    const chosen = allExercises.filter((ex) => selectedIds.has(ex.id))
    onSelectMultiple(chosen)
  }

  const handleCustomConfirm = (ex) => {
    setCustomExercises((prev) => [...prev, ex])
    setSelectedIds((prev) => new Set([...prev, ex.id]))
    setShowCustomForm(false)
  }

  const getTypeBadgeColor = (type, isCustom) => {
    if (isCustom) return 'bg-purple-500/10 text-purple-400'
    return type === 'Compound' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-white flex-1">Add Exercises</h2>
        {selectedIds.size > 0 && (
          <button
            onClick={handleAddSelected}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-orange-500/30"
          >
            <Plus size={16} />
            Add {selectedIds.size}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-slate-700 text-white rounded-xl pl-10 pr-10 py-3 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[48px]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border-b border-slate-700">
        {/* Muscle group tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 py-2 gap-2">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedMuscle === muscle ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>
        {/* Equipment filter */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-2">
          {EQUIPMENT_FILTERS.map((eq) => (
            <button
              key={eq}
              onClick={() => setSelectedEquipment(eq)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedEquipment === eq ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Result count + custom exercise button */}
      <div className="px-4 py-2 bg-slate-900 flex items-center justify-between">
        <p className="text-slate-500 text-xs">
          {filteredExercises.length} exercises
          {selectedIds.size > 0 && (
            <span className="text-orange-400 ml-2">• {selectedIds.size} selected</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 text-xs underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center gap-1 text-orange-400 text-xs font-semibold"
          >
            <Plus size={13} />
            Custom
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filteredExercises.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-400 font-medium">No exercises found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            <button
              onClick={() => setShowCustomForm(true)}
              className="mt-4 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl text-sm font-semibold"
            >
              + Add Custom Exercise
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredExercises.map((exercise) => {
              const isSelected = selectedIds.has(exercise.id)
              return (
                <button
                  key={exercise.id}
                  onClick={() => toggleSelect(exercise)}
                  className={`w-full text-left px-4 py-4 transition-colors flex items-center gap-3 ${
                    isSelected
                      ? 'bg-orange-500/10'
                      : 'hover:bg-slate-800/50 active:bg-slate-800'
                  }`}
                >
                  {/* Circular checkbox */}
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${
                        isSelected ? 'text-orange-400' : 'text-white'
                      }`}
                    >
                      {exercise.name}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {exercise.primaryMuscles.join(', ')}
                    </p>
                    <p className="text-slate-500 text-xs">{exercise.equipment.join(', ')}</p>
                  </div>

                  {/* Type badge */}
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${getTypeBadgeColor(
                      exercise.type,
                      exercise.isCustom
                    )}`}
                  >
                    {exercise.isCustom ? 'Custom' : exercise.type}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-4 z-10">
          <button
            onClick={handleAddSelected}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add {selectedIds.size} Exercise{selectedIds.size !== 1 ? 's' : ''} to Day
          </button>
        </div>
      )}

      {/* Custom Exercise Form */}
      {showCustomForm && (
        <CustomExerciseForm
          onConfirm={handleCustomConfirm}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  )
}

export default ExercisePicker

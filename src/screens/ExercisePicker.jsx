import { useState, useMemo } from 'react'
import { exercises } from '../data/exercises'
import { Search, X, Check, Plus } from 'lucide-react'

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core']
const EQUIPMENT_FILTERS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight']

function ExercisePicker({ onSelectMultiple, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  // Set of selected exercise IDs for multi-select
  const [selectedIds, setSelectedIds] = useState(new Set())

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
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
  }, [searchQuery, selectedMuscle, selectedEquipment])

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
    const chosen = exercises.filter((ex) => selectedIds.has(ex.id))
    onSelectMultiple(chosen)
  }

  const getTypeBadgeColor = (type) =>
    type === 'Compound' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'

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

      {/* Result count */}
      <div className="px-4 py-2 bg-slate-900 flex items-center justify-between">
        <p className="text-slate-500 text-xs">
          {filteredExercises.length} exercises
          {selectedIds.size > 0 && (
            <span className="text-orange-400 ml-2">• {selectedIds.size} selected</span>
          )}
        </p>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 text-xs underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filteredExercises.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-400 font-medium">No exercises found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
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
                      exercise.type
                    )}`}
                  >
                    {exercise.type}
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
    </div>
  )
}

export default ExercisePicker

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Cables', 'Machines', 'Pull-Up Bar',
  'Resistance Bands', 'Kettlebells', 'Bodyweight Only', 'Smith Machine',
]

const BODY_FOCUS_OPTIONS = [
  'Full Body', 'Upper Body', 'Lower Body', 'Chest', 'Back',
  'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core',
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Less than 1 year' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
]

const GOALS = [
  { value: 'muscle_gain', label: 'Build Muscle', emoji: '💪' },
  { value: 'fat_loss', label: 'Lose Fat', emoji: '🔥' },
  { value: 'strength', label: 'Get Stronger', emoji: '🏋️' },
  { value: 'endurance', label: 'Endurance', emoji: '🏃' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '⚡' },
]

const SPLITS = [
  { value: 'push_pull_legs', label: 'Push/Pull/Legs' },
  { value: 'upper_lower', label: 'Upper/Lower' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'bro_split', label: 'Body Part Split' },
  { value: 'arnold_split', label: 'Arnold Split' },
]

function ProfileSetup({ onComplete }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile, updateProfile } = useProfileStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const totalSteps = 3

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), {
          ...profile,
          updatedAt: new Date().toISOString(),
        })
      }
      onComplete?.()
      navigate('/dashboard')
    } catch (err) {
      console.error('Error saving profile:', err)
      onComplete?.()
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    onComplete?.()
    navigate('/dashboard')
  }

  const toggleArrayItem = (field, item) => {
    const current = profile[field] || []
    if (current.includes(item)) {
      updateProfile({ [field]: current.filter((i) => i !== item) })
    } else {
      updateProfile({ [field]: [...current, item] })
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Progress Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Set Up Your Profile</h1>
          <button
            onClick={handleSkip}
            className="text-slate-400 text-sm font-medium px-3 py-2 min-h-[44px]"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-orange-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-2">Step {step} of {totalSteps}</p>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Basic Info</h2>
              <p className="text-slate-400 text-sm">Tell us about yourself</p>
            </div>

            {/* Age */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => updateProfile({ age: e.target.value })}
                placeholder="25"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-base min-h-[48px]"
              />
            </div>

            {/* Bodyweight */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Bodyweight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={profile.bodyweight}
                  onChange={(e) => updateProfile({ bodyweight: e.target.value })}
                  placeholder="175"
                  className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-base min-h-[48px]"
                />
                <div className="flex bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  {['lbs', 'kg'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => updateProfile({ weightUnit: unit })}
                      className={`px-4 py-3 text-sm font-semibold transition-colors min-h-[48px] ${
                        profile.weightUnit === unit
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Fitness Level</label>
              <div className="space-y-2">
                {FITNESS_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateProfile({ fitnessLevel: level.value })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all min-h-[56px] ${
                      profile.fitnessLevel === level.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    <span className="text-white font-medium">{level.label}</span>
                    <span className="text-slate-400 text-sm">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Your Goals</h2>
              <p className="text-slate-400 text-sm">What do you want to achieve?</p>
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Primary Goal</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateProfile({ goal: goal.value })}
                    className={`flex flex-col items-center p-4 rounded-xl border transition-all min-h-[80px] ${
                      profile.goal === goal.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl mb-1">{goal.emoji}</span>
                    <span className="text-white text-sm font-medium text-center">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Focus */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Body Focus <span className="text-slate-500">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BODY_FOCUS_OPTIONS.map((focus) => (
                  <button
                    key={focus}
                    onClick={() => toggleArrayItem('bodyFocus', focus)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[36px] ${
                      profile.bodyFocus?.includes(focus)
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Preference */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Preferred Split</label>
              <div className="space-y-2">
                {SPLITS.map((split) => (
                  <button
                    key={split.value}
                    onClick={() => updateProfile({ splitPreference: split.value })}
                    className={`w-full text-left p-4 rounded-xl border transition-all min-h-[52px] ${
                      profile.splitPreference === split.value
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {split.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Your Schedule</h2>
              <p className="text-slate-400 text-sm">How often can you train?</p>
            </div>

            {/* Days Per Week */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Days Per Week: <span className="text-orange-400 font-bold">{profile.daysPerWeek}</span>
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateProfile({ daysPerWeek: Math.max(2, profile.daysPerWeek - 1) })}
                  className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white text-xl font-bold flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <div className="flex-1 flex justify-between">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      onClick={() => updateProfile({ daysPerWeek: d })}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                        profile.daysPerWeek === d
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => updateProfile({ daysPerWeek: Math.min(6, profile.daysPerWeek + 1) })}
                  className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white text-xl font-bold flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Session Length */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Session Length</label>
              <select
                value={profile.sessionLength}
                onChange={(e) => updateProfile({ sessionLength: e.target.value })}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-base min-h-[48px]"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="75">75 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Available Equipment <span className="text-slate-500">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleArrayItem('equipment', eq)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[36px] ${
                      profile.equipment?.includes(eq)
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 pb-8 pt-4 flex gap-3">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 py-4 rounded-2xl border border-slate-700 text-slate-300 font-semibold text-base min-h-[56px] active:scale-95 transition-all"
          >
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button
            onClick={handleNext}
            className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-semibold text-base min-h-[56px] active:scale-95 transition-all"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-semibold text-base min-h-[56px] active:scale-95 transition-all disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Get Started!'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProfileSetup

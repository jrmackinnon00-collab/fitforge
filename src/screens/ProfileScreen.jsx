import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import useProfileStore from '../store/useProfileStore'
import useThemeStore from '../store/useThemeStore'
import { LogOut, Moon, Sun, ChevronRight, User } from 'lucide-react'

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced']
const GOALS = [
  { value: 'muscle_gain', label: 'Build Muscle' },
  { value: 'fat_loss', label: 'Lose Fat' },
  { value: 'strength', label: 'Get Stronger' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general_fitness', label: 'General Fitness' },
]
const SPLITS = [
  { value: 'push_pull_legs', label: 'Push/Pull/Legs' },
  { value: 'upper_lower', label: 'Upper/Lower' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'bro_split', label: 'Body Part Split' },
  { value: 'arnold_split', label: 'Arnold Split' },
]
const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Cables', 'Machines', 'Pull-Up Bar',
  'Resistance Bands', 'Kettlebells', 'Bodyweight Only', 'Smith Machine',
]

function ProfileScreen() {
  const { user } = useAuthStore()
  const { profile, updateProfile, setProfile } = useProfileStore()
  const { isDark, toggleTheme } = useThemeStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const profileDoc = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'))
      if (profileDoc.exists()) {
        setProfile(profileDoc.data())
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), {
        ...profile,
        updatedAt: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const toggleEquipment = (eq) => {
    const current = profile.equipment || []
    if (current.includes(eq)) {
      updateProfile({ equipment: current.filter((e) => e !== eq) })
    } else {
      updateProfile({ equipment: [...current, eq] })
    }
  }

  const appVersion = '1.0.0'

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center border-2 border-orange-500">
              <User size={28} className="text-orange-500" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.displayName || 'Athlete'}
            </h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3 px-1">
          Preferences
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon size={18} className="text-slate-400" />
              ) : (
                <Sun size={18} className="text-slate-400" />
              )}
              <span className="text-slate-900 dark:text-white font-medium text-sm">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                isDark ? 'bg-orange-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  isDark ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Weight Unit Toggle */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-slate-900 dark:text-white font-medium text-sm">Weight Unit</span>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
              {['lbs', 'kg'].map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateProfile({ weightUnit: unit })}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    profile.weightUnit === unit
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3 px-1">
          Profile
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          {/* Age & Bodyweight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Age</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => updateProfile({ age: e.target.value })}
                placeholder="25"
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">
                Bodyweight ({profile.weightUnit || 'lbs'})
              </label>
              <input
                type="number"
                value={profile.bodyweight || ''}
                onChange={(e) => updateProfile({ bodyweight: e.target.value })}
                placeholder="175"
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px]"
              />
            </div>
          </div>

          {/* Fitness Level */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Fitness Level</label>
            <div className="flex gap-2">
              {FITNESS_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => updateProfile({ fitnessLevel: level })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                    profile.fitnessLevel === level
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Primary Goal</label>
            <select
              value={profile.goal || ''}
              onChange={(e) => updateProfile({ goal: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px]"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Preferred Split */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Preferred Split</label>
            <select
              value={profile.splitPreference || ''}
              onChange={(e) => updateProfile({ splitPreference: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px]"
            >
              {SPLITS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Days Per Week */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">
              Days Per Week: <span className="text-orange-400 font-bold">{profile.daysPerWeek}</span>
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => updateProfile({ daysPerWeek: d })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    profile.daysPerWeek === d
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    profile.equipment?.includes(eq)
                      ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                      : 'border-slate-200 dark:border-slate-600 text-slate-400'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white active:scale-95'
            } disabled:opacity-70 min-h-[48px]`}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 font-semibold text-sm min-h-[56px] active:scale-95 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <LogOut size={18} />
        Log Out
      </button>

      {/* App Version */}
      <p className="text-center text-slate-400 text-xs pb-4">
        FitForge v{appVersion}
      </p>
    </div>
  )
}

export default ProfileScreen

import { create } from 'zustand'

// Blank slate shown to new users who haven't saved a profile yet
export const EMPTY_PROFILE = {
  age: '',
  bodyweight: '',
  weightUnit: 'lbs',
  fitnessLevel: '',
  goal: '',
  bodyFocus: [],
  equipment: [],
  splitPreference: '',
  daysPerWeek: 4,
  sessionLength: '60',
}

// Sensible defaults used only when generating an AI plan for a user
// who skipped profile setup (so the AI still gets valid inputs)
export const DEFAULT_PROFILE_FALLBACKS = {
  fitnessLevel: 'intermediate',
  goal: 'muscle_gain',
  splitPreference: 'push_pull_legs',
  equipment: ['Barbell', 'Dumbbells'],
}

const useProfileStore = create((set) => ({
  profile: { ...EMPTY_PROFILE },
  setProfile: (profile) => set({ profile }),
  resetProfile: () => set({ profile: { ...EMPTY_PROFILE } }),
  updateProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}))

export default useProfileStore

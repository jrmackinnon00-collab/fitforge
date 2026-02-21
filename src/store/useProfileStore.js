import { create } from 'zustand'

const useProfileStore = create((set) => ({
  profile: {
    age: '',
    bodyweight: '',
    weightUnit: 'lbs',
    fitnessLevel: 'intermediate',
    goal: 'muscle_gain',
    bodyFocus: [],
    equipment: [],
    splitPreference: 'push_pull_legs',
    daysPerWeek: 4,
    sessionLength: '60',
  },
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}))

export default useProfileStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useWorkoutDraftStore = create(
  persist(
    (set) => ({
      draft: null,
      saveDraft: (data) => set({ draft: data }),
      clearDraft: () => set({ draft: null }),
    }),
    { name: 'fitforge-workout-draft' }
  )
)

export default useWorkoutDraftStore

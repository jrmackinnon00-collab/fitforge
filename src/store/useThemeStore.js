import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Maps a rank level number to the CSS theme name used in data-rank-theme.
 * Rank themes unlock cumulatively as the user progresses.
 */
export function themeForRankLevel(level) {
  if (level >= 10) return 'obsidian'
  if (level >= 9)  return 'ember'
  if (level >= 8)  return 'steel'
  if (level >= 6)  return 'gold'
  if (level >= 4)  return 'silver'
  return 'default'
}

const useThemeStore = create(
  persist(
    (set) => ({
      isDark: true,
      rankTheme: 'default',
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      syncRankTheme: (rankLevel) => set({ rankTheme: themeForRankLevel(rankLevel) }),
    }),
    {
      name: 'fitforge-theme',
    }
  )
)

export default useThemeStore

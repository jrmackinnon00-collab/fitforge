/**
 * 10-rank progression ladder for FitForge.
 * Ranks are permanent — never lost.
 */

export const RANKS = [
  {
    level: 1,
    title: 'Raw Iron',
    pointsRequired: 0,
    icon: '⚙️',
    theme: 'gray',
    colour: '#94a3b8',
    perk: 'Welcome to FitForge. Your journey begins.',
  },
  {
    level: 2,
    title: 'Apprentice',
    pointsRequired: 500,
    icon: '🔩',
    theme: 'bronze',
    colour: '#cd7f32',
    perk: 'Streak tracker and streak badges unlocked.',
  },
  {
    level: 3,
    title: 'Journeyman',
    pointsRequired: 1500,
    icon: '🔧',
    theme: 'bronze+',
    colour: '#b87333',
    perk: 'PR History chart unlocked in Progress.',
  },
  {
    level: 4,
    title: 'Craftsman',
    pointsRequired: 3500,
    icon: '🛠️',
    theme: 'silver',
    colour: '#c0c0c0',
    perk: 'Silver app theme unlocked.',
  },
  {
    level: 5,
    title: 'Forgemaster',
    pointsRequired: 7500,
    icon: '⚒️',
    theme: 'silver+',
    colour: '#a8a9ad',
    perk: 'AI Workout Tip of the Week unlocked.',
  },
  {
    level: 6,
    title: 'Tempered',
    pointsRequired: 15000,
    icon: '🥇',
    theme: 'gold',
    colour: '#ffd700',
    perk: 'Gold app theme + animated profile badge unlocked.',
  },
  {
    level: 7,
    title: 'Hardened',
    pointsRequired: 27500,
    icon: '💎',
    theme: 'gold+',
    colour: '#ffb700',
    perk: 'Advanced volume analytics unlocked.',
  },
  {
    level: 8,
    title: 'Steelborn',
    pointsRequired: 45000,
    icon: '🔱',
    theme: 'steel',
    colour: '#4a90d9',
    perk: 'Historical plan comparison view unlocked.',
  },
  {
    level: 9,
    title: 'Iron Legend',
    pointsRequired: 70000,
    icon: '🌋',
    theme: 'ember',
    colour: '#ff4500',
    perk: 'Exclusive ember app theme unlocked.',
  },
  {
    level: 10,
    title: 'The Forge Master',
    pointsRequired: 100000,
    icon: '👑',
    theme: 'obsidian',
    colour: '#1a1a2e',
    perk: 'Prestige rank. Obsidian theme. Permanent profile badge.',
  },
]

/**
 * Returns the current rank object for a given points total.
 */
export function getRankForPoints(totalPoints) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (totalPoints >= r.pointsRequired) rank = r
    else break
  }
  return rank
}

/**
 * Returns the next rank, or null if already at max.
 */
export function getNextRank(currentLevel) {
  return RANKS.find((r) => r.level === currentLevel + 1) || null
}

/**
 * Progress percentage (0-100) towards the next rank.
 */
export function getRankProgress(totalPoints) {
  const current = getRankForPoints(totalPoints)
  const next = getNextRank(current.level)
  if (!next) return 100
  const range = next.pointsRequired - current.pointsRequired
  const progress = totalPoints - current.pointsRequired
  return Math.min(100, Math.round((progress / range) * 100))
}

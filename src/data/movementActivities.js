/**
 * Movement activity definitions with MET (Metabolic Equivalent of Task) values.
 *
 * Calories burned = MET × weight_kg × duration_hours
 * Intensity multipliers: light ×0.75, moderate ×1.0, vigorous ×1.3
 *
 * MET source: Compendium of Physical Activities (Ainsworth et al.)
 */

export const MOVEMENT_ACTIVITIES = [
  { id: 'walk',       label: 'Walk',              icon: '🚶',  met: 3.5,  hasDistance: true,  hasSteps: true  },
  { id: 'run',        label: 'Run',               icon: '🏃',  met: 9.0,  hasDistance: true,  hasSteps: false },
  { id: 'hike',       label: 'Hike',              icon: '🥾',  met: 5.5,  hasDistance: true,  hasSteps: true  },
  { id: 'cycle',      label: 'Cycle',             icon: '🚴',  met: 7.5,  hasDistance: true,  hasSteps: false },
  { id: 'row',        label: 'Row',               icon: '🚣',  met: 7.0,  hasDistance: true,  hasSteps: false },
  { id: 'elliptical', label: 'Elliptical',        icon: '🔄',  met: 5.0,  hasDistance: true,  hasSteps: false },
  { id: 'swim',       label: 'Swim',              icon: '🏊',  met: 8.0,  hasDistance: true,  hasSteps: false },
  { id: 'ski',        label: 'Downhill Ski',      icon: '⛷️',  met: 6.0,  hasDistance: false, hasSteps: false },
  { id: 'xc_ski',     label: 'Cross-Country Ski', icon: '🎿',  met: 9.0,  hasDistance: true,  hasSteps: false },
  { id: 'snowshoe',   label: 'Snowshoe',          icon: '🌨️',  met: 8.0,  hasDistance: true,  hasSteps: false },
  { id: 'jump_rope',  label: 'Jump Rope',         icon: '🪢',  met: 10.0, hasDistance: false, hasSteps: false },
  { id: 'yoga',       label: 'Yoga',              icon: '🧘',  met: 2.5,  hasDistance: false, hasSteps: false },
  { id: 'other',      label: 'Other',             icon: '💪',  met: 4.0,  hasDistance: false, hasSteps: false },
]

export const ACTIVITY_MAP = Object.fromEntries(
  MOVEMENT_ACTIVITIES.map((a) => [a.id, a])
)

export const INTENSITY_OPTIONS = [
  { id: 'light',    label: 'Light',    description: 'Easy effort, can hold a full conversation', multiplier: 0.75 },
  { id: 'moderate', label: 'Moderate', description: 'Somewhat hard, can speak in short sentences', multiplier: 1.0  },
  { id: 'vigorous', label: 'Vigorous', description: 'Hard effort, difficult to speak',              multiplier: 1.3  },
]

/**
 * Estimate calories burned.
 * @param {string}  activityId  - activity id from MOVEMENT_ACTIVITIES
 * @param {string}  intensity   - 'light' | 'moderate' | 'vigorous'
 * @param {number}  durationMin - session duration in minutes
 * @param {number}  weightKg    - user's body weight in kg
 * @returns {number} estimated calories (rounded to nearest integer)
 */
export function estimateCalories(activityId, intensity, durationMin, weightKg) {
  const activity = ACTIVITY_MAP[activityId]
  const intOption = INTENSITY_OPTIONS.find((i) => i.id === intensity)
  if (!activity || !intOption || !durationMin || !weightKg) return 0
  const met = activity.met * intOption.multiplier
  const hours = durationMin / 60
  return Math.round(met * weightKg * hours)
}

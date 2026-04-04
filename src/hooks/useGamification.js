/**
 * useGamification — client-side badge + points engine
 *
 * Called after each workout session is saved. Evaluates all point-earning
 * conditions and badge triggers, then writes results atomically to Firestore
 * at /users/{uid}/gamification/data
 *
 * Returns: { processSession, gamification, loading }
 */

import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, collection, getDocs,
  query, orderBy, limit, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { BADGES, BADGE_MAP } from '../data/badges'
import { getRankForPoints } from '../data/ranks'
import { exercises as exerciseLibrary } from '../data/exercises'

// ─── Firestore path helpers ───────────────────────────────────────────────────
const gamRef = (uid) => doc(db, 'users', uid, 'gamification', 'data')

// ─── Default gamification document ───────────────────────────────────────────
const DEFAULT_GAM = {
  totalPoints: 0,
  currentRank: 1,
  pointsHistory: [],          // last 100 FP events
  earnedBadges: [],           // [{ badgeId, earnedAt }]
  streakData: {
    currentStreakDays: 0,
    longestStreak: 0,
    lastActiveDate: null,
    activeDays: [],
  },
  perfectWeeks: 0,
  weeklySessionTarget: 4,
  stats: {
    totalSessions: 0,
    totalVolumeLbs: 0,
    totalPRs: 0,
    totalProgressiveExercises: 0,   // distinct exercises with at least one overload
    plansCompleted: 0,
    bodyweightOnlySessions: 0,
    mondayStreak: 0,                // consecutive Mondays with a workout
    lastMondayDate: null,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function daysBetween(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return Infinity
  const a = new Date(dateStr1)
  const b = new Date(dateStr2)
  return Math.round(Math.abs((b - a) / 86400000))
}

// Calculate average RPE across all sets in a session
function avgRPE(exercises) {
  const sets = exercises.flatMap((ex) => ex.sets || [])
  const rpeVals = sets.map((s) => Number(s.rpe)).filter((r) => r > 0)
  if (!rpeVals.length) return null
  return rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length
}

// Is every exercise in the session bodyweight only?
function isBodyweightSession(exercises) {
  if (!exercises?.length) return false
  return exercises.every((ex) => {
    const libEntry = exerciseLibrary.find(
      (e) => e.name.toLowerCase() === ex.name?.toLowerCase()
    )
    return libEntry?.equipment?.includes('Bodyweight') ||
      libEntry?.equipment?.length === 0
  })
}

// Count PRs in a session by comparing to previous best
function countSessionPRs(sessionExercises, previousPerf) {
  let prCount = 0
  const prExercises = []
  for (const ex of sessionExercises) {
    const sets = ex.sets || []
    const maxWeight = Math.max(...sets.map((s) => Number(s.weight) || 0))
    const maxReps   = Math.max(...sets.map((s) => Number(s.reps) || 0))
    const prev = previousPerf[ex.name]
    if (!prev) continue
    if (maxWeight > (prev.maxWeight || 0) || maxReps > (prev.maxReps || 0)) {
      prCount++
      prExercises.push(ex.name)
    }
  }
  return { prCount: Math.min(prCount, 5), prExercises }
}

// Count progressive overload events
function countProgressiveOverloads(sessionExercises, previousPerf) {
  let weightOverloads = 0
  let repOverloads = 0
  const overloadedExercises = new Set()
  for (const ex of sessionExercises) {
    const sets = ex.sets || []
    const maxWeight = Math.max(...sets.map((s) => Number(s.weight) || 0))
    const maxReps   = Math.max(...sets.map((s) => Number(s.reps) || 0))
    const prev = previousPerf[ex.name]
    if (!prev || prev.sessionCount < 3) continue // need 3+ sessions of history
    if (maxWeight > (prev.maxWeight || 0)) { weightOverloads++; overloadedExercises.add(ex.name) }
    else if (maxReps > (prev.maxReps || 0)) { repOverloads++; overloadedExercises.add(ex.name) }
  }
  return { weightOverloads, repOverloads, overloadedExercises }
}

// Calculate volume (lbs) for this session
function sessionVolume(exercises) {
  return exercises.reduce((total, ex) => {
    return total + (ex.sets || []).reduce((s, set) => {
      return s + ((Number(set.weight) || 0) * (Number(set.reps) || 0))
    }, 0)
  }, 0)
}

// Check if user did more sets than planned on every exercise
function isOverachiever(sessionExercises, planExercises) {
  if (!planExercises?.length || !sessionExercises?.length) return false
  return sessionExercises.every((ex) => {
    const planned = planExercises.find(
      (p) => p.name?.toLowerCase() === ex.name?.toLowerCase()
    )
    if (!planned) return false
    return (ex.sets?.length || 0) > (Number(planned.sets) || 0)
  })
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useGamification(uid) {
  const [gamification, setGamification] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load gamification data on mount
  useEffect(() => {
    if (!uid) return
    const load = async () => {
      try {
        const snap = await getDoc(gamRef(uid))
        setGamification(snap.exists() ? snap.data() : { ...DEFAULT_GAM })
      } catch (err) {
        console.error('Failed to load gamification:', err)
        setGamification({ ...DEFAULT_GAM })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [uid])

  /**
   * processSession — call this right after saving a new session to Firestore.
   *
   * @param {object} session   — the session document just saved
   * @param {object} plan      — the selected plan (or null for free sessions)
   * @param {object} profile   — user profile (daysPerWeek, dateOfBirth, etc.)
   * @returns {object}         — { newPoints, newBadges, rankUp }
   */
  const processSession = useCallback(async (session, plan, profile) => {
    if (!uid) return null

    // ── 1. Load current gamification state ──────────────────────────────────
    let gam
    try {
      const snap = await getDoc(gamRef(uid))
      gam = snap.exists() ? snap.data() : { ...DEFAULT_GAM }
    } catch {
      gam = { ...DEFAULT_GAM }
    }

    // Deep-clone to avoid mutation
    gam = JSON.parse(JSON.stringify(gam))
    if (!gam.stats) gam.stats = { ...DEFAULT_GAM.stats }
    if (!gam.streakData) gam.streakData = { ...DEFAULT_GAM.streakData }
    if (!gam.pointsHistory) gam.pointsHistory = []
    if (!gam.earnedBadges) gam.earnedBadges = []

    // ── 2. Load previous performance data for PR / overload detection ────────
    const previousPerf = {}
    try {
      const sessionsSnap = await getDocs(
        query(collection(db, 'users', uid, 'sessions'), orderBy('date', 'desc'), limit(20))
      )
      for (const sdoc of sessionsSnap.docs) {
        const s = sdoc.data()
        if (s.completedAt === session.completedAt) continue // skip current session
        for (const ex of (s.exercises || [])) {
          if (!previousPerf[ex.name]) {
            const sets = ex.sets || []
            previousPerf[ex.name] = {
              maxWeight: Math.max(...sets.map((s) => Number(s.weight) || 0), 0),
              maxReps:   Math.max(...sets.map((s) => Number(s.reps) || 0), 0),
              sessionCount: 0,
            }
          }
          previousPerf[ex.name].sessionCount =
            (previousPerf[ex.name].sessionCount || 0) + 1
        }
      }
    } catch (err) {
      console.error('Failed to load previous performance:', err)
    }

    // ── 3. Calculate session metrics ────────────────────────────────────────
    const sessionDate   = session.date || todayStr()
    const completedAt   = new Date(session.completedAt || Date.now())
    const sessionHour   = completedAt.getHours()
    const sessionDOW    = completedAt.getDay() // 0=Sun,1=Mon,...
    const sessionDuration = session.duration || 0
    const exercises     = session.exercises || []
    const planExercises = plan?.days?.[session.dayIndex]?.exercises || []

    const volume = sessionVolume(exercises)
    const rpe    = avgRPE(exercises)
    const bodyweightOnly = isBodyweightSession(exercises)
    const { prCount, prExercises } = countSessionPRs(exercises, previousPerf)
    const { weightOverloads, repOverloads, overloadedExercises } =
      countProgressiveOverloads(exercises, previousPerf)
    const isOverachieverSession = isOverachiever(exercises, planExercises)

    // ── 4. Update streak ────────────────────────────────────────────────────
    const lastActive = gam.streakData.lastActiveDate
    const daysSinceLast = daysBetween(lastActive, sessionDate)
    const gapReturn = lastActive && daysSinceLast >= 14

    if (!lastActive || daysSinceLast > 3) {
      // Reset or start streak (gap of more than 3 days breaks it)
      gam.streakData.currentStreakDays = 1
    } else if (daysSinceLast >= 1) {
      // Continue streak — gap of 1–3 days keeps it going
      gam.streakData.currentStreakDays += 1
    }
    // Same day — no change to streak
    gam.streakData.longestStreak = Math.max(
      gam.streakData.longestStreak,
      gam.streakData.currentStreakDays
    )
    gam.streakData.lastActiveDate = sessionDate
    if (!gam.streakData.activeDays.includes(sessionDate)) {
      gam.streakData.activeDays.push(sessionDate)
      // Keep last 400 days only
      if (gam.streakData.activeDays.length > 400) {
        gam.streakData.activeDays = gam.streakData.activeDays.slice(-400)
      }
    }

    // ── 5. Update Monday streak ─────────────────────────────────────────────
    if (sessionDOW === 1) { // Monday
      const lastMonday = gam.stats.lastMondayDate
      if (lastMonday) {
        const weeksSince = daysBetween(lastMonday, sessionDate) / 7
        if (weeksSince >= 1 && weeksSince < 2) {
          gam.stats.mondayStreak = (gam.stats.mondayStreak || 0) + 1
        } else {
          gam.stats.mondayStreak = 1
        }
      } else {
        gam.stats.mondayStreak = 1
      }
      gam.stats.lastMondayDate = sessionDate
    }

    // ── 6. Update cumulative stats ──────────────────────────────────────────
    gam.stats.totalSessions    = (gam.stats.totalSessions || 0) + 1
    gam.stats.totalVolumeLbs   = (gam.stats.totalVolumeLbs || 0) + volume
    gam.stats.totalPRs         = (gam.stats.totalPRs || 0) + prCount
    if (overloadedExercises.size > 0) {
      gam.stats.totalProgressiveExercises =
        (gam.stats.totalProgressiveExercises || 0) + overloadedExercises.size
    }
    if (bodyweightOnly) {
      gam.stats.bodyweightOnlySessions =
        (gam.stats.bodyweightOnlySessions || 0) + 1
    }

    // ── 7. Plan completion detection ────────────────────────────────────────
    // A plan is "graduated" the first time all of its day indices have been
    // logged at least once.  We track graduated plan IDs so we never
    // double-count, and we fetch sessions by planId directly so the 20-session
    // limit on the perf query doesn't cause false negatives.
    if (session.planId && plan?.days?.length > 0) {
      if (!gam.stats.graduatedPlanIds) gam.stats.graduatedPlanIds = []
      if (!gam.stats.graduatedPlanIds.includes(session.planId)) {
        try {
          const planSessionsSnap = await getDocs(
            query(
              collection(db, 'users', uid, 'sessions'),
              where('planId', '==', session.planId)
            )
          )
          const completedDayIndices = new Set()
          // Include the session being saved right now
          if (typeof session.dayIndex === 'number') {
            completedDayIndices.add(session.dayIndex)
          }
          for (const sdoc of planSessionsSnap.docs) {
            const s = sdoc.data()
            if (s.completedAt === session.completedAt) continue // skip current
            if (typeof s.dayIndex === 'number') completedDayIndices.add(s.dayIndex)
          }
          if (completedDayIndices.size >= plan.days.length) {
            gam.stats.plansCompleted = (gam.stats.plansCompleted || 0) + 1
            gam.stats.graduatedPlanIds.push(session.planId)
          }
        } catch (err) {
          console.error('Failed to check plan completion:', err)
        }
      }
    }

    // ── 9. Repeat session count for Groundhog Gains ─────────────────────────
    if (session.planId && session.dayLabel) {
      const key = `${session.planId}_${session.dayLabel}`
      if (!gam.stats.repeatSessions) gam.stats.repeatSessions = {}
      gam.stats.repeatSessions[key] = (gam.stats.repeatSessions[key] || 0) + 1
    }
    const maxRepeatSession = gam.stats.repeatSessions
      ? Math.max(...Object.values(gam.stats.repeatSessions))
      : 0

    // ── 10. Perfect week check ───────────────────────────────────────────────
    const target = profile?.daysPerWeek || gam.weeklySessionTarget || 4
    gam.weeklySessionTarget = target

    // Count sessions this calendar week (Mon–Sun)
    const today = new Date(sessionDate)
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // Mon=0
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    })
    const sessionsThisWeek = gam.streakData.activeDays.filter((d) =>
      weekDays.includes(d)
    ).length
    const isPerfectWeek = sessionsThisWeek >= target

    // Track perfect week (only award once per week)
    if (isPerfectWeek) {
      const weekKey = weekDays[0]
      if (!gam.stats.perfectWeekDates) gam.stats.perfectWeekDates = []
      if (!gam.stats.perfectWeekDates.includes(weekKey)) {
        gam.stats.perfectWeekDates.push(weekKey)
        gam.perfectWeeks = (gam.perfectWeeks || 0) + 1
      }
    }

    // Perfect weeks this calendar month
    const thisMonth = sessionDate.slice(0, 7) // "YYYY-MM"
    const perfectWeeksThisMonth = (gam.stats.perfectWeekDates || []).filter(
      (d) => d.startsWith(thisMonth)
    ).length

    // ── 11. Birthday check ───────────────────────────────────────────────────
    let isBirthday = false
    if (profile?.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth)
      const now = new Date(sessionDate)
      isBirthday = dob.getMonth() === now.getMonth() &&
                   dob.getDate()  === now.getDate()
    }

    // ── 12. Calculate FP earned this session ────────────────────────────────
    const fpEvents = []
    let sessionFP = 0

    const addFP = (event, points) => {
      fpEvents.push({ event, points, timestamp: new Date().toISOString() })
      sessionFP += points
    }

    // Base session award (cap 100 FP/day from sessions)
    const todaySessionFP = gam.pointsHistory
      .filter((e) => e.timestamp?.startsWith(sessionDate) && e.event === 'session_complete')
      .reduce((s, e) => s + e.points, 0)
    if (todaySessionFP < 100) {
      addFP('session_complete', Math.min(50, 100 - todaySessionFP))
    }

    // Full plan day completion bonus
    if (planExercises.length > 0 && exercises.length >= planExercises.length) {
      addFP('full_day_complete', 25)
    }

    // PRs (max 5 per session)
    for (let i = 0; i < prCount; i++) addFP('personal_record', 100)

    // Progressive overload
    for (let i = 0; i < weightOverloads; i++) addFP('weight_increase', 30)
    for (let i = 0; i < repOverloads; i++) addFP('rep_increase', 20)

    // Perfect week
    if (isPerfectWeek) {
      const weekKey = weekDays[0]
      const alreadyAwarded = gam.pointsHistory.some(
        (e) => e.event === 'perfect_week' && e.weekKey === weekKey
      )
      if (!alreadyAwarded) addFP('perfect_week', 200)
    }

    // Streak milestones
    const streak = gam.streakData.currentStreakDays
    const streakMilestones = [
      { days: 7,  key: 'streak_7',  points: 150 },
      { days: 30, key: 'streak_30', points: 500 },
      { days: 90, key: 'streak_90', points: 1500 },
    ]
    for (const m of streakMilestones) {
      if (streak >= m.days) {
        const alreadyAwarded = gam.pointsHistory.some((e) => e.event === m.key)
        if (!alreadyAwarded) addFP(m.key, m.points)
      }
    }

    // One-time awards
    if (gam.stats.totalSessions === 1) addFP('first_workout', 50)
    if (!gam.stats.profileSetupAwarded && profile?.fitnessLevel) {
      addFP('profile_setup', 100)
      gam.stats.profileSetupAwarded = true
    }

    // ── 13. Update total points ──────────────────────────────────────────────
    const previousPoints = gam.totalPoints || 0
    gam.totalPoints = previousPoints + sessionFP

    // Update points history (keep last 100)
    gam.pointsHistory = [
      ...gam.pointsHistory,
      ...fpEvents,
    ].slice(-100)

    // ── 14. Check rank up ────────────────────────────────────────────────────
    const previousRank = getRankForPoints(previousPoints)
    const newRank      = getRankForPoints(gam.totalPoints)
    const rankUp = newRank.level > previousRank.level ? newRank : null
    gam.currentRank = newRank.level

    // ── 15. Evaluate badge triggers ──────────────────────────────────────────
    const alreadyEarned = new Set(gam.earnedBadges.map((b) => b.badgeId))
    const newBadges = []

    const checkBadge = (badgeId, condition) => {
      if (alreadyEarned.has(badgeId) || !condition) return
      const badge = BADGE_MAP[badgeId]
      if (!badge) return
      newBadges.push({ badgeId, earnedAt: new Date().toISOString() })
      alreadyEarned.add(badgeId)
      // Badge FP is added separately
      gam.totalPoints += badge.pointsAwarded
      gam.pointsHistory.push({
        event: `badge_${badgeId}`,
        points: badge.pointsAwarded,
        timestamp: new Date().toISOString(),
      })
    }

    // Session count badges
    checkBadge('first_rep',        gam.stats.totalSessions >= 1)
    checkBadge('showing_up',       gam.stats.totalSessions >= 10)
    checkBadge('habitual',         gam.stats.totalSessions >= 25)
    checkBadge('century',          gam.stats.totalSessions >= 100)
    checkBadge('iron_commitment',  gam.stats.totalSessions >= 250)

    // PR badges
    checkBadge('first_pr',     gam.stats.totalPRs >= 1)
    checkBadge('record_breaker', gam.stats.totalPRs >= 10)
    checkBadge('pr_machine',   gam.stats.totalPRs >= 50)

    // Progressive overload
    checkBadge('progresser',   gam.stats.totalProgressiveExercises >= 5)

    // Volume
    checkBadge('volume_king',  gam.stats.totalVolumeLbs >= 1000000 && gam.currentRank >= 7)

    // Plan completion
    checkBadge('plan_graduate',      gam.stats.plansCompleted >= 1)
    checkBadge('double_down',        gam.stats.plansCompleted >= 2)
    checkBadge('program_collector',  gam.stats.plansCompleted >= 5)

    // Streak badges
    checkBadge('week_warrior',      streak >= 7)
    checkBadge('monthly_grind',     streak >= 30)
    checkBadge('quarterly_athlete', streak >= 90)
    checkBadge('year_of_iron',      streak >= 365)

    // Perfect week / month
    checkBadge('perfect_week',    (gam.perfectWeeks || 0) >= 1)
    checkBadge('flawless_month',  perfectWeeksThisMonth >= 4)

    // Hidden badges
    checkBadge('night_owl',   sessionHour >= 0 && sessionHour < 5)
    checkBadge('early_bird',  sessionHour >= 5 && sessionHour < 6)
    checkBadge('birthday_gains', isBirthday)
    checkBadge('new_year_lifts',
      new Date(sessionDate).getMonth() === 0 && new Date(sessionDate).getDate() === 1)
    checkBadge('dead_of_winter',
      new Date(sessionDate).getMonth() === 11 && new Date(sessionDate).getDate() === 21)
    checkBadge('monday_warrior', (gam.stats.mondayStreak || 0) >= 4)
    checkBadge('comeback_kid',   gapReturn)
    checkBadge('the_long_haul',  sessionDuration >= 90)
    checkBadge('quick_draw',     sessionDuration > 0 && sessionDuration < 30)
    checkBadge('max_effort',     rpe !== null && rpe >= 9)
    checkBadge('easy_sunday',    rpe !== null && rpe <= 4)
    checkBadge('the_purist',     (gam.stats.bodyweightOnlySessions || 0) >= 10)
    checkBadge('overachiever',   isOverachieverSession)
    checkBadge('triple_threat',  prCount >= 3)
    checkBadge('groundhog_gains', maxRepeatSession >= 5)

    // ── 16. Append new badges to earned list ────────────────────────────────
    gam.earnedBadges = [...gam.earnedBadges, ...newBadges]

    // Re-check rank after badge FP added
    const finalRank = getRankForPoints(gam.totalPoints)
    const finalRankUp = finalRank.level > previousRank.level ? finalRank : rankUp
    gam.currentRank = finalRank.level

    // ── 17. Write to Firestore ───────────────────────────────────────────────
    try {
      await setDoc(gamRef(uid), gam)
    } catch (err) {
      console.error('Failed to save gamification data:', err)
    }

    // Update local state
    setGamification(gam)

    return {
      newPoints: sessionFP,
      fpEvents,
      newBadges: newBadges.map((b) => BADGE_MAP[b.badgeId]),
      rankUp: finalRankUp,
    }
  }, [uid])

  /**
   * processMovementSession — call after saving a movement session.
   * Updates streak (so cardio counts alongside strength) and awards base FP.
   *
   * @param {object} session  — the movement document just saved
   * @param {object} profile  — user profile
   * @returns {object}        — { newPoints, fpEvents, newBadges, rankUp }
   */
  const processMovementSession = useCallback(async (session, profile) => {
    if (!uid) return null

    let gam
    try {
      const snap = await getDoc(gamRef(uid))
      gam = snap.exists() ? snap.data() : { ...DEFAULT_GAM }
    } catch {
      gam = { ...DEFAULT_GAM }
    }

    gam = JSON.parse(JSON.stringify(gam))
    if (!gam.stats) gam.stats = { ...DEFAULT_GAM.stats }
    if (!gam.streakData) gam.streakData = { ...DEFAULT_GAM.streakData }
    if (!gam.pointsHistory) gam.pointsHistory = []
    if (!gam.earnedBadges) gam.earnedBadges = []

    const sessionDate = session.date || todayStr()

    // ── Update streak (identical logic to processSession) ──────────────────
    const lastActive = gam.streakData.lastActiveDate
    const daysSinceLast = daysBetween(lastActive, sessionDate)
    const gapReturn = lastActive && daysSinceLast >= 14

    if (!lastActive || daysSinceLast > 3) {
      gam.streakData.currentStreakDays = 1
    } else if (daysSinceLast >= 1) {
      gam.streakData.currentStreakDays += 1
    }
    gam.streakData.longestStreak = Math.max(
      gam.streakData.longestStreak,
      gam.streakData.currentStreakDays
    )
    gam.streakData.lastActiveDate = sessionDate
    if (!gam.streakData.activeDays.includes(sessionDate)) {
      gam.streakData.activeDays.push(sessionDate)
      if (gam.streakData.activeDays.length > 400) {
        gam.streakData.activeDays = gam.streakData.activeDays.slice(-400)
      }
    }

    // ── Update movement-specific stats ─────────────────────────────────────
    gam.stats.totalMovementSessions = (gam.stats.totalMovementSessions || 0) + 1

    // ── FP events ──────────────────────────────────────────────────────────
    const fpEvents = []
    let sessionFP = 0
    const addFP = (event, points) => {
      fpEvents.push({ event, points, timestamp: new Date().toISOString() })
      sessionFP += points
    }

    // Base award: 30 FP per movement session (cap 60/day)
    const todayMovementFP = gam.pointsHistory
      .filter((e) => e.timestamp?.startsWith(sessionDate) && e.event === 'movement_complete')
      .reduce((s, e) => s + e.points, 0)
    if (todayMovementFP < 60) {
      addFP('movement_complete', Math.min(30, 60 - todayMovementFP))
    }

    // Streak milestones (shared with strength sessions)
    const streak = gam.streakData.currentStreakDays
    const streakMilestones = [
      { days: 7,  key: 'streak_7',  points: 150 },
      { days: 30, key: 'streak_30', points: 500 },
      { days: 90, key: 'streak_90', points: 1500 },
    ]
    for (const m of streakMilestones) {
      if (streak >= m.days) {
        const alreadyAwarded = gam.pointsHistory.some((e) => e.event === m.key)
        if (!alreadyAwarded) addFP(m.key, m.points)
      }
    }

    // Comeback Kid
    if (gapReturn) {
      const alreadyEarnedComebackKid = gam.earnedBadges.some((b) => b.badgeId === 'comeback_kid')
      if (!alreadyEarnedComebackKid) { /* badge handled below */ }
    }

    // ── Update points ──────────────────────────────────────────────────────
    const previousPoints = gam.totalPoints || 0
    gam.totalPoints = previousPoints + sessionFP
    gam.pointsHistory = [...gam.pointsHistory, ...fpEvents].slice(-100)

    // ── Rank check ─────────────────────────────────────────────────────────
    const previousRank = getRankForPoints(previousPoints)
    const newRank      = getRankForPoints(gam.totalPoints)
    const rankUp = newRank.level > previousRank.level ? newRank : null
    gam.currentRank = newRank.level

    // ── Badge checks (streak + comeback only — no strength-specific badges) ─
    const alreadyEarned = new Set(gam.earnedBadges.map((b) => b.badgeId))
    const newBadges = []
    const checkBadge = (badgeId, condition) => {
      if (alreadyEarned.has(badgeId) || !condition) return
      const badge = BADGE_MAP[badgeId]
      if (!badge) return
      newBadges.push({ badgeId, earnedAt: new Date().toISOString() })
      alreadyEarned.add(badgeId)
      gam.totalPoints += badge.pointsAwarded
      gam.pointsHistory.push({
        event: `badge_${badgeId}`,
        points: badge.pointsAwarded,
        timestamp: new Date().toISOString(),
      })
    }

    checkBadge('week_warrior',      streak >= 7)
    checkBadge('monthly_grind',     streak >= 30)
    checkBadge('quarterly_athlete', streak >= 90)
    checkBadge('year_of_iron',      streak >= 365)
    checkBadge('comeback_kid',      gapReturn)

    gam.earnedBadges = [...gam.earnedBadges, ...newBadges]

    const finalRank = getRankForPoints(gam.totalPoints)
    const finalRankUp = finalRank.level > previousRank.level ? finalRank : rankUp
    gam.currentRank = finalRank.level

    try {
      await setDoc(gamRef(uid), gam)
    } catch (err) {
      console.error('Failed to save gamification data after movement:', err)
    }

    setGamification(gam)

    return {
      newPoints: sessionFP,
      fpEvents,
      newBadges: newBadges.map((b) => BADGE_MAP[b.badgeId]),
      rankUp: finalRankUp,
    }
  }, [uid])

  /**
   * rebuildGamification — recompute ALL gamification data from scratch.
   * Call after editing or deleting a session so totals stay accurate.
   *
   * @param {object} profile — current user profile
   * @returns {object}       — rebuilt gamification document
   */
  const rebuildGamification = useCallback(async (profile) => {
    if (!uid) return null

    // ── Load existing gam to preserve plan-completion data ───────────────────
    let existingGam = { ...DEFAULT_GAM }
    try {
      const snap = await getDoc(gamRef(uid))
      if (snap.exists()) existingGam = snap.data()
    } catch {}

    // ── Fresh slate ──────────────────────────────────────────────────────────
    const gam = JSON.parse(JSON.stringify(DEFAULT_GAM))
    if (!gam.stats) gam.stats = { ...DEFAULT_GAM.stats }
    gam.weeklySessionTarget = profile?.daysPerWeek || existingGam.weeklySessionTarget || 4

    // Preserve plan-completion data (requires fetching plan docs to recalculate;
    // this is preserved as-is since edit/delete rarely affects plan completion).
    gam.stats.plansCompleted       = existingGam.stats?.plansCompleted || 0
    gam.stats.graduatedPlanIds     = existingGam.stats?.graduatedPlanIds || []
    gam.stats.profileSetupAwarded  = existingGam.stats?.profileSetupAwarded || false

    // ── Fetch all sessions (strength + movement) ─────────────────────────────
    const [strengthSnap, movementSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', uid, 'sessions'), orderBy('date', 'asc'))),
      getDocs(query(collection(db, 'users', uid, 'movement'), orderBy('date', 'asc'))),
    ])
    const strengthSessions = strengthSnap.docs.map((d) => ({ ...d.data(), _type: 'strength' }))
    const movementSessions = movementSnap.docs.map((d) => ({ ...d.data(), _type: 'movement' }))
    const allSessions = [...strengthSessions, ...movementSessions].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      return (a.completedAt || '') < (b.completedAt || '') ? -1 : 1
    })

    // ── Per-exercise running best (for PR / overload detection) ─────────────
    const prevBest = {}  // { name: { maxWeight, maxReps, sessionCount } }

    // ── FP accumulation ──────────────────────────────────────────────────────
    const fpEvents = []
    const awardedStreakMilestones  = new Set()
    const awardedPerfectWeekKeys   = new Set()
    const sessionFPByDay           = {}   // strength cap: 100/day
    const movementFPByDay          = {}   // movement cap: 60/day

    // ── Single-session badge trigger flags ───────────────────────────────────
    let hasNightOwl    = false
    let hasEarlyBird   = false
    let hasBirthday    = false
    let hasNewYear     = false
    let hasDeadOfWinter = false
    let hasLongHaul    = false
    let hasQuickDraw   = false
    let hasMaxEffort   = false
    let hasEasySunday  = false
    let hasTripleThreat = false
    let hasGapReturn   = false

    // ── Process each session chronologically ─────────────────────────────────
    for (const session of allSessions) {
      const sessionDate    = session.date
      const completedAt    = new Date(session.completedAt || sessionDate)
      const sessionHour    = completedAt.getHours()
      const sessionDOW     = completedAt.getDay()
      const sessionDuration = session.duration || 0
      const isStrength     = session._type === 'strength'

      // ── Streak ────────────────────────────────────────────────────────────
      const lastActive    = gam.streakData.lastActiveDate
      const daysSinceLast = daysBetween(lastActive, sessionDate)
      const gapReturn     = lastActive && daysSinceLast >= 14
      if (gapReturn) hasGapReturn = true

      if (!lastActive || daysSinceLast > 3) {
        gam.streakData.currentStreakDays = 1
      } else if (daysSinceLast >= 1) {
        gam.streakData.currentStreakDays += 1
      }
      gam.streakData.longestStreak = Math.max(
        gam.streakData.longestStreak,
        gam.streakData.currentStreakDays
      )
      gam.streakData.lastActiveDate = sessionDate
      if (!gam.streakData.activeDays.includes(sessionDate)) {
        gam.streakData.activeDays.push(sessionDate)
        if (gam.streakData.activeDays.length > 400) {
          gam.streakData.activeDays = gam.streakData.activeDays.slice(-400)
        }
      }

      // ── Monday streak ─────────────────────────────────────────────────────
      if (sessionDOW === 1) {
        const lastMonday = gam.stats.lastMondayDate
        if (lastMonday) {
          const weeksSince = daysBetween(lastMonday, sessionDate) / 7
          if (weeksSince >= 1 && weeksSince < 2) gam.stats.mondayStreak = (gam.stats.mondayStreak || 0) + 1
          else gam.stats.mondayStreak = 1
        } else {
          gam.stats.mondayStreak = 1
        }
        gam.stats.lastMondayDate = sessionDate
      }

      // ── Perfect week ──────────────────────────────────────────────────────
      const target    = profile?.daysPerWeek || gam.weeklySessionTarget || 4
      const swDate    = new Date(sessionDate)
      const swDOW     = swDate.getDay() === 0 ? 6 : swDate.getDay() - 1
      const swStart   = new Date(swDate)
      swStart.setDate(swDate.getDate() - swDOW)
      const weekDays  = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(swStart)
        d.setDate(swStart.getDate() + i)
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      })
      const sessionsThisWeek = gam.streakData.activeDays.filter((d) => weekDays.includes(d)).length
      if (sessionsThisWeek >= target) {
        const weekKey = weekDays[0]
        if (!gam.stats.perfectWeekDates) gam.stats.perfectWeekDates = []
        if (!gam.stats.perfectWeekDates.includes(weekKey)) {
          gam.stats.perfectWeekDates.push(weekKey)
          gam.perfectWeeks = (gam.perfectWeeks || 0) + 1
        }
        if (!awardedPerfectWeekKeys.has(weekKey)) {
          awardedPerfectWeekKeys.add(weekKey)
          fpEvents.push({ event: 'perfect_week', points: 200, timestamp: completedAt.toISOString(), weekKey })
        }
      }

      // ── Streak milestone FP ───────────────────────────────────────────────
      const streak = gam.streakData.currentStreakDays
      const streakMilestones = [
        { days: 7,  key: 'streak_7',  points: 150 },
        { days: 30, key: 'streak_30', points: 500 },
        { days: 90, key: 'streak_90', points: 1500 },
      ]
      for (const m of streakMilestones) {
        if (streak >= m.days && !awardedStreakMilestones.has(m.key)) {
          awardedStreakMilestones.add(m.key)
          fpEvents.push({ event: m.key, points: m.points, timestamp: completedAt.toISOString() })
        }
      }

      // ── Per-type processing ───────────────────────────────────────────────
      if (isStrength) {
        const exercises = session.exercises || []
        gam.stats.totalSessions = (gam.stats.totalSessions || 0) + 1

        const volume = sessionVolume(exercises)
        gam.stats.totalVolumeLbs = (gam.stats.totalVolumeLbs || 0) + volume

        if (isBodyweightSession(exercises)) {
          gam.stats.bodyweightOnlySessions = (gam.stats.bodyweightOnlySessions || 0) + 1
        }

        // PR & overload detection against prevBest
        let prCount = 0
        let weightOverloads = 0
        let repOverloads = 0
        const overloadedEx = new Set()
        for (const ex of exercises) {
          const sets = ex.sets || []
          const maxW = Math.max(...sets.map((s) => Number(s.weight) || 0), 0)
          const maxR = Math.max(...sets.map((s) => Number(s.reps) || 0), 0)
          const prev = prevBest[ex.name]
          if (prev) {
            if (maxW > prev.maxWeight || maxR > prev.maxReps) prCount++
            if (prev.sessionCount >= 3) {
              if (maxW > prev.maxWeight) { weightOverloads++; overloadedEx.add(ex.name) }
              else if (maxR > prev.maxReps) { repOverloads++; overloadedEx.add(ex.name) }
            }
          }
          // Update prevBest
          if (!prevBest[ex.name]) {
            prevBest[ex.name] = { maxWeight: maxW, maxReps: maxR, sessionCount: 1 }
          } else {
            prevBest[ex.name] = {
              maxWeight: Math.max(prevBest[ex.name].maxWeight, maxW),
              maxReps:   Math.max(prevBest[ex.name].maxReps, maxR),
              sessionCount: prevBest[ex.name].sessionCount + 1,
            }
          }
        }
        prCount = Math.min(prCount, 5)
        gam.stats.totalPRs = (gam.stats.totalPRs || 0) + prCount
        if (overloadedEx.size > 0) {
          gam.stats.totalProgressiveExercises = (gam.stats.totalProgressiveExercises || 0) + overloadedEx.size
        }
        if (prCount >= 3) hasTripleThreat = true

        // Repeat sessions
        if (session.planId && session.dayLabel) {
          const key = `${session.planId}_${session.dayLabel}`
          if (!gam.stats.repeatSessions) gam.stats.repeatSessions = {}
          gam.stats.repeatSessions[key] = (gam.stats.repeatSessions[key] || 0) + 1
        }

        // Hidden badge flags (strength only)
        if (sessionHour >= 0 && sessionHour < 5) hasNightOwl = true
        if (sessionHour >= 5 && sessionHour < 6) hasEarlyBird = true
        if (sessionDuration >= 90) hasLongHaul = true
        if (sessionDuration > 0 && sessionDuration < 30) hasQuickDraw = true
        const rpe = avgRPE(exercises)
        if (rpe !== null && rpe >= 9) hasMaxEffort = true
        if (rpe !== null && rpe <= 4) hasEasySunday = true

        // Birthday / special-date badges
        if (profile?.dateOfBirth) {
          const dob = new Date(profile.dateOfBirth)
          const sd  = new Date(sessionDate)
          if (dob.getMonth() === sd.getMonth() && dob.getDate() === sd.getDate()) hasBirthday = true
        }
        const sdDate = new Date(sessionDate)
        if (sdDate.getMonth() === 0  && sdDate.getDate() === 1)  hasNewYear = true
        if (sdDate.getMonth() === 11 && sdDate.getDate() === 21) hasDeadOfWinter = true

        // FP: strength session (cap 100/day)
        const dayFP = sessionFPByDay[sessionDate] || 0
        if (dayFP < 100) {
          const earned = Math.min(50, 100 - dayFP)
          fpEvents.push({ event: 'session_complete', points: earned, timestamp: completedAt.toISOString() })
          sessionFPByDay[sessionDate] = dayFP + earned
        }
        for (let i = 0; i < prCount; i++) fpEvents.push({ event: 'personal_record', points: 100, timestamp: completedAt.toISOString() })
        for (let i = 0; i < weightOverloads; i++) fpEvents.push({ event: 'weight_increase', points: 30, timestamp: completedAt.toISOString() })
        for (let i = 0; i < repOverloads; i++) fpEvents.push({ event: 'rep_increase', points: 20, timestamp: completedAt.toISOString() })
        if (gam.stats.totalSessions === 1) fpEvents.push({ event: 'first_workout', points: 50, timestamp: completedAt.toISOString() })

      } else {
        // Movement session
        gam.stats.totalMovementSessions = (gam.stats.totalMovementSessions || 0) + 1
        const dayMFP = movementFPByDay[sessionDate] || 0
        if (dayMFP < 60) {
          const earned = Math.min(30, 60 - dayMFP)
          fpEvents.push({ event: 'movement_complete', points: earned, timestamp: completedAt.toISOString() })
          movementFPByDay[sessionDate] = dayMFP + earned
        }
      }
    }

    // Profile setup FP (one-time, preserved flag)
    if (gam.stats.profileSetupAwarded) {
      fpEvents.push({ event: 'profile_setup', points: 100, timestamp: new Date().toISOString() })
    }

    // ── Compute total base FP ────────────────────────────────────────────────
    gam.totalPoints = fpEvents.reduce((s, e) => s + (e.points || 0), 0)
    gam.pointsHistory = fpEvents.slice(-100)

    // ── Badge evaluation ──────────────────────────────────────────────────────
    const maxRepeatSession = gam.stats.repeatSessions
      ? Math.max(...Object.values(gam.stats.repeatSessions), 0)
      : 0
    const thisMonth = new Date().toISOString().slice(0, 7)
    const perfectWeeksThisMonth = (gam.stats.perfectWeekDates || []).filter(
      (d) => d.startsWith(thisMonth)
    ).length

    const newBadges = []
    const checkBadge = (badgeId, condition) => {
      if (!condition) return
      const badge = BADGE_MAP[badgeId]
      if (!badge) return
      newBadges.push({ badgeId, earnedAt: new Date().toISOString() })
      gam.totalPoints += badge.pointsAwarded
      gam.pointsHistory.push({
        event: `badge_${badgeId}`,
        points: badge.pointsAwarded,
        timestamp: new Date().toISOString(),
      })
    }

    const streak = gam.streakData.currentStreakDays
    checkBadge('first_rep',          gam.stats.totalSessions >= 1)
    checkBadge('showing_up',         gam.stats.totalSessions >= 10)
    checkBadge('habitual',           gam.stats.totalSessions >= 25)
    checkBadge('century',            gam.stats.totalSessions >= 100)
    checkBadge('iron_commitment',    gam.stats.totalSessions >= 250)
    checkBadge('first_pr',           gam.stats.totalPRs >= 1)
    checkBadge('record_breaker',     gam.stats.totalPRs >= 10)
    checkBadge('pr_machine',         gam.stats.totalPRs >= 50)
    checkBadge('progresser',         gam.stats.totalProgressiveExercises >= 5)
    checkBadge('volume_king',        gam.stats.totalVolumeLbs >= 1000000 && getRankForPoints(gam.totalPoints).level >= 7)
    checkBadge('plan_graduate',      gam.stats.plansCompleted >= 1)
    checkBadge('double_down',        gam.stats.plansCompleted >= 2)
    checkBadge('program_collector',  gam.stats.plansCompleted >= 5)
    checkBadge('week_warrior',       streak >= 7)
    checkBadge('monthly_grind',      streak >= 30)
    checkBadge('quarterly_athlete',  streak >= 90)
    checkBadge('year_of_iron',       streak >= 365)
    checkBadge('perfect_week',       (gam.perfectWeeks || 0) >= 1)
    checkBadge('flawless_month',     perfectWeeksThisMonth >= 4)
    checkBadge('night_owl',          hasNightOwl)
    checkBadge('early_bird',         hasEarlyBird)
    checkBadge('birthday_gains',     hasBirthday)
    checkBadge('new_year_lifts',     hasNewYear)
    checkBadge('dead_of_winter',     hasDeadOfWinter)
    checkBadge('monday_warrior',     (gam.stats.mondayStreak || 0) >= 4)
    checkBadge('comeback_kid',       hasGapReturn)
    checkBadge('the_long_haul',      hasLongHaul)
    checkBadge('quick_draw',         hasQuickDraw)
    checkBadge('max_effort',         hasMaxEffort)
    checkBadge('easy_sunday',        hasEasySunday)
    checkBadge('the_purist',         (gam.stats.bodyweightOnlySessions || 0) >= 10)
    checkBadge('triple_threat',      hasTripleThreat)
    checkBadge('groundhog_gains',    maxRepeatSession >= 5)

    gam.earnedBadges = newBadges

    // ── Final rank ────────────────────────────────────────────────────────────
    const finalRank  = getRankForPoints(gam.totalPoints)
    gam.currentRank  = finalRank.level

    // ── Save ─────────────────────────────────────────────────────────────────
    try {
      await setDoc(gamRef(uid), gam)
    } catch (err) {
      console.error('Failed to save rebuilt gamification:', err)
    }

    setGamification(gam)
    return gam
  }, [uid])

  return { processSession, processMovementSession, rebuildGamification, gamification, loading }
}

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useFirestore() {
  // ---- Profile ----
  async function saveProfile(uid, profileData) {
    await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
      ...profileData,
      updatedAt: new Date().toISOString(),
    })
  }

  async function getProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'))
    return snap.exists() ? snap.data() : null
  }

  // ---- Plans ----
  async function savePlan(uid, planData) {
    const docRef = await addDoc(collection(db, 'users', uid, 'plans'), {
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
      archived: false,
    })
    return docRef.id
  }

  async function getPlans(uid) {
    const q = query(
      collection(db, 'users', uid, 'plans'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  async function updatePlan(uid, planId, updates) {
    await updateDoc(doc(db, 'users', uid, 'plans', planId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  }

  // ---- Sessions ----
  async function saveSession(uid, sessionData) {
    const docRef = await addDoc(collection(db, 'users', uid, 'sessions'), {
      ...sessionData,
      completedAt: new Date().toISOString(),
    })
    return docRef.id
  }

  async function getSessions(uid, limitCount = 50) {
    const q = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('date', 'desc'),
      limit(limitCount)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  async function getSessionsForExercise(uid, exerciseName) {
    const allSessionsQ = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('date', 'asc')
    )
    const snap = await getDocs(allSessionsQ)
    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return sessions.filter((s) =>
      s.exercises?.some(
        (e) => e.name?.toLowerCase() === exerciseName.toLowerCase()
      )
    )
  }

  return {
    saveProfile,
    getProfile,
    savePlan,
    getPlans,
    updatePlan,
    saveSession,
    getSessions,
    getSessionsForExercise,
  }
}

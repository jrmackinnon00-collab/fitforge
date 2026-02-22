import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import useAuthStore from './store/useAuthStore'
import useThemeStore from './store/useThemeStore'
import useProfileStore from './store/useProfileStore'
import LoadingSpinner from './components/LoadingSpinner'
import LoginScreen from './screens/LoginScreen'
import ProfileSetup from './screens/ProfileSetup'
import MainLayout from './layouts/MainLayout'
import Dashboard from './screens/Dashboard'
import MyPlans from './screens/MyPlans'
import PlanEditor from './screens/PlanEditor'
import LogWorkout from './screens/LogWorkout'
import Progress from './screens/Progress'
import ProfileScreen from './screens/ProfileScreen'
import Achievements from './screens/Achievements'

/**
 * Check whether a Firebase UID is on the approved allowlist.
 * The allowlist lives at Firestore: /config/allowedUsers  { uids: ['uid1','uid2',...] }
 * You manage this document directly in the Firebase Console — no code deploy needed.
 */
async function isUserAllowed(uid) {
  try {
    const snap = await getDoc(doc(db, 'config', 'allowedUsers'))
    if (!snap.exists()) return false
    const { uids = [] } = snap.data()
    return uids.includes(uid)
  } catch {
    return false
  }
}

function App() {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const { isDark } = useThemeStore()
  const { setProfile, resetProfile } = useProfileStore()

  // null = still checking, true = has profile, false = needs setup
  const [hasProfile, setHasProfile] = useState(null)
  // null = still checking, true = on allowlist, false = rejected
  const [isAllowed, setIsAllowed] = useState(null)

  useEffect(() => {
    // We need a ref-like way to read isAllowed inside the callback without
    // re-registering the listener. Using a closure variable is cleanest here.
    let currentIsAllowed = null

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // 1. Check allowlist first
        const allowed = await isUserAllowed(firebaseUser.uid)
        currentIsAllowed = allowed

        if (!allowed) {
          // Not approved — sign them back out immediately
          await signOut(auth)
          setIsAllowed(false)
          setHasProfile(null)
          resetProfile()
          setLoading(false)
          return
        }

        setIsAllowed(true)

        // 2. Check whether they've completed profile setup
        try {
          const profileDoc = await getDoc(
            doc(db, 'users', firebaseUser.uid, 'profile', 'data')
          )
          if (profileDoc.exists()) {
            // Returning user — hydrate the store with their saved data
            setProfile(profileDoc.data())
            setHasProfile(true)
          } else {
            // New (approved) user — blank slate for profile setup
            resetProfile()
            setHasProfile(false)
          }
        } catch {
          resetProfile()
          setHasProfile(false)
        }
      } else {
        // Signed out. If this was triggered by the allowlist rejection above
        // (currentIsAllowed === false) we keep isAllowed(false) so the pending
        // screen stays visible. A genuine user-initiated logout resets everything.
        if (currentIsAllowed !== false) {
          setIsAllowed(null)
        }
        resetProfile()
        setHasProfile(null)
      }

      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading, setProfile, resetProfile])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Still resolving auth / allowlist / profile
  if (loading || (user && (isAllowed === null || hasProfile === null))) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Signed in with Google but not on the allowlist → show pending screen
  if (isAllowed === false) {
    return <LoginScreen accessDenied={true} />
  }

  // Where an allowed user lands after sign-in
  const homeRoute = user
    ? hasProfile ? '/dashboard' : '/setup'
    : '/login'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={homeRoute} replace />} />

        <Route
          path="/login"
          element={user ? <Navigate to={homeRoute} replace /> : <LoginScreen />}
        />

        <Route
          path="/setup"
          element={
            user
              ? <ProfileSetup onComplete={() => setHasProfile(true)} />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/dashboard"
          element={user ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="plans" element={<MyPlans />} />
          <Route path="plans/new" element={<PlanEditor />} />
          <Route path="plans/:planId/edit" element={<PlanEditor />} />
          <Route path="log" element={<LogWorkout />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="achievements" element={<Achievements />} />
        </Route>

        <Route path="*" element={<Navigate to={homeRoute} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

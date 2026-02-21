import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import useAuthStore from './store/useAuthStore'
import useThemeStore from './store/useThemeStore'
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

function App() {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const { isDark } = useThemeStore()
  // null = unknown, true = has profile, false = needs setup
  const [hasProfile, setHasProfile] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Check if this user has already completed profile setup
        try {
          const profileDoc = await getDoc(
            doc(db, 'users', firebaseUser.uid, 'profile', 'data')
          )
          setHasProfile(profileDoc.exists())
        } catch {
          setHasProfile(false)
        }
      } else {
        setHasProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Still waiting on auth + profile check
  if (loading || (user && hasProfile === null)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Where should a freshly-logged-in user land?
  const homeRoute = user
    ? hasProfile
      ? '/dashboard'
      : '/setup'
    : '/login'

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth screens */}
        <Route
          path="/"
          element={<Navigate to={homeRoute} replace />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to={homeRoute} replace /> : <LoginScreen />}
        />

        {/* Profile setup — accessible whether or not profile exists so user can revisit */}
        <Route
          path="/setup"
          element={user ? <ProfileSetup onComplete={() => setHasProfile(true)} /> : <Navigate to="/login" replace />}
        />

        {/* Main app — protected */}
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
        </Route>

        <Route
          path="*"
          element={<Navigate to={homeRoute} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

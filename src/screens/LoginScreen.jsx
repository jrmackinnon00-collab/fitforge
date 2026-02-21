import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

// Three views this screen can show
const VIEW = {
  LOGIN: 'login',       // default — sign in with Google
  REQUEST: 'request',  // request access form
  PENDING: 'pending',  // submitted / awaiting approval
}

function LoginScreen({ accessDenied = false }) {
  const [view, setView] = useState(accessDenied ? VIEW.PENDING : VIEW.LOGIN)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Request-access form fields
  const [reqName, setReqName]       = useState('')
  const [reqEmail, setReqEmail]     = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // ── Google sign-in ──────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      // App.jsx onAuthStateChanged will handle redirect or show access-denied
    } catch (err) {
      console.error('Sign in error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Request access ───────────────────────────────────────────────────────
  const handleRequestAccess = async (e) => {
    e.preventDefault()
    if (!reqEmail.trim() || !reqEmail.includes('@')) {
      setSubmitError('Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)

    try {
      const emailKey = reqEmail.trim().toLowerCase().replace(/\./g, '_')

      // Check if already requested
      const existing = await getDoc(doc(db, 'joinRequests', emailKey))
      if (!existing.exists()) {
        // Save request to Firestore
        await setDoc(doc(db, 'joinRequests', emailKey), {
          name: reqName.trim() || '',
          email: reqEmail.trim().toLowerCase(),
          message: reqMessage.trim() || '',
          status: 'pending',
          requestedAt: serverTimestamp(),
        })
      }

      // Fire-and-forget notification email via our Vercel API route
      fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reqName.trim(),
          email: reqEmail.trim().toLowerCase(),
          message: reqMessage.trim(),
        }),
      }).catch(() => {}) // silent — email is best-effort

      setView(VIEW.PENDING)
    } catch (err) {
      console.error('Request access error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🏋️</div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            Fit<span className="text-orange-500">Forge</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">Build your best self</p>
        </div>

        {/* ── VIEW: LOGIN ─────────────────────────────────────────────────── */}
        {view === VIEW.LOGIN && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { emoji: '📋', label: 'AI Plans' },
                { emoji: '📊', label: 'Track PRs' },
                { emoji: '🔥', label: 'Streaks' },
              ].map(({ emoji, label }) => (
                <div key={label} className="bg-slate-800 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="text-slate-400 text-xs font-medium">{label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-h-[56px] shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <GoogleLogo />
                  Sign in with Google
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">don't have access?</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              onClick={() => setView(VIEW.REQUEST)}
              className="w-full py-3.5 rounded-2xl border border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400 font-semibold text-sm transition-all active:scale-95"
            >
              Request Access
            </button>

            <p className="text-center text-slate-600 text-xs mt-8">
              By signing in, you agree to our Terms of Service
            </p>
          </>
        )}

        {/* ── VIEW: REQUEST ACCESS FORM ───────────────────────────────────── */}
        {view === VIEW.REQUEST && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Request Access</h2>
              <p className="text-slate-400 text-sm">
                FitForge is currently invite-only. Leave your details and you'll be notified when access is granted.
              </p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Your Name <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px] placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px] placeholder:text-slate-600"
                />
                <p className="text-slate-600 text-xs mt-1">
                  Use the same email you'll sign in with via Google
                </p>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Message <span className="text-slate-600">(optional)</span>
                </label>
                <textarea
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="How do you know the app owner? What are your fitness goals?"
                  rows={3}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-sm resize-none placeholder:text-slate-600"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-70 min-h-[56px]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Send Request'
                )}
              </button>
            </form>

            <button
              onClick={() => setView(VIEW.LOGIN)}
              className="w-full mt-4 py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
            >
              ← Back to Sign In
            </button>
          </>
        )}

        {/* ── VIEW: PENDING / ACCESS DENIED ──────────────────────────────── */}
        {view === VIEW.PENDING && (
          <div className="text-center">
            <div className="text-6xl mb-5">⏳</div>
            <h2 className="text-xl font-bold text-white mb-3">Request Received</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your request has been sent to the app owner. You'll be notified once your access is approved — usually within a day or two.
            </p>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-left mb-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">What happens next</p>
              <ol className="text-slate-300 text-sm space-y-2">
                <li className="flex gap-2"><span className="text-orange-500 font-bold shrink-0">1.</span> The owner reviews your request</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold shrink-0">2.</span> If approved, you'll receive an email</li>
                <li className="flex gap-2"><span className="text-orange-500 font-bold shrink-0">3.</span> Come back and sign in with Google</li>
              </ol>
            </div>
            <button
              onClick={() => setView(VIEW.LOGIN)}
              className="w-full py-3.5 rounded-2xl border border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400 font-semibold text-sm transition-all active:scale-95"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Google G logo so we don't need an extra import
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default LoginScreen

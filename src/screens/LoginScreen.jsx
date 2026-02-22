import { useState } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

// Top-level views
const VIEW = {
  LOGIN:   'login',    // sign-in screen (Google or Email tabs)
  REQUEST: 'request',  // request access form
  PENDING: 'pending',  // submitted / awaiting approval
  RESET:   'reset',    // forgot password
}

// Auth method tabs
const TAB = { GOOGLE: 'google', EMAIL: 'email' }

function LoginScreen({ accessDenied = false }) {
  const [view, setView]   = useState(accessDenied ? VIEW.PENDING : VIEW.LOGIN)
  const [tab, setTab]     = useState(TAB.GOOGLE)
  const [error, setError] = useState(null)

  // ── Email/password fields ──────────────────────────────────────────────
  const [emailInput, setEmailInput]   = useState('')
  const [password, setPassword]       = useState('')
  const [isSignUp, setIsSignUp]       = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ── Google sign-in ─────────────────────────────────────────────────────
  const [googleLoading, setGoogleLoading] = useState(false)

  // ── Request-access form ────────────────────────────────────────────────
  const [reqName, setReqName]         = useState('')
  const [reqEmail, setReqEmail]       = useState('')
  const [reqPassword, setReqPassword] = useState('')
  const [reqShowPw, setReqShowPw]     = useState(false)
  const [reqMessage, setReqMessage]   = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // ── Password reset ─────────────────────────────────────────────────────
  const [resetEmail, setResetEmail]   = useState('')
  const [resetSent, setResetSent]     = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError]   = useState(null)

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError(null)
    if (!emailInput.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setEmailLoading(true)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailInput.trim(), password)
      } else {
        await signInWithEmailAndPassword(auth, emailInput.trim(), password)
      }
      // App.jsx onAuthStateChanged handles redirect / allowlist check
    } catch (err) {
      console.error('Email auth error:', err)
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Incorrect email or password.')
          break
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Try signing in instead.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/too-many-requests':
          setError('Too many attempts. Please wait a moment and try again.')
          break
        default:
          setError('Something went wrong. Please try again.')
      }
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setResetError(null)
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.')
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim())
      setResetSent(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setResetError('Could not send reset email. Check the address and try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleRequestAccess = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    if (!reqEmail.trim() || !reqEmail.includes('@')) {
      setSubmitError('Please enter a valid email address.')
      return
    }
    if (reqPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    try {
      // 1. Create the Firebase Auth account so they get a UID immediately.
      //    App.jsx will see them as not-allowlisted and show PENDING view.
      let uid = null
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          reqEmail.trim().toLowerCase(),
          reqPassword,
        )
        uid = cred.user.uid
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          setSubmitError('An account with this email already exists. Try signing in instead.')
          return
        }
        if (authErr.code === 'auth/invalid-email') {
          setSubmitError('Please enter a valid email address.')
          return
        }
        // If auth account creation fails for any other reason, still save
        // the join request without a UID so you're at least notified.
        console.error('Auth creation error during request:', authErr)
      }

      // 2. Save join request to Firestore (includes UID for easy allowlisting)
      const emailKey = reqEmail.trim().toLowerCase().replace(/[.@]/g, '_')
      await setDoc(doc(db, 'joinRequests', emailKey), {
        name: reqName.trim() || '',
        email: reqEmail.trim().toLowerCase(),
        uid: uid || '',
        message: reqMessage.trim() || '',
        status: 'pending',
        requestedAt: serverTimestamp(),
      })

      // 3. Fire-and-forget email notification to owner
      fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reqName.trim(),
          email: reqEmail.trim().toLowerCase(),
          uid: uid || '(not available)',
          message: reqMessage.trim(),
        }),
      }).catch(() => {})

      // App.jsx will detect the new (unapproved) auth user and show the
      // accessDenied / PENDING view automatically — no manual view switch needed.
    } catch (err) {
      console.error('Request access error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Shared input class ─────────────────────────────────────────────────
  const inputCls = 'w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none text-sm min-h-[48px] placeholder:text-slate-600'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo — always visible */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🏋️</div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            Fit<span className="text-orange-500">Forge</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">Build your best self</p>
        </div>

        {/* ── VIEW: LOGIN ──────────────────────────────────────────────────── */}
        {view === VIEW.LOGIN && (
          <>
            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: '📋', label: 'AI Plans' },
                { emoji: '📊', label: 'Track PRs' },
                { emoji: '🔥', label: 'Streaks' },
              ].map(({ emoji, label }) => (
                <div key={label} className="bg-slate-800 rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="text-slate-400 text-xs font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Tab switcher */}
            <div className="flex bg-slate-800 rounded-2xl p-1 mb-5">
              <button
                onClick={() => { setTab(TAB.GOOGLE); setError(null) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === TAB.GOOGLE
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google
              </button>
              <button
                onClick={() => { setTab(TAB.EMAIL); setError(null) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === TAB.EMAIL
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Email
              </button>
            </div>

            {/* ── Google tab ── */}
            {tab === TAB.GOOGLE && (
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 min-h-[56px] shadow-lg"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <GoogleLogo />
                    Sign in with Google
                  </>
                )}
              </button>
            )}

            {/* ── Email tab ── */}
            {tab === TAB.EMAIL && (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className={inputCls}
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className={inputCls + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-medium px-1"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(emailInput)
                        setResetSent(false)
                        setResetError(null)
                        setView(VIEW.RESET)
                      }}
                      className="text-slate-500 hover:text-orange-400 text-xs transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-70 min-h-[56px]"
                >
                  {emailLoading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                  ) : isSignUp ? 'Create Account' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Create one"}
                </button>
              </form>
            )}

            {/* Shared error */}
            {error && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
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

            <p className="text-center text-slate-600 text-xs mt-6">
              By signing in, you agree to our Terms of Service
            </p>
          </>
        )}

        {/* ── VIEW: FORGOT PASSWORD ─────────────────────────────────────────── */}
        {view === VIEW.RESET && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Reset Password</h2>
              <p className="text-slate-400 text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📬</div>
                <p className="text-white font-semibold mb-2">Check your inbox</p>
                <p className="text-slate-400 text-sm mb-6">
                  A password reset link has been sent to <span className="text-orange-400">{resetEmail}</span>.
                </p>
                <button
                  onClick={() => { setView(VIEW.LOGIN); setTab(TAB.EMAIL) }}
                  className="w-full py-3.5 rounded-2xl border border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400 font-semibold text-sm transition-all active:scale-95"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls}
                  autoFocus
                />

                {resetError && (
                  <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-70 min-h-[56px]"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                  ) : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setView(VIEW.LOGIN); setTab(TAB.EMAIL) }}
                  className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </>
        )}

        {/* ── VIEW: REQUEST ACCESS FORM ─────────────────────────────────────── */}
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
                  className={inputCls}
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
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Create a Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={reqShowPw ? 'text' : 'password'}
                    value={reqPassword}
                    onChange={(e) => setReqPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className={inputCls + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setReqShowPw(!reqShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-medium px-1"
                  >
                    {reqShowPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-slate-600 text-xs mt-1">
                  You'll use this email + password to sign in once approved.
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
                ) : 'Send Request'}
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

        {/* ── VIEW: PENDING ─────────────────────────────────────────────────── */}
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
                <li className="flex gap-2"><span className="text-orange-500 font-bold shrink-0">3.</span> Come back and sign in with Google or email</li>
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

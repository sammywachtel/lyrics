import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-creative-50 to-warm-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-creative from-primary-300/30 to-creative-300/30 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-creative from-creative-300/25 to-warm-300/25 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo/Brand Header */}
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-creative from-primary-500 to-creative-600 flex items-center justify-center shadow-glow-primary">
              <span className="text-white font-bold text-2xl">♪</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-creative from-primary-400 to-creative-500 opacity-50 blur-lg -z-10"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-creative from-neutral-900 via-primary-800 to-creative-800 bg-clip-text text-transparent mb-2">
            Lyricist
          </h1>
          <p className="text-neutral-600 font-medium">AI-Powered Songwriting</p>
        </div>

        <div
          className="bg-white/80 backdrop-blur-xl shadow-strong rounded-3xl border border-white/50 p-8 overflow-hidden relative"
          data-testid="auth-form"
        >
          {/* Card background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-creative from-primary-300/15 to-creative-300/15 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>

          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {mode === 'signin' ? 'Welcome back!' : 'Join the community'}
              </h2>
              <p className="text-neutral-600">
                {mode === 'signin' ? 'Continue your creative journey' : 'Start your songwriting adventure'}
              </p>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-neutral-600">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => onModeChange('signup')}
                      className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Sign up here
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => onModeChange('signin')}
                      className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    data-testid="email-input"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl placeholder:text-neutral-400 text-neutral-900 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft focus:shadow-medium"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    data-testid="password-input"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl placeholder:text-neutral-400 text-neutral-900 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft focus:shadow-medium"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 p-4 animate-slide-up">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <div className="text-sm text-red-800 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-gradient-to-r from-success-50 to-success-100/50 border border-success-200 p-4 animate-slide-up">
                  <div className="flex items-center space-x-2">
                    <span className="text-success-500">✓</span>
                    <div className="text-sm text-success-800 font-medium">{message}</div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-semibold py-4 px-6 rounded-xl shadow-medium hover:shadow-glow-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? '🔑' : '✨'}</span>
                      <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    </>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-creative from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

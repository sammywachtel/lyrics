/**
 * Backend Authentication Service
 *
 * Replaces Supabase authentication with backend-only auth endpoints.
 * This ensures the frontend only communicates with our Python backend.
 */

const API_BASE_URL = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  ? 'http://localhost:8001'
  : (typeof window !== 'undefined' && (window as { __VITE_API_URL__?: string }).__VITE_API_URL__) || 'http://localhost:8001'

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthResponse {
  user: User
  session?: Session
  message?: string
}

export interface AuthError {
  message: string
  status?: number
}

class BackendAuthService {
  private session: Session | null = null
  private user: User | null = null
  private listeners: ((event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void)[] = []

  constructor() {
    // Load session from localStorage on initialization
    this.loadSessionFromStorage()
  }

  private loadSessionFromStorage() {
    try {
      const storedSession = localStorage.getItem('auth_session')
      const storedUser = localStorage.getItem('auth_user')

      if (storedSession && storedUser) {
        this.session = JSON.parse(storedSession)
        this.user = JSON.parse(storedUser)

        // Check if session is expired
        if (this.session && this.isSessionExpired()) {
          this.clearSession()
        }
      }
    } catch (error) {
      console.warn('Failed to load session from storage:', error)
      this.clearSession()
    }
  }

  private saveSessionToStorage() {
    try {
      if (this.session && this.user) {
        localStorage.setItem('auth_session', JSON.stringify(this.session))
        localStorage.setItem('auth_user', JSON.stringify(this.user))
      } else {
        this.clearSessionFromStorage()
      }
    } catch (error) {
      console.warn('Failed to save session to storage:', error)
    }
  }

  private clearSessionFromStorage() {
    localStorage.removeItem('auth_session')
    localStorage.removeItem('auth_user')
  }

  private clearSession() {
    this.session = null
    this.user = null
    this.clearSessionFromStorage()
  }

  private isSessionExpired(): boolean {
    if (!this.session) return true

    // Assume token expires after expires_in seconds from storage time
    // This is a simplified check - in production you'd decode JWT
    const stored = localStorage.getItem('auth_session_time')
    if (!stored) return true

    const storedTime = parseInt(stored)
    const now = Date.now()
    const expiresAt = storedTime + (this.session.expires_in * 1000)

    return now >= expiresAt
  }

  private notifyListeners(event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, session)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          error: {
            message: errorData.detail || 'Sign in failed',
            status: response.status
          }
        }
      }

      const data = await response.json()

      this.user = data.user
      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      }

      // Store session creation time for expiry check
      localStorage.setItem('auth_session_time', Date.now().toString())
      this.saveSessionToStorage()

      this.notifyListeners('SIGNED_IN', this.session)

      return { error: null }

    } catch (error) {
      console.error('Sign in error:', error)
      return {
        error: {
          message: 'Network error during sign in'
        }
      }
    }
  }

  async signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          error: {
            message: errorData.detail || 'Sign up failed',
            status: response.status
          }
        }
      }

      const data = await response.json()

      this.user = data.user

      // Handle case where email confirmation is required
      if (data.session) {
        this.session = data.session
        localStorage.setItem('auth_session_time', Date.now().toString())
        this.saveSessionToStorage()
        this.notifyListeners('SIGNED_IN', this.session)
      }

      return { error: null }

    } catch (error) {
      console.error('Sign up error:', error)
      return {
        error: {
          message: 'Network error during sign up'
        }
      }
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Call backend signout endpoint
      await fetch(`${API_BASE_URL}/api/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.session?.access_token && {
            'Authorization': `Bearer ${this.session.access_token}`
          })
        },
      })

      // Clear local session regardless of backend response
      this.clearSession()
      this.notifyListeners('SIGNED_OUT', null)

      return { error: null }

    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear local session even if backend call fails
      this.clearSession()
      this.notifyListeners('SIGNED_OUT', null)

      return { error: null } // Don't report network errors for signout
    }
  }

  async getSession(): Promise<{ data: { session: Session | null }, error: AuthError | null }> {
    if (this.session && !this.isSessionExpired()) {
      return {
        data: { session: this.session },
        error: null
      }
    }

    // Try to refresh if we have a refresh token
    if (this.session?.refresh_token) {
      const refreshResult = await this.refreshSession()
      if (!refreshResult.error) {
        return {
          data: { session: this.session },
          error: null
        }
      }
    }

    // No valid session
    this.clearSession()
    return {
      data: { session: null },
      error: null
    }
  }

  async refreshSession(): Promise<{ error: AuthError | null }> {
    if (!this.session?.refresh_token) {
      return { error: { message: 'No refresh token available' } }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.session.refresh_token }),
      })

      if (!response.ok) {
        this.clearSession()
        return { error: { message: 'Token refresh failed' } }
      }

      const data = await response.json()

      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      }

      localStorage.setItem('auth_session_time', Date.now().toString())
      this.saveSessionToStorage()

      return { error: null }

    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearSession()
      return { error: { message: 'Network error during token refresh' } }
    }
  }

  getUser(): User | null {
    return this.user
  }

  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void) {
    this.listeners.push(callback)

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback)
            if (index > -1) {
              this.listeners.splice(index, 1)
            }
          }
        }
      }
    }
  }
}

// Export singleton instance
export const authService = new BackendAuthService()

// Compatibility interface for existing Supabase-style usage
export const auth = {
  signInWithPassword: ({ email, password }: { email: string, password: string }) =>
    authService.signIn(email, password),
  signUp: ({ email, password }: { email: string, password: string }) =>
    authService.signUp(email, password),
  signOut: () => authService.signOut(),
  getSession: () => authService.getSession(),
  refreshSession: () => authService.refreshSession(),
  getUser: () => authService.getUser(),
  onAuthStateChange: (callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void) =>
    authService.onAuthStateChange(callback)
}

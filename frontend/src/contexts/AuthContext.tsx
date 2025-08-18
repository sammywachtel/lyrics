import { createContext, useContext, useEffect, useState } from 'react'
import { authService, type User, type Session, type AuthError } from '../lib/authService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(authService.getUser())
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setSession(null)
      setUser(null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)

      // Always update session and user state for all auth events
      setSession(session)
      setUser(authService.getUser())
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await authService.signUp(email, password)
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password)
    return { error }
  }

  const signOut = async () => {
    try {
      const { error } = await authService.signOut()

      // Ensure state is cleared even if there's an error
      setSession(null)
      setUser(null)

      return { error }
    } catch (error) {
      console.error('Error during sign out:', error)
      // Clear state anyway
      setSession(null)
      setUser(null)
      return { error: null } // Return null error for consistency with AuthError type
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

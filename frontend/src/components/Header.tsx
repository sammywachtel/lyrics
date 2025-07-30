import { useAuth } from '../contexts/AuthContext'

export function Header() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
          <header className="relative bg-white backdrop-blur-xl border-b border-neutral-200 shadow-soft">
      {/* No background gradient */}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-2xl">♪</span>
                </div>
                <div className="absolute inset-0 rounded-lg bg-indigo-500 opacity-40 blur-sm -z-10"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Lyricist
                </h1>
                <p className="text-xs text-neutral-500 font-medium">AI-Powered Songwriting</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-neutral-700">Welcome back</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="group relative px-4 py-2.5 bg-white/50 hover:bg-white/80 border border-neutral-200/50 hover:border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-all duration-200 shadow-soft hover:shadow-medium backdrop-blur-sm"
                >
                  <span className="relative z-10">Sign Out</span>
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { Logo } from './Logo'
import { TabBar } from './TabBar'

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream text-plum-800 dark:bg-plum-950 dark:text-blush-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="floating-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blush-200/40 blur-3xl dark:bg-blush-800/20" />
        <div className="floating-blob-slow absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-lavender-200/40 blur-3xl dark:bg-lavender-400/10" />
        <div className="floating-blob absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-blush-100/50 blur-3xl dark:bg-plum-800/20" />
      </div>

      <header className="relative border-b border-blush-100 dark:border-plum-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink
            to="/trips"
            className="flex items-center gap-2 font-display text-xl font-semibold italic text-plum-800 dark:text-blush-50"
          >
            <Logo size={32} />
            Ember
          </NavLink>
          {user && (
            <button
              onClick={() => signOut()}
              className="text-sm text-plum-400 hover:text-plum-700 dark:text-plum-400 dark:hover:text-blush-200"
            >
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-4 py-6 pb-24">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      {user && <TabBar />}
    </div>
  )
}

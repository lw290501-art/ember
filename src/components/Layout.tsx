import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { Logo } from './Logo'

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream text-plum-800 dark:bg-plum-950 dark:text-blush-50">
      <header className="border-b border-blush-100 dark:border-plum-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink
            to="/trips"
            className="flex items-center gap-2 font-display text-xl font-semibold italic text-plum-800 dark:text-blush-50"
          >
            <Logo size={32} />
            Ember
          </NavLink>
          {user && (
            <div className="flex items-center gap-5 text-sm">
              <NavLink
                to="/trips"
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-blush-600 dark:text-blush-300'
                    : 'text-plum-500 hover:text-plum-700 dark:text-plum-300 dark:hover:text-blush-200'
                }
              >
                Trips
              </NavLink>
              <NavLink
                to="/bucket-list"
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-blush-600 dark:text-blush-300'
                    : 'text-plum-500 hover:text-plum-700 dark:text-plum-300 dark:hover:text-blush-200'
                }
              >
                Bucket List
              </NavLink>
              <button
                onClick={() => signOut()}
                className="text-plum-400 hover:text-plum-700 dark:text-plum-400 dark:hover:text-blush-200"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

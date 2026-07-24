import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/trips" className="text-lg font-semibold">
            🧳 Journal
          </NavLink>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <NavLink
                to="/trips"
                className={({ isActive }) =>
                  isActive ? 'font-medium text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'
                }
              >
                Trips
              </NavLink>
              <NavLink
                to="/bucket-list"
                className={({ isActive }) =>
                  isActive ? 'font-medium text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'
                }
              >
                Bucket List
              </NavLink>
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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

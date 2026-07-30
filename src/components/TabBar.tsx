import { NavLink } from 'react-router-dom'
import { Luggage, NotebookPen, BarChart3, BookOpen } from 'lucide-react'

const tabs = [
  { to: '/trips', icon: Luggage, label: 'Trips' },
  { to: '/bucket-list', icon: NotebookPen, label: 'Bucket List' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/scrapbook', icon: BookOpen, label: 'My Travels' },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blush-100 bg-cream/95 backdrop-blur-sm dark:border-plum-800 dark:bg-plum-950/95">
      <div
        className="mx-auto flex max-w-5xl justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive
                  ? 'text-blush-600 dark:text-blush-300'
                  : 'text-plum-400 hover:text-plum-600 dark:text-plum-500 dark:hover:text-plum-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    isActive ? 'scale-110 bg-blush-100 dark:bg-plum-800' : 'scale-100'
                  }`}
                >
                  <tab.icon size={18} strokeWidth={2} />
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

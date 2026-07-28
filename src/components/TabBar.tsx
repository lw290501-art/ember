import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/trips', icon: '🧳', label: 'Trips' },
  { to: '/bucket-list', icon: '📝', label: 'Bucket List' },
  { to: '/stats', icon: '📊', label: 'Stats' },
  { to: '/scrapbook', icon: '📖', label: 'My Travels' },
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
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition ${
                    isActive ? 'bg-blush-100 dark:bg-plum-800' : ''
                  }`}
                >
                  {tab.icon}
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

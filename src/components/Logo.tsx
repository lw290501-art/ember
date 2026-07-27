export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="journal-logo-badge" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e685a3" />
          <stop offset="1" stopColor="#9e3559" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="20" fill="url(#journal-logo-badge)" />
      <text
        x="32"
        y="45"
        fontFamily="'Playfair Display', Georgia, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill="#fdf6f2"
        textAnchor="middle"
      >
        E
      </text>
      <path
        d="M50 12 L51.3 16.7 L56 18 L51.3 19.3 L50 24 L48.7 19.3 L44 18 L48.7 16.7 Z"
        fill="#d9c9f1"
      />
    </svg>
  )
}

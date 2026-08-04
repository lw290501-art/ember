/** Formats an ISO date (YYYY-MM-DD) as e.g. "4 Aug 2026" instead of the raw string. */
export function formatDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Formats a trip's start/end into a single neat range, e.g. "4 – 10 Aug 2026" or "29 Dec 2026 – 3 Jan 2027". */
export function formatDateRange(startIso: string | null, endIso: string | null): string | null {
  if (!startIso && !endIso) return null
  if (!startIso) return `Until ${formatDate(endIso)}`
  if (!endIso) return `From ${formatDate(startIso)}`

  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${formatDate(startIso)} – ${formatDate(endIso)}`
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    const day = start.getDate()
    const dayEnd = end.getDate()
    const monthYear = end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    return day === dayEnd ? `${day} ${monthYear}` : `${day} – ${dayEnd} ${monthYear}`
  }

  if (sameYear) {
    const startPart = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const endPart = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startPart} – ${endPart}`
  }

  return `${formatDate(startIso)} – ${formatDate(endIso)}`
}

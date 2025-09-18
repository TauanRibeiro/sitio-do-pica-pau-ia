// Lightweight theme manager: light/dark with persistence and system preference
const STORAGE_KEY = 'siteTheme'

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return getSystemTheme()
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getInitialTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

export function onThemeChange(cb) {
  // Respond to system changes only when user hasn't set a preference
  try {
    if (localStorage.getItem(STORAGE_KEY)) return () => {}
  } catch {}
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    applyTheme(mq.matches ? 'dark' : 'light')
    if (typeof cb === 'function') cb(mq.matches ? 'dark' : 'light')
  }
  mq.addEventListener?.('change', handler)
  return () => mq.removeEventListener?.('change', handler)
}

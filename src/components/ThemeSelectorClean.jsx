import React, { useEffect } from 'react'
import { THEMES } from './themeConstants'

function ThemeSelector({ currentTheme, onThemeChange }) {
  useEffect(() => {
    const saved = localStorage.getItem('sitioTheme') || currentTheme || 'sitio'
    if (saved !== currentTheme && typeof onThemeChange === 'function') onThemeChange(saved)
    const theme = THEMES[saved]
    if (theme) {
      const root = document.documentElement
      root.style.setProperty('--theme-primary', theme.primary)
      root.style.setProperty('--theme-secondary', theme.secondary)
      root.style.setProperty('--theme-accent', theme.accent)
      root.style.setProperty('--theme-background', theme.background)
      root.style.setProperty('--theme-text', theme.text)
      root.style.setProperty('--theme-card', theme.card)
      root.style.setProperty('--theme-cardBg', theme.card)
    }
  }, [currentTheme, onThemeChange])

  const applyTheme = (themeKey) => {
    const theme = THEMES[themeKey]
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primary)
    root.style.setProperty('--theme-secondary', theme.secondary)
    root.style.setProperty('--theme-accent', theme.accent)
    root.style.setProperty('--theme-background', theme.background)
    root.style.setProperty('--theme-text', theme.text)
    root.style.setProperty('--theme-card', theme.card)
    root.style.setProperty('--theme-cardBg', theme.card)
    localStorage.setItem('sitioTheme', themeKey)
    if (typeof onThemeChange === 'function') onThemeChange(themeKey)
  }

  return (
    <div className="theme-selector">
      <h3>🎨 Tema</h3>
      <div className="theme-buttons">
        {Object.entries(THEMES).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-button ${currentTheme === key ? 'active' : ''}`}
            onClick={() => applyTheme(key)}
            style={{
              backgroundColor: theme.primary,
              color: theme.text,
              border: currentTheme === key ? `3px solid ${theme.accent}` : '1px solid #ccc'
            }}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ThemeSelector

import React, { useEffect } from 'react'

export const THEMES = {
  sitio: {
    name: 'Sítio Clássico',
    primary: '#FFD700',
    secondary: '#8B4513',
    accent: '#FF4500',
    background: '#FFF8DC',
    text: '#2F4F2F',
    card: '#FFFACD'
  },
  cuca: {
    name: 'Floresta da Cuca',
    primary: '#32CD32',
    secondary: '#8B4513',
    accent: '#FF69B4',
    background: '#F0FFF0',
    text: '#006400',
    card: '#98FB98'
  },
  emilia: {
    name: 'Reino de Emília',
    primary: '#FFB6C1',
    secondary: '#FFD700',
    accent: '#FF1493',
    background: '#FFF0F5',
    text: '#8B008B',
    card: '#FFCCCB'
  }
}

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

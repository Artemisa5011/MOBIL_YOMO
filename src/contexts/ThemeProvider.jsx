import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { darkPalette, lightPalette } from '../theme/colors'
import * as themeStorage from '../data/themeStorage'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('dark')

  useEffect(() => {
    themeStorage.getThemeMode().then(setModeState)
  }, [])

  const setMode = useCallback(async (m) => {
    if (m !== 'light' && m !== 'dark') return
    setModeState(m)
    await themeStorage.setThemeMode(m)
  }, [])

  const toggleTheme = useCallback(async () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setModeState(next)
    await themeStorage.setThemeMode(next)
  }, [mode])

  const colors = mode === 'dark' ? darkPalette : lightPalette
  const isDark = mode === 'dark'

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
      toggleTheme,
    }),
    [mode, isDark, colors, setMode, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return ctx
}

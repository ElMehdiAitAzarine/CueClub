'use client'

import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'dark' | 'light'
export type ThemeSection = 'admin' | 'user' | 'screen'

const STORAGE_KEY_PREFIX = 'cueclub_theme_'

export function useSectionTheme(section: ThemeSection) {
    const [theme, setThemeState] = useState<ThemeMode>('dark')

    useEffect(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${section}`) as ThemeMode | null
        if (stored === 'light' || stored === 'dark') {
            setThemeState(stored)
        }
    }, [section])

    const setTheme = useCallback((mode: ThemeMode) => {
        setThemeState(mode)
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${section}`, mode)
    }, [section])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, setTheme])

    const isDark = theme === 'dark'
    const isLight = theme === 'light'

    return { theme, setTheme, toggleTheme, isDark, isLight }
}

/**
 * Theme utility — maps dark-mode hardcoded colors to light-mode equivalents.
 * Usage: t(isDark, 'dark-class', 'light-class')
 */
export function t(isDark: boolean, dark: string, light: string): string {
    return isDark ? dark : light
}

/** Common bg/text token pairs used across pages */
export const themeTokens = (isDark: boolean) => ({
    // Page backgrounds
    pageBg: isDark ? 'bg-[#050505]' : 'bg-[#F7F5F0]',
    pageBg2: isDark ? 'bg-[#0A0A0A]' : 'bg-[#F7F5F0]',
    pageBgBlack: isDark ? 'bg-black' : 'bg-[#F0EDE6]',

    // Text
    textPrimary: isDark ? 'text-white' : 'text-[#1A1A1A]',
    textSecondary: isDark ? 'text-white/70' : 'text-[#4A4540]',
    textMuted: isDark ? 'text-white/40' : 'text-[#8A857E]',
    textFaint: isDark ? 'text-white/20' : 'text-[#B0AAA0]',
    textInvert: isDark ? 'text-black' : 'text-white',

    // Cards & surfaces
    cardBg: isDark ? 'bg-white/[0.02]' : 'bg-[#EFECE5]',
    cardBg2: isDark ? 'bg-white/5' : 'bg-[#E8E4DC]',
    cardBgHover: isDark ? 'hover:bg-white/[0.07]' : 'hover:bg-[#E5E1D8]',
    surfaceBg: isDark ? 'bg-white/[0.03]' : 'bg-[#EFECE5]/80',

    // Borders
    border: isDark ? 'border-white/10' : 'border-[#D5D0C8]',
    borderLight: isDark ? 'border-white/5' : 'border-[#E0DCD4]',
    borderHover: isDark ? 'hover:border-primary/20' : 'hover:border-primary/40',

    // Input fields
    inputBg: isDark ? 'bg-white/5' : 'bg-white/80',
    inputBorder: isDark ? 'border-white/10' : 'border-[#D5D0C8]',
    inputPlaceholder: isDark ? 'placeholder:text-white/20' : 'placeholder:text-[#B0AAA0]',
    inputText: isDark ? 'text-white' : 'text-[#1A1A1A]',

    // Backdrop / overlay
    backdrop: isDark ? 'bg-black/90' : 'bg-[#F7F5F0]/95',
    backdropBlur: isDark ? 'backdrop-blur-xl' : 'backdrop-blur-xl',
    headerBg: isDark ? 'bg-[#0A0A0A]/80' : 'bg-[#F7F5F0]/90',

    // Scrollbar
    scrollThumb: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    scrollThumbHover: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',

    // Dividers
    divider: isDark ? 'divide-white/5' : 'divide-[#D5D0C8]',

    // Shadows
    shadow: isDark ? 'shadow-2xl' : 'shadow-lg shadow-black/5',

    // Select dropdown options
    optionBg: isDark ? 'bg-[#0A0A0A]' : 'bg-[#EFECE5]',
})

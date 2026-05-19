'use client'

import { Sun, Moon } from 'lucide-react'
import { ThemeMode } from '@/hooks/use-section-theme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
    theme: ThemeMode
    onToggle: () => void
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function ThemeToggle({ theme, onToggle, className, size = 'md' }: ThemeToggleProps) {
    const isDark = theme === 'dark'

    const sizeMap = {
        sm: { button: 'w-12 h-6', knob: 'w-5 h-5', icon: 10, translate: 'translate-x-6' },
        md: { button: 'w-14 h-7', knob: 'w-6 h-6', icon: 12, translate: 'translate-x-7' },
        lg: { button: 'w-16 h-8', knob: 'w-7 h-7', icon: 14, translate: 'translate-x-8' },
    }

    const s = sizeMap[size]

    return (
        <button
            onClick={onToggle}
            className={cn(
                'relative rounded-full transition-all duration-500 ease-in-out flex items-center p-0.5 cursor-pointer group',
                isDark
                    ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                    : 'bg-amber-100 hover:bg-amber-200 border border-amber-200/60',
                s.button,
                className
            )}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Background icons */}
            <Sun
                size={s.icon - 2}
                className={cn(
                    'absolute left-1.5 transition-all duration-500',
                    isDark ? 'text-white/20 scale-75 opacity-50' : 'text-amber-500 scale-100 opacity-100'
                )}
            />
            <Moon
                size={s.icon - 2}
                className={cn(
                    'absolute right-1.5 transition-all duration-500',
                    isDark ? 'text-blue-300 scale-100 opacity-100' : 'text-amber-300 scale-75 opacity-50'
                )}
            />

            {/* Sliding knob */}
            <div
                className={cn(
                    'rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] z-10 flex items-center justify-center',
                    isDark
                        ? 'translate-x-0 bg-slate-700 shadow-blue-500/20'
                        : `${s.translate} bg-white shadow-amber-400/30`,
                    s.knob
                )}
            >
                {isDark ? (
                    <Moon size={s.icon - 4} className="text-blue-200" />
                ) : (
                    <Sun size={s.icon - 4} className="text-amber-500" />
                )}
            </div>
        </button>
    )
}

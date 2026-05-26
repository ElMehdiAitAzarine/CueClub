'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Loader2, Calendar, Clock, AlertCircle, RefreshCw, Gamepad2, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSectionTheme } from '@/hooks/use-section-theme'
import ThemeToggle from '@/components/ThemeToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface GameSession {
    session_id: number;
    table_name: string;
    game_type: string;
    game_type_image: string;
    status: 'waiting' | 'notified' | 'playing' | 'cancelled' | 'completed';
    daily_number: number;
    created_at: string;
    notified_at: string | null;
}

export default function HistoryPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { theme, toggleTheme, isDark } = useSectionTheme('user')
    const [userId, setUserId] = useState<string | null>(null)
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [history, setHistory] = useState<GameSession[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const storedId = localStorage.getItem('cueclub_user_id')
        const storedDeviceId = localStorage.getItem('cueclub_device_id')
        
        if (!storedId || !storedDeviceId) {
            router.push('/login')
            return
        }

        setUserId(storedId)
        setDeviceId(storedDeviceId)
        fetchHistory(storedId, storedDeviceId)
    }, [router])

    const fetchHistory = async (clientId: string, devId: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        setError(null)

        try {
            const res = await fetch(`/api/user-game-history?client_id=${clientId}&device_id=${devId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                setHistory(data)
            } else {
                const errData = await res.json()
                setError(errData.detail || "Failed to load game history")
            }
        } catch (err) {
            setError("Connection failure. Please try again.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
        } catch (e) {
            return dateStr
        }
    }

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        } catch (e) {
            return ''
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                    badge: '🟢',
                    label: t('history.status.completed', 'Completed')
                }
            case 'playing':
                return {
                    bg: 'bg-blue-500/10 text-blue-500 border-blue-500/30 animate-pulse',
                    badge: '🎮',
                    label: t('history.status.playing', 'In Progress')
                }
            case 'notified':
                return {
                    bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                    badge: '🔔',
                    label: t('history.status.notified', 'Ready / Called')
                }
            case 'waiting':
                return {
                    bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
                    badge: '⏳',
                    label: t('history.status.waiting', 'Waiting in Queue')
                }
            case 'cancelled':
            default:
                return {
                    bg: 'bg-red-500/10 text-red-500 border-red-500/30',
                    badge: '❌',
                    label: t('history.status.cancelled', 'Cancelled')
                }
        }
    }

    const getGameIcon = (gameName: string) => {
        const n = gameName.toLowerCase()
        if (n.includes('pool') || n.includes('billiard') || n.includes('snooker')) return '🎱'
        if (n.includes('carrom')) return '🔘'
        if (n.includes('dart')) return '🎯'
        if (n.includes('ps5') || n.includes('playstation') || n.includes('console')) return '🎮'
        return '🕹️'
    }

    if (loading) {
        return (
            <div className={cn("min-h-screen flex flex-col items-center justify-center", isDark ? 'dark bg-[#0A0A0A]' : 'light-mode bg-[#F7F5F0]')}>
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                    {t('history.loading', 'Retrieving Game Log...')}
                </p>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen text-foreground selection:bg-primary/30 pb-20", isDark ? 'dark bg-[#0A0A0A]' : 'light-mode bg-[#F7F5F0]')}>
            {/* Ambient Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-primary/5 blur-[130px] rounded-full" />
                <div className="absolute bottom-[10%] -right-[10%] w-[35%] h-[35%] bg-secondary/5 blur-[130px] rounded-full" />
            </div>

            {/* Header */}
            <header className={cn("sticky top-0 z-50 backdrop-blur-md border-b p-4 flex items-center justify-between gap-4 relative", isDark ? 'bg-[#0A0A0A]/80 border-white/5' : 'bg-[#F7F5F0]/90 border-[#D5D0C8]')}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="rounded-full hover:bg-primary/10 transition-colors">
                        <ChevronLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-wider">
                            {t('history.title', 'My History')}
                        </h1>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">
                            {t('history.subtitle', 'Past Game Sessions')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={refreshing} 
                        onClick={() => userId && deviceId && fetchHistory(userId, deviceId, true)} 
                        className={cn("rounded-full hover:bg-primary/10 transition-colors", refreshing && "animate-spin")}
                    >
                        <RefreshCw size={16} />
                    </Button>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-xl mx-auto p-4 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Stats Summary Widget */}
                <div className={cn("rounded-3xl p-6 border shadow-lg flex justify-between items-center", isDark ? 'bg-white/5 border-white/10' : 'bg-[#EFECE5] border-[#D5D0C8]')}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <Award className="text-primary" size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                                {t('history.totalGames', 'Total Games Played')}
                            </span>
                            <span className="text-3xl font-black italic text-primary leading-none">
                                {history.filter(s => s.status === 'completed').length}
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                            {t('history.rank', 'Arena Rank')}
                        </span>
                        <span className="text-sm font-black uppercase text-foreground">
                            {t('history.rankGold', 'Gold Member')}
                        </span>
                    </div>
                </div>

                {error ? (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl flex items-center gap-3">
                        <AlertCircle size={20} />
                        <div>
                            <p className="font-bold">{t('history.errorTitle', 'Access Rejected')}</p>
                            <p className="opacity-80">{error}</p>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto opacity-40">
                            <Gamepad2 size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black uppercase tracking-wider">
                                {t('history.emptyTitle', 'No Arena Logs')}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                {t('history.emptyText', 'You haven\'t joined any gaming queues yet. Scan the club QR and join the action!')}
                            </p>
                        </div>
                        <Button onClick={() => router.push('/home')} className="bg-primary hover:bg-primary/95 text-black font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl">
                            {t('history.joinNow', 'Enter Arena')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                            {t('history.timeline', 'Session Timeline')}
                        </h2>
                        
                        <div className="space-y-4">
                            {history.map((session) => {
                                const statusInfo = getStatusStyle(session.status);
                                return (
                                    <div 
                                        key={session.session_id} 
                                        className={cn(
                                            "rounded-3xl p-5 border shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md",
                                            isDark 
                                                ? 'bg-white/5 border-white/5 hover:border-white/10' 
                                                : 'bg-white border-[#D5D0C8] hover:border-[#BFB9AD]'
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl border border-primary/10">
                                                    {getGameIcon(session.game_type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base leading-snug">
                                                        {session.table_name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                        <span className="bg-muted px-2 py-0.5 rounded-md">
                                                            {session.game_type}
                                                        </span>
                                                        <span>•</span>
                                                        <span>Q #{session.daily_number}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5", statusInfo.bg)}>
                                                <span>{statusInfo.badge}</span>
                                                <span>{statusInfo.label}</span>
                                            </div>
                                        </div>

                                        <div className={cn("mt-4 pt-3 border-t flex flex-wrap gap-4 justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest", isDark ? 'border-white/5' : 'border-black/5')}>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-primary" />
                                                <span>{formatDate(session.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-primary" />
                                                <span>
                                                    {formatTime(session.created_at)}
                                                    {session.notified_at && ` - ${formatTime(session.notified_at)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

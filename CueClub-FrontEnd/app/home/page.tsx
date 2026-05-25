'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { 
    Loader2, 
    Users, 
    Gamepad2, 
    Utensils, 
    LogOut, 
    ChevronRight, 
    UserCircle, 
    CheckCircle2, 
    Clock, 
    XCircle,
    PlayCircle,
    AlertCircle,
    Coffee,
    User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSectionTheme } from '@/hooks/use-section-theme'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface Player {
    id: number;
    session_id: number;
    name: string;
    daily_number: number;
    status: 'waiting' | 'notified' | 'playing' | 'cancelled' | 'completed';
    timer: number;
}

interface TableStatus {
    id: number;
    name: string;
    number: number;
    location: string;
    game_type: string;
    players: Player[];
}

interface CafeOccupation {
    number: number;
    status: string;
    client_id: string;
    timer: number;
}

export default function HomePage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { theme, toggleTheme, isDark } = useSectionTheme('user')
    const [userName, setUserName] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [tables, setTables] = useState<TableStatus[]>([])
    const [cafeOccupations, setCafeOccupations] = useState<CafeOccupation[]>([])
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState<number | null>(null)
    const [actionLoading, setActionLoading] = useState<number | null>(null)
    
    const [latestOrder, setLatestOrder] = useState<any>(null)
    
    const pollInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const storedId = localStorage.getItem('cueclub_user_id')
        const storedName = localStorage.getItem('cueclub_user_name')
        
        if (!storedId || !storedName) {
            console.log("No session found, redirecting to login");
            router.push('/login')
            return
        }
        
        setUserId(storedId)
        setUserName(storedName)
        fetchStatus()

        pollInterval.current = setInterval(fetchStatus, 5000)
        
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current)
        }
    }, [router])

    const fetchStatus = async () => {
        try {
            const [gameRes, cafeRes] = await Promise.all([
                fetch('/api/game-status'),
                fetch('/api/cafe-tables')
            ])
            
            if (gameRes.ok) setTables(await gameRes.json())
            if (cafeRes.ok) setCafeOccupations(await cafeRes.json())
            if (userId) {
                const orderRes = await fetch(`/api/user-orders?client_id=${userId}`)
                if (orderRes.ok) {
                    const orders = await orderRes.json()
                    if (orders.length > 0) setLatestOrder(orders[0])
                }
            }
                
        } catch (err) {
            console.error("Failed to fetch status", err)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinTable = async (tableId: number) => {
        if (!userId) return
        setJoining(tableId)
        try {
            const res = await fetch('/api/join-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: userId, table_id: tableId })
            })
            if (res.ok) {
                fetchStatus()
            } else {
                const data = await res.json()
                alert(data.detail || "Failed to join")
            }
        } catch (err) {
            alert("Connection error")
        } finally {
            setJoining(null)
        }
    }

    const handleConfirmOccupation = async (num: number) => {
        try {
            const res = await fetch('/api/confirm-occupation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: userId, table_number: num })
            })
            if (res.ok) fetchStatus()
        } catch (err) {
            alert("Failed to confirm")
        }
    }

    const handleCancelSession = async (sessionId: number) => {
        if (!userId) return
        setActionLoading(sessionId)
        try {
            const res = await fetch('/api/cancel-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: userId, session_id: sessionId })
            })
            if (res.ok) fetchStatus()
        } finally {
            setActionLoading(null)
        }
    }

    const handleConfirmPlay = async (sessionId: number) => {
        if (!userId) return
        setActionLoading(sessionId)
        try {
            const res = await fetch('/api/confirm-play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: userId, session_id: sessionId })
            })
            if (res.ok) fetchStatus()
        } finally {
            setActionLoading(null)
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        router.push('/')
    }

    const userNotification = tables.flatMap(t => t.players)
        .find(p => p.id === parseInt(userId!) && p.status === 'notified');

    const myCafeTable = cafeOccupations.find(o => o.client_id == userId && o.status === 'occupied');
    const myGameTable = tables.find(t => t.players.some(p => p.id === parseInt(userId!)));
    
    // Show confirmation if more than 45 mins passed (2700 seconds)
    const showCafeConfirm = myCafeTable && myCafeTable.timer > 2700;

    if (loading) {
        return (
            <div className={cn("min-h-screen flex flex-col items-center justify-center", isDark ? 'dark bg-background' : 'light-mode bg-[#F7F5F0]')}>
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen text-foreground selection:bg-primary/30 pb-20", isDark ? 'dark bg-[#0A0A0A]' : 'light-mode bg-[#F7F5F0]')}>
            <header className={cn("sticky top-0 z-50 backdrop-blur-md border-b p-4 flex justify-between items-center", isDark ? 'bg-[#0A0A0A]/80 border-white/5' : 'bg-[#F7F5F0]/90 border-[#D5D0C8]')}>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground mr-2 hidden sm:block">{userName}</span>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} className={cn("rounded-full transition-colors", isDark ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-[#1A1A1A]")}>
                        <User size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:text-destructive transition-colors text-muted-foreground">
                        <LogOut size={18} />
                    </Button>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                    <LanguageToggle />
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6">
                
                {/* Game Turn Notification */}
                {userNotification && (
                    <section className="animate-in slide-in-from-top duration-500">
                        <div className="bg-primary p-6 rounded-[2rem] text-black shadow-xl">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <PlayCircle size={32} className="animate-pulse" />
                                    <div>
                                        <h2 className="text-xl font-black uppercase">{t('userHome.yourTableReady', 'Your Table is Ready!')}</h2>
                                        <p className="text-black/70 text-[10px] font-bold uppercase">{userNotification.timer}s remaining</p>
                                    </div>
                                </div>
                                <Button onClick={() => handleConfirmPlay(userNotification.session_id)} className="bg-black text-white h-12 px-8 rounded-xl font-black uppercase text-xs">{t('userHome.confirmNow', 'Confirm Now')}</Button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Cafe Table Confirmation */}
                {showCafeConfirm && (
                    <section className="animate-in slide-in-from-top duration-500">
                        <div className="bg-amber-500 p-6 rounded-[2rem] text-black shadow-xl">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <Coffee size={32} />
                                    <div>
                                        <h2 className="text-xl font-black uppercase">{t('userHome.stillAtTable', 'Still at Table')} {myCafeTable.number}?</h2>
                                        <p className="text-black/70 text-[10px] font-bold uppercase tracking-widest">{t('userHome.yesStillHere', 'Please confirm your stay to keep the table')}</p>
                                    </div>
                                </div>
                                <Button onClick={() => handleConfirmOccupation(myCafeTable.number)} className="bg-black text-white h-12 px-8 rounded-xl font-black uppercase text-xs">{t('userHome.yesStillHere', 'Yes, Still Here')}</Button>
                            </div>
                        </div>
                    </section>
                )}

                <section className="flex flex-col gap-4">
                    <Button onClick={() => router.push('/menu')} className="h-24 rounded-3xl bg-secondary/10 border border-secondary/20 flex flex-col gap-2">
                        <Utensils size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('userHome.menu', 'Command Menu')}</span>
                    </Button>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-2">{t('userHome.livingArena', 'Living Arena Status')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tables.map(table => (
                            <Card key={table.id} className={cn("rounded-[2rem] overflow-hidden", isDark ? 'bg-white/5 border-white/10' : 'bg-[#EFECE5] border-[#D5D0C8]')}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-black italic">{table.name}</CardTitle>
                                            <CardDescription className={cn("text-[10px] uppercase font-black tracking-[0.2em]", isDark ? "text-white/40" : "text-[#4A4540]/60")}>{t('userHome.table', 'Table')} #{table.number}</CardDescription>
                                        </div>
                                        <div className="bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
                                            <span className="text-[9px] font-black uppercase text-primary tracking-widest">{table.game_type}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 min-h-[120px]">
                                        {table.players.map((player, idx) => (
                                            <div key={player.session_id} className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border",
                                                player.status === 'notified' ? "bg-primary/10 border-primary/30" : 
                                                player.status === 'playing' ? "bg-blue-500/10 border-blue-500/30" : 
                                                (player.status === 'completed' || player.status === 'cancelled') ? (isDark ? "bg-white/[0.01] border-white/5 opacity-40" : "bg-black/[0.01] border-black/[0.05] opacity-40") : 
                                                isDark ? "bg-white/[0.03] border-white/5" : "bg-[#E8E4DC]/60 border-[#D5D0C8]"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black">{player.status === 'playing' ? '🎮' : idx + 1}</span>
                                                    <span className="text-sm font-semibold">{player.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {player.id === parseInt(userId!) && player.status === 'notified' && (
                                                        <Button 
                                                            onClick={() => handleConfirmPlay(player.session_id)}
                                                            size="sm"
                                                            className="h-7 text-[8px] bg-blue-600 hover:bg-blue-500 font-black px-2 rounded-lg"
                                                        >
                                                            {t('userHome.ready', 'READY')}
                                                        </Button>
                                                    )}
                                                    {player.id === parseInt(userId!) && player.status === 'playing' && (
                                                        <Button 
                                                            onClick={() => handleCancelSession(player.session_id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[8px] border-red-500/50 text-red-500 hover:bg-red-500/10 font-black px-2 rounded-lg"
                                                        >
                                                            {t('userHome.finish', 'FINISH')}
                                                        </Button>
                                                    )}
                                                    {player.id === parseInt(userId!) && (
                                                        <button onClick={() => handleCancelSession(player.session_id)} className="text-muted-foreground hover:text-red-500"><XCircle size={16}/></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        onClick={() => handleJoinTable(table.id)}
                                        disabled={joining === table.id || table.players.some(p => p.id === parseInt(userId!))}
                                        className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary text-black"
                                    >
                                        {t('userHome.joinLine', 'JOIN LINE')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

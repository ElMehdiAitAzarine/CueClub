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
    User,
    History,
    Swords,
    Check,
    X
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

    const [selectedGameFilter, setSelectedGameFilter] = useState<string>('All')
    const gameCategories = ['All', ...Array.from(new Set(tables.map(t => t.game_type).filter(Boolean)))]
    const filteredTables = tables.filter(t => selectedGameFilter === 'All' || t.game_type === selectedGameFilter)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const [activeTableIndex, setActiveTableIndex] = useState(0)

    useEffect(() => {
        setActiveTableIndex(0)
        if (containerRef.current) {
            containerRef.current.scrollLeft = 0
        }
    }, [selectedGameFilter])

    const handleScroll = () => {
        if (!containerRef.current) return
        const container = containerRef.current
        const scrollLeft = container.scrollLeft
        const containerWidth = container.clientWidth
        
        const children = Array.from(container.children) as HTMLElement[]
        if (children.length === 0) return
        
        let closestIndex = 0
        let minDistance = Infinity
        const containerCenter = scrollLeft + containerWidth / 2
        
        children.forEach((child, idx) => {
            const childCenter = child.offsetLeft + child.offsetWidth / 2
            const distance = Math.abs(containerCenter - childCenter)
            if (distance < minDistance) {
                minDistance = distance
                closestIndex = idx
            }
        })
        
        setActiveTableIndex(closestIndex)
    }

    const [latestOrder, setLatestOrder] = useState<any>(null)
    
    // Multiplayer Challenge States
    const [connectedPlayers, setConnectedPlayers] = useState<{ idle: any[], finishing: any[] }>({ idle: [], finishing: [] })
    const [activeRequest, setActiveRequest] = useState<any | null>(null)
    const [sendingInviteTo, setSendingInviteTo] = useState<number | null>(null)
    const [selectedTableForInvite, setSelectedTableForInvite] = useState<{ [receiverId: number]: number }>({})
    const [timeLeft, setTimeLeft] = useState(10)

    const pollInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const storedId = localStorage.getItem('cueclub_user_id')
        const storedName = localStorage.getItem('cueclub_user_name')
        
        if (!storedId || !storedName) {
            console.log("No session found, redirecting to login");
            router.push('/login')
            return
        }

        // Check if user session has expired
        const loginTimestamp = localStorage.getItem('cueclub_user_login_timestamp')
        const sessionDuration = parseFloat(localStorage.getItem('cueclub_user_session_duration') || '24')
        
        if (loginTimestamp) {
            const loginTime = new Date(loginTimestamp).getTime()
            const elapsedHours = (Date.now() - loginTime) / (1000 * 60 * 60)
            
            if (elapsedHours > sessionDuration) {
                // Session expired — clear and redirect to login
                localStorage.removeItem('cueclub_user_id')
                localStorage.removeItem('cueclub_user_name')
                localStorage.removeItem('cueclub_logged_in')
                localStorage.removeItem('cueclub_user_login_timestamp')
                localStorage.removeItem('cueclub_user_session_duration')
                alert('Your session has expired. Please log in again.')
                router.push('/login')
                return
            }
        }
        
        setUserId(storedId)
        setUserName(storedName)
        fetchStatus(storedId)

        pollInterval.current = setInterval(() => fetchStatus(storedId), 5000)

        // Check session validity every 60 seconds
        const sessionCheckInterval = setInterval(() => {
            const ts = localStorage.getItem('cueclub_user_login_timestamp')
            const dur = parseFloat(localStorage.getItem('cueclub_user_session_duration') || '24')
            if (ts) {
                const elapsed = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60)
                if (elapsed > dur) {
                    localStorage.removeItem('cueclub_user_id')
                    localStorage.removeItem('cueclub_user_name')
                    localStorage.removeItem('cueclub_logged_in')
                    localStorage.removeItem('cueclub_user_login_timestamp')
                    localStorage.removeItem('cueclub_user_session_duration')
                    alert('Your session has expired. Please log in again.')
                    router.push('/login')
                }
            }
        }, 60000)
        
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current)
            clearInterval(sessionCheckInterval)
        }
    }, [router])

    useEffect(() => {
        if (!activeRequest) return
        setTimeLeft(activeRequest.time_left ?? 10)
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleRespondRequest(activeRequest.id, 'refused')
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        
        return () => clearInterval(timer)
    }, [activeRequest])

    const fetchStatus = async (clientId?: string) => {
        const id = clientId || userId
        if (!id) return
        try {
            const [gameRes, cafeRes, playersRes, requestsRes] = await Promise.all([
                fetch(`/api/game-status?client_id=${id}`),
                fetch('/api/cafe-tables'),
                fetch(`/api/connected-players?client_id=${id}`),
                fetch(`/api/poll-play-requests?client_id=${id}`)
            ])
            
            if (gameRes.ok) setTables(await gameRes.json())
            if (cafeRes.ok) setCafeOccupations(await cafeRes.json())
            if (playersRes.ok) setConnectedPlayers(await playersRes.json())
            if (requestsRes.ok) {
                const reqs = await requestsRes.json()
                if (reqs.length > 0) {
                    // Only pop up if it's a new request id or we don't have one active
                    setActiveRequest((prev: any) => {
                        if (!prev || prev.id !== reqs[0].id) {
                            return reqs[0]
                        }
                        return prev
                    })
                } else {
                    setActiveRequest(null)
                }
            }
            
            const orderRes = await fetch(`/api/user-orders?client_id=${id}`)
            if (orderRes.ok) {
                const orders = await orderRes.json()
                if (orders.length > 0) setLatestOrder(orders[0])
            }
        } catch (err) {
            console.error("Failed to fetch status", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSendInvite = async (receiverId: number) => {
        if (!userId) return
        const tableId = selectedTableForInvite[receiverId]
        if (!tableId) {
            alert("Please select a billiard table first!")
            return
        }
        
        setSendingInviteTo(receiverId)
        try {
            const res = await fetch('/api/send-play-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: userId,
                    receiver_id: receiverId,
                    table_id: tableId
                })
            })
            const data = await res.json()
            if (res.ok) {
                alert("Invite sent successfully! They have 10 seconds to accept.")
            } else {
                alert(data.detail || "Unable to send invite")
            }
        } catch (err) {
            alert("Network error")
        } finally {
            setSendingInviteTo(null)
        }
    }

    const handleRespondRequest = async (requestId: number, response: 'accepted' | 'refused') => {
        try {
            const res = await fetch('/api/respond-play-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    response: response
                })
            })
            if (res.ok) {
                setActiveRequest(null)
                fetchStatus()
            } else {
                const data = await res.json()
                alert(data.detail || "Failed to process request")
                setActiveRequest(null)
            }
        } catch (err) {
            console.error("Respond request failed:", err)
            setActiveRequest(null)
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
                    <div className="w-8 h-8 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] rounded-lg flex items-center justify-center shadow-lg rotate-3">
                        <span className="text-white font-black text-sm">C</span>
                    </div>
                    <span className="text-sm font-bold tracking-wider hidden xs:block">Cue-Club</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground mr-2 hidden sm:block">{userName}</span>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/history')} className={cn("rounded-full transition-colors", isDark ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-[#1A1A1A]")} title={t('userHome.history', 'Game History')}>
                        <History size={18} />
                    </Button>
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

                {/* Arena Lobby: Connected Players */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
                            {t('userHome.arenaLobby', 'Arena Lobby')}
                        </h3>
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {connectedPlayers.idle.length + connectedPlayers.finishing.length} online
                        </span>
                    </div>

                    <Card className={cn("rounded-[2rem] overflow-hidden p-6", isDark ? 'bg-white/5 border-white/10' : 'bg-[#EFECE5] border-[#D5D0C8]')}>
                        {connectedPlayers.idle.length === 0 && connectedPlayers.finishing.length === 0 ? (
                            <div className="text-center py-6 text-xs text-muted-foreground uppercase tracking-widest">
                                {t('userHome.lobbyEmpty', 'No other active players in the lobby')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Idle Players */}
                                {connectedPlayers.idle.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Available to Duel</h4>
                                        {connectedPlayers.idle.map(player => (
                                            <div key={player.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border gap-2", isDark ? "bg-white/[0.03] border-white/5" : "bg-[#E8E4DC]/60 border-[#D5D0C8]")}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px]">🟢</span>
                                                    <span className="text-xs font-semibold">{player.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    <select 
                                                        value={selectedTableForInvite[player.id] || ''} 
                                                        onChange={(e) => setSelectedTableForInvite(prev => ({ ...prev, [player.id]: parseInt(e.target.value) }))}
                                                        className={cn("text-[10px] font-bold p-1 rounded-lg border", isDark ? "bg-[#0E0E0E] border-white/10 text-white" : "bg-white border-[#D5D0C8] text-[#1A1A1A]")}
                                                    >
                                                        <option value="">Choose Table</option>
                                                        {tables.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button 
                                                        onClick={() => handleSendInvite(player.id)}
                                                        disabled={sendingInviteTo === player.id}
                                                        size="sm"
                                                        className="h-7 text-[8px] bg-primary text-black font-black px-2 rounded-lg"
                                                    >
                                                        {sendingInviteTo === player.id ? <Loader2 size={12} className="animate-spin" /> : <><Swords size={12} className="mr-1" /> CHALLENGE</>}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Finishing Round Players */}
                                {connectedPlayers.finishing.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Finishing Current Round</h4>
                                        {connectedPlayers.finishing.map(player => (
                                            <div key={player.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border gap-2", isDark ? "bg-white/[0.03] border-white/5" : "bg-[#E8E4DC]/60 border-[#D5D0C8]")}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px]">🟡</span>
                                                    <span className="text-xs font-semibold">{player.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    <select 
                                                        value={selectedTableForInvite[player.id] || ''} 
                                                        onChange={(e) => setSelectedTableForInvite(prev => ({ ...prev, [player.id]: parseInt(e.target.value) }))}
                                                        className={cn("text-[10px] font-bold p-1 rounded-lg border", isDark ? "bg-[#0E0E0E] border-white/10 text-white" : "bg-white border-[#D5D0C8] text-[#1A1A1A]")}
                                                    >
                                                        <option value="">Choose Table</option>
                                                        {tables.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button 
                                                        onClick={() => handleSendInvite(player.id)}
                                                        disabled={sendingInviteTo === player.id}
                                                        size="sm"
                                                        className="h-7 text-[8px] bg-amber-500 text-black hover:bg-amber-400 font-black px-2 rounded-lg"
                                                    >
                                                        {sendingInviteTo === player.id ? <Loader2 size={12} className="animate-spin" /> : <><Swords size={12} className="mr-1" /> QUEUE DUEL</>}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-2">{t('userHome.livingArena', 'Living Arena Status')}</h3>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar -mx-2 px-2 scrollbar-none">
                        {gameCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedGameFilter(cat)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0 border",
                                    selectedGameFilter === cat
                                        ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105"
                                        : isDark
                                            ? "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                            : "bg-[#EFECE5] border-[#D5D0C8] text-[#4A4540] hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        {/* Left chevron button */}
                        {filteredTables.length > 1 && (
                            <button
                                onClick={() => {
                                    if (containerRef.current) {
                                        const prevIndex = Math.max(0, activeTableIndex - 1);
                                        const child = containerRef.current.children[prevIndex] as HTMLElement;
                                        if (child) {
                                            child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                            setActiveTableIndex(prevIndex);
                                        }
                                    }
                                }}
                                className={cn(
                                    "absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer",
                                    isDark ? "bg-[#0A0A0A]/80 border-white/10 hover:bg-white/10 text-white" : "bg-[#F7F5F0]/80 border-[#D5D0C8] hover:bg-[#E8E4DC] text-[#1A1A1A]"
                                )}
                            >
                                <ChevronRight className="rotate-180" size={20} />
                            </button>
                        )}

                        {/* Slider / Carousel Container */}
                        {filteredTables.length === 0 ? (
                            <div className={cn("text-center py-12 text-xs font-black uppercase tracking-widest border rounded-[2rem] mx-2", isDark ? "bg-white/[0.02] border-white/5 text-white/40" : "bg-[#EFECE5] border-[#D5D0C8] text-[#4A4540]/60")}>
                                No tables active in this category
                            </div>
                        ) : (
                            <div
                                ref={containerRef}
                                onScroll={handleScroll}
                                className="flex items-center gap-6 overflow-x-auto snap-x snap-mandatory py-8 px-[12%] xs:px-[15%] sm:px-[25%] md:px-[30%] scrollbar-none"
                            >
                                {filteredTables.map((table, idx) => {
                                    const isActive = idx === activeTableIndex;
                                    return (
                                        <div
                                            key={table.id}
                                            className={cn(
                                                "snap-center shrink-0 w-[280px] xs:w-[310px] sm:w-[350px] md:w-[370px] transition-all duration-500 ease-out origin-center",
                                                isActive
                                                    ? "scale-105 opacity-100 shadow-2xl"
                                                    : "scale-90 opacity-40"
                                            )}
                                        >
                                            <Card className={cn("rounded-[2rem] overflow-hidden", isDark ? 'bg-white/5 border-white/10' : 'bg-[#EFECE5] border-[#D5D0C8]')}>
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
                                                        {table.players.map((player, pIdx) => (
                                                            <div key={player.session_id} className={cn(
                                                                "flex items-center justify-between p-3 rounded-2xl border",
                                                                player.status === 'notified' ? "bg-primary/10 border-primary/30" : 
                                                                player.status === 'playing' ? "bg-blue-500/10 border-blue-500/30" : 
                                                                (player.status === 'completed' || player.status === 'cancelled') ? (isDark ? "bg-white/[0.01] border-white/5 opacity-40" : "bg-black/[0.01] border-black/[0.05] opacity-40") : 
                                                                isDark ? "bg-white/[0.03] border-white/5" : "bg-[#E8E4DC]/60 border-[#D5D0C8]"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-black">{player.status === 'playing' ? '🎮' : pIdx + 1}</span>
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
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Right chevron button */}
                        {filteredTables.length > 1 && (
                            <button
                                onClick={() => {
                                    if (containerRef.current) {
                                        const nextIndex = Math.min(filteredTables.length - 1, activeTableIndex + 1);
                                        const child = containerRef.current.children[nextIndex] as HTMLElement;
                                        if (child) {
                                            child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                            setActiveTableIndex(nextIndex);
                                        }
                                    }
                                }}
                                className={cn(
                                    "absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer",
                                    isDark ? "bg-[#0A0A0A]/80 border-white/10 hover:bg-white/10 text-white" : "bg-[#F7F5F0]/80 border-[#D5D0C8] hover:bg-[#E8E4DC] text-[#1A1A1A]"
                                )}
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Dots Indicator */}
                    {filteredTables.length > 1 && (
                        <div className="flex justify-center gap-2 pt-2">
                            {filteredTables.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (containerRef.current) {
                                            const child = containerRef.current.children[idx] as HTMLElement;
                                            if (child) {
                                                child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                                setActiveTableIndex(idx);
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                                        idx === activeTableIndex
                                            ? "bg-primary w-6"
                                            : isDark
                                                ? "bg-white/20 hover:bg-white/40"
                                                : "bg-black/20 hover:bg-black/40"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* 10-Second Play Request Overlay */}
            {activeRequest && (
                <div className="fixed inset-0 z-[100] backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
                    <div className={cn("w-full max-w-sm rounded-[2rem] p-6 border shadow-2xl animate-in zoom-in-95 duration-200", isDark ? 'bg-[#0E0E0E] border-white/10 text-white' : 'bg-white border-[#D5D0C8] text-[#1A1A1A]')}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <Swords className="text-primary animate-bounce" size={28} />
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider">
                                    {t('userHome.incomingChallenge', 'Duel Challenge!')}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-bold text-foreground">{activeRequest.sender_name}</span> wants to play with you on <span className="font-bold text-foreground">{activeRequest.table_name}</span>!
                                </p>
                            </div>

                            {/* Countdown bar */}
                            <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden relative">
                                <div 
                                    className="bg-primary h-full transition-all duration-1000 ease-linear" 
                                    style={{ width: `${(timeLeft / 10) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                                {timeLeft}s remaining
                            </span>

                            <div className="flex w-full gap-3 pt-2">
                                <Button 
                                    onClick={() => handleRespondRequest(activeRequest.id, 'refused')}
                                    variant="outline" 
                                    className="flex-1 h-11 rounded-xl font-bold border-red-500/30 text-red-500 hover:bg-red-500/10"
                                >
                                    <X size={16} className="mr-1" /> Decline
                                </Button>
                                <Button 
                                    onClick={() => handleRespondRequest(activeRequest.id, 'accepted')}
                                    className="flex-1 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    <Check size={16} className="mr-1" /> Accept
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

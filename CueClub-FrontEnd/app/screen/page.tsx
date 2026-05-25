'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Gamepad2, PlayCircle, Clock, QrCode, Filter, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSectionTheme } from '@/hooks/use-section-theme'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

interface Order {
    name: string;
    status: string;
    waiter?: string;
}

interface Player {
    id: number;
    session_id: number;
    name: string;
    daily_number: number;
    status: 'waiting' | 'notified' | 'playing' | 'cancelled' | 'completed';
    timer: number;
    games_played_today: number;
    recent_orders: Order[];
}

interface TableStatus {
    id: number;
    name: string;
    number: number;
    game_type: string;
    game_image?: string;
    players: Player[];
}

export default function ScreenPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { theme, toggleTheme, isDark } = useSectionTheme('screen')
    const [tables, setTables] = useState<TableStatus[]>([])
    const [qrToken, setQrToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>(['all'])
    const [displayCount, setDisplayCount] = useState<number>(4)
    const [currentPage, setCurrentPage] = useState(0)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loginForm, setLoginForm] = useState({ username: '', password: '' })
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const pollInterval = useRef<NodeJS.Timeout | null>(null)

    const displayedTables = tables.filter(table => selectedTableIds.includes('all') || selectedTableIds.includes(table.id.toString()));

    const updateSelectedTables = (ids: string[]) => {
        setSelectedTableIds(ids);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (ids.includes('all')) {
                params.delete('tables');
            } else {
                params.set('tables', ids.join(','));
            }
            window.history.replaceState(null, '', `?${params.toString()}`);
        }
    }

    const checkSessionValidity = () => {
        const loginTimestamp = localStorage.getItem('cueclub_screen_login_timestamp')
        const sessionDuration = parseFloat(localStorage.getItem('cueclub_screen_session_duration') || '12')
        
        if (!loginTimestamp) {
            handleLogout()
            return false
        }
        
        const loginTime = new Date(loginTimestamp).getTime()
        const now = Date.now()
        const elapsedHours = (now - loginTime) / (1000 * 60 * 60)
        
        if (elapsedHours > sessionDuration) {
            handleLogout()
            return false
        }
        
        return true
    }

    const handleLogout = () => {
        localStorage.removeItem('cueclub_admin_token')
        localStorage.removeItem('cueclub_admin_level')
        localStorage.removeItem('cueclub_screen_login_timestamp')
        localStorage.removeItem('cueclub_screen_session_duration')
        setIsLoggedIn(false)
        setLoading(false)
        if (pollInterval.current) clearInterval(pollInterval.current)
    }

    useEffect(() => {
        const token = localStorage.getItem('cueclub_admin_token')
        if (token) {
            if (!checkSessionValidity()) return;
            
            setIsLoggedIn(true)
            fetchData()
            pollInterval.current = setInterval(() => {
                if (checkSessionValidity()) {
                    fetchData()
                }
            }, 5000)
        } else {
            setIsLoggedIn(false)
            setLoading(false)
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tablesParam = params.get('tables');
            if (tablesParam) {
                setSelectedTableIds(tablesParam.split(','));
            }
        }
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('cueclub_admin_token')
            const [gameRes, qrRes] = await Promise.all([
                fetch('/api/game-status'),
                fetch('/api/daily-qr')
            ])

            if (gameRes.ok) setTables(await gameRes.json())
            if (qrRes.ok) {
                const qrData = await qrRes.json()
                setQrToken(qrData.token)
            }
        } catch (err) {
            console.error("Failed to fetch screen data", err)
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoggingIn(true)
        try {
            const res = await fetch('/api/sys-admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...loginForm, login_type: 'screen' })
            })
            if (res.ok) {
                const data = await res.json()
                localStorage.setItem('cueclub_admin_token', data.token)
                localStorage.setItem('cueclub_admin_level', data.admin_level)
                localStorage.setItem('cueclub_screen_login_timestamp', data.login_timestamp)
                localStorage.setItem('cueclub_screen_session_duration', String(data.session_duration_hours))
                setIsLoggedIn(true)
                fetchData()
                pollInterval.current = setInterval(() => {
                    if (checkSessionValidity()) {
                        fetchData()
                    }
                }, 5000)
            } else {
                alert("Invalid Admin Credentials")
            }
        } catch (err) {
            alert("Connection error")
        } finally {
            setIsLoggingIn(false)
        }
    }

    if (loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? 'dark bg-black' : 'light-mode bg-[#F0EDE6]')}>
                <Loader2 className="animate-spin text-primary" size={64} />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-4", isDark ? 'dark bg-black' : 'light-mode bg-[#F0EDE6]')}>
                <Card className={cn("w-full max-w-md backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl", isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white/70 border-[#D5D0C8]')}>
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                            <Gamepad2 size={40} />
                        </div>
                        <h2 className={cn("text-3xl font-black uppercase tracking-tighter italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Terminal Access</h2>
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mt-2 italic opacity-60">Establish Connection to Mainframe</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            placeholder="Admin Node Identifier"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            className={cn("w-full h-14 rounded-2xl px-6 font-black uppercase tracking-widest text-xs focus:border-primary/50 transition-all outline-none", isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-[#EFECE5] border-[#D5D0C8] text-[#1A1A1A] placeholder:text-[#B0AAA0]')}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Access Authorization Key"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className={cn("w-full h-14 rounded-2xl px-6 font-black uppercase tracking-widest text-xs focus:border-primary/50 transition-all outline-none", isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-[#EFECE5] border-[#D5D0C8] text-[#1A1A1A] placeholder:text-[#B0AAA0]')}
                            required
                        />
                        <Button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full h-14 bg-primary text-black font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Initialize Feed'}
                        </Button>
                    </form>
                </Card>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen p-12 overflow-hidden flex flex-col h-screen", isDark ? 'dark bg-[#050505] text-white' : 'light-mode bg-[#F7F5F0] text-[#1A1A1A]')}>
            {/* Header */}
            <div className="flex justify-between items-end mb-16 shrink-0">
                <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30">
                        <span className="text-white font-black text-6xl">C</span>
                    </div>
                    <div>
                        <h1 className="text-7xl font-black uppercase tracking-tighter leading-none mb-2">Cue Club</h1>
                        <p className="text-primary font-bold tracking-[0.5em] text-xl uppercase">Live Tournament Dashboard</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-4 mb-4 justify-end">
                        <LanguageToggle />
                        <ThemeToggle theme={theme} onToggle={toggleTheme} size="md" />
                    </div>
                    <p className="text-7xl font-mono font-black tabular-nums leading-none mb-2">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xl text-muted-foreground uppercase font-black tracking-[0.4em]">Local Clubhouse Time</p>
                </div>
            </div>

            <div className="flex-1 flex gap-8 min-h-0">
                {/* Left Section: QR Code */}
                <div className={cn("w-[38%] flex flex-col items-center justify-center border rounded-[4rem] p-16 relative overflow-hidden", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/60 border-[#D5D0C8]')}>
                    <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40" />

                    <div className="relative z-10 text-center space-y-12 w-full">
                        <div className="relative p-12 inline-block mx-auto group">
                            {/* Camera Scan Corners */}
                            <div className={cn("absolute top-0 left-0 w-24 h-24 border-t-[12px] border-l-[12px] rounded-tl-[3rem] transition-all duration-500 group-hover:scale-110", isDark ? 'border-white' : 'border-[#1A1A1A]')} />
                            <div className={cn("absolute top-0 right-0 w-24 h-24 border-t-[12px] border-r-[12px] rounded-tr-[3rem] transition-all duration-500 group-hover:scale-110", isDark ? 'border-white' : 'border-[#1A1A1A]')} />
                            <div className={cn("absolute bottom-0 left-0 w-24 h-24 border-b-[12px] border-l-[12px] rounded-bl-[3rem] transition-all duration-500 group-hover:scale-110", isDark ? 'border-white' : 'border-[#1A1A1A]')} />
                            <div className={cn("absolute bottom-0 right-0 w-24 h-24 border-b-[12px] border-r-[12px] rounded-br-[3rem] transition-all duration-500 group-hover:scale-110", isDark ? 'border-white' : 'border-[#1A1A1A]')} />

                            {/* Scanning Line Animation */}
                            <div className="absolute inset-x-12 top-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_3s_ease-in-out_infinite] z-20 shadow-[0_0_15px_rgba(234,88,12,0.8)]" />

                            <div className="bg-white p-4 rounded-[3rem] shadow-[0_0_150px_rgba(255,255,255,0.15)] relative z-10">
                                {qrToken ? (
                                    <img
                                        src={`/uploads/qrcodes/daily_qr_${new Date().toISOString().split('T')[0]}.png`}
                                        alt="Daily QR"
                                        className="w-[500px] h-[500px] rounded-2xl object-contain"
                                    />
                                ) : (
                                    <div className="w-[500px] h-[500px] flex items-center justify-center bg-neutral-100 rounded-2xl">
                                        <Loader2 className="animate-spin text-neutral-300" size={80} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-6xl font-black uppercase tracking-tight">{t('screen.scanToJoin', 'Scan to Join')}</h2>

                            <div className="flex justify-center gap-8 pt-8">
                                <div className={cn("flex items-center gap-4 px-8 py-4 rounded-full border", isDark ? 'bg-white/5 border-white/10' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                    <QrCode size={32} className="text-primary" />
                                    <span className="text-lg font-bold uppercase tracking-widest">Instant Sync</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Line Infos */}
                <div className="flex-1 flex flex-col min-h-0 ml-10">
                    <div className="flex items-center justify-between mb-10 px-6">
                        <h3 className="text-4xl font-black uppercase tracking-widest flex items-center gap-6">
                            <Gamepad2 size={48} className="text-primary" />
                            Live Queue Status
                        </h3>
                        <div className="flex items-center gap-10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className={cn("h-14 rounded-2xl text-xl font-bold uppercase tracking-wider focus:ring-primary/50 flex items-center gap-4 px-8 border-none shadow-2xl", isDark ? 'bg-white/5' : 'bg-[#E8E4DC] text-[#1A1A1A]')}>
                                        <Filter size={24} className="text-primary" />
                                        <span>
                                            {selectedTableIds.includes('all')
                                                ? `Grid View: ${displayCount} Tables`
                                                : `Selected: ${selectedTableIds.length} Tables`
                                            }
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={cn("w-[320px] rounded-[2rem] p-4", isDark ? 'bg-[#0A0A0A] border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-[#EFECE5] border-[#D5D0C8] text-[#1A1A1A] shadow-xl')}>
                                    <div className="space-y-6">

                                        <div>
                                            <DropdownMenuLabel className="text-primary font-black uppercase text-sm tracking-[0.2em] px-2 mb-2 flex items-center gap-3">
                                                <Users size={16} />
                                                Filter Tables
                                            </DropdownMenuLabel>
                                            <div className="space-y-1">
                                                <DropdownMenuCheckboxItem
                                                    checked={selectedTableIds.includes('all')}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) updateSelectedTables(['all']);
                                                        setCurrentPage(0);
                                                    }}
                                                    className="text-lg font-bold uppercase tracking-wide focus:bg-primary/20 cursor-pointer rounded-xl py-3"
                                                >
                                                    Show All Tables
                                                </DropdownMenuCheckboxItem>
                                                {tables.map(table => (
                                                    <DropdownMenuCheckboxItem
                                                        key={table.id}
                                                        checked={selectedTableIds.includes(table.id.toString())}
                                                        onCheckedChange={(checked) => {
                                                            let next = selectedTableIds.filter(id => id !== 'all');
                                                            if (checked) next.push(table.id.toString());
                                                            else next = next.filter(id => id !== table.id.toString());

                                                            if (next.length === 0) next = ['all'];
                                                            updateSelectedTables(next);
                                                            setCurrentPage(0);
                                                        }}
                                                        className="text-lg font-bold uppercase tracking-wide focus:bg-primary/20 cursor-pointer rounded-xl py-3"
                                                    >
                                                        Table {table.number} - {table.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-4">
                                <div className="w-5 h-5 bg-primary rounded-full animate-pulse shadow-[0_0_20px_rgba(234,88,12,0.8)]" />
                                <span className="text-2xl font-black uppercase tracking-widest">Live Update</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-14 flex-1 min-h-0 overflow-y-auto pr-6 custom-scrollbar transition-all duration-500 pb-16">
                        <div className="flex flex-wrap gap-10 flex-1 min-h-0">
                            {displayedTables
                                .slice(currentPage * displayCount, (currentPage + 1) * displayCount)
                                .map(table => (
                                        <div key={table.id} className={cn("flex-1 min-w-[450px] border-2 rounded-[3.5rem] p-8 flex flex-col gap-8 hover:border-primary/20 transition-all backdrop-blur-md relative overflow-hidden group min-h-[450px] max-h-[600px]", isDark ? 'bg-white/[0.02] border-white/5 shadow-2xl' : 'bg-[#EFECE5]/70 border-[#D5D0C8] shadow-lg shadow-black/5')}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                            {/* Card Header */}
                                            <div className="flex justify-between items-center relative z-10 shrink-0">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-primary border shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", isDark ? 'bg-white/5 border-white/10' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                        {table.game_image ? (
                                                            <img src={table.game_image} alt={table.game_type} className="w-full h-full object-cover rounded-[1.8rem]" />
                                                        ) : (
                                                            <Gamepad2 size={36} />
                                                        )}
                                                    </div>
                                                    <div className="flex items-baseline gap-4 mb-2">
                                                        <h5 className={cn("text-5xl font-black italic tracking-tighter leading-none", isDark ? 'text-white' : 'text-[#1A1A1A]')}>#{table.number}</h5>
                                                        <p className="text-2xl font-black uppercase tracking-wide text-primary">{table.name}</p>
                                                    </div>
                                                </div>
                                                <div className={cn("px-5 py-2.5 rounded-2xl border", isDark ? 'bg-white/5 border-white/10' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? 'text-white/40' : 'text-[#6B6560]')}>{table.game_type}</span>
                                                </div>
                                            </div>

                                            {/* Players List - Scrollable with Design Scrollbar */}
                                            <div className="flex-1 min-h-0 relative z-10">
                                                {table.players.length === 0 ? (
                                                    <div className={cn("h-full flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed p-8 opacity-40", isDark ? 'bg-white/[0.01] border-white/5' : 'bg-[#E8E4DC]/50 border-[#D5D0C8]')}>
                                                        <PlayCircle size={48} className={cn("mb-4", isDark ? "text-white/10" : "text-black/10")} />
                                                        <p className={cn("text-xl font-black uppercase tracking-[0.2em] italic text-center", isDark ? "text-white/20" : "text-[#1A1A1A]/35")}>Operational Standby</p>
                                                    </div>
                                                ) : (
                                                    <div className="h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-3">
                                                        {table.players
                                                            .sort((a, b) => {
                                                                const priority = { 'playing': 0, 'notified': 1, 'waiting': 2, 'completed': 3, 'cancelled': 4 };
                                                                if (priority[a.status] !== priority[b.status]) return (priority[a.status] as number) - (priority[b.status] as number);
                                                                return a.daily_number - b.daily_number;
                                                            })
                                                            .map((player) => (
                                                                <div
                                                                    key={player.session_id}
                                                                    className={cn(
                                                                        "flex items-center justify-between py-3.5 px-6 rounded-2xl border-2 transition-all duration-500",
                                                                        player.status === 'playing' ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/5" :
                                                                            player.status === 'notified' ? "bg-blue-500/15 border-blue-500/30 animate-pulse text-blue-400" :
                                                                                isDark ? "bg-white/[0.03] border-white/5" : "bg-[#E8E4DC]/60 border-[#D5D0C8]"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-5">
                                                                        <div className={cn(
                                                                            "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black shadow-md",
                                                                            player.status === 'playing' ? "bg-primary text-white" : isDark ? "bg-white/10 text-white/40" : "bg-[#D5D0C8] text-[#6B6560]"
                                                                        )}>
                                                                            {player.status === 'playing' ? '🎮' : `#${player.daily_number}`}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">{player.name}</p>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={cn(
                                                                                    "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                                                                    player.status === 'playing' ? "bg-primary/20 border-primary/50 text-primary" :
                                                                                        player.status === 'notified' ? "bg-blue-500/20 border-blue-500/50 text-blue-400" :
                                                                                            isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-[#1A1A1A]/40"
                                                                                )}>
                                                                                    {player.status}
                                                                                </span>
                                                                                {player.status === 'notified' && (
                                                                                    <div className="flex items-center gap-1.5 text-blue-400 font-black">
                                                                                        <Clock size={12} />
                                                                                        <span className="text-sm">{player.timer}s</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {player.recent_orders.length > 0 && (
                                                                        <div className={cn("hidden sm:block px-3 py-1.5 rounded-xl border", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-[#1A1A1A]/50")}>
                                                                                {player.recent_orders[0].name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}

                                                        {/* Bottom spacing for scroll padding */}
                                                        <div className="h-4 shrink-0" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {displayedTables.length > displayCount && (
                        <div className="flex justify-center gap-8 mt-12 mb-6">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className={cn("rounded-full w-20 h-20 transition-all border-none", isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-[#E8E4DC] hover:bg-[#D5D0C8] text-[#1A1A1A]')}
                            >
                                <ChevronLeft size={48} />
                            </Button>
                            <div className="flex items-center gap-4 text-3xl font-black uppercase tracking-[0.3em]">
                                <span className="text-primary">{currentPage + 1}</span>
                                <span className={cn(isDark ? "text-white/10" : "text-black/10")}>|</span>
                                <span className={cn(isDark ? "text-white/40" : "text-black/40")}>{Math.ceil(displayedTables.length / displayCount)}</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(displayedTables.length / displayCount) - 1, p + 1))}
                                disabled={currentPage >= Math.ceil(displayedTables.length / displayCount) - 1}
                                className={cn("rounded-full w-20 h-20 transition-all border-none", isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-[#E8E4DC] hover:bg-[#D5D0C8] text-[#1A1A1A]')}
                            >
                                <ChevronRight size={48} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar {
                    height: 2px;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                @keyframes scan {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10%, 90% { opacity: 1; }
                    50% { transform: translateY(500px); }
                }
            `}</style>
        </div>
    )
}

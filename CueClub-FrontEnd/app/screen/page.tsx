'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Gamepad2, PlayCircle, Clock, Filter, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
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
            const gameRes = await fetch('/api/game-status')
            if (gameRes.ok) setTables(await gameRes.json())
        } catch (err) {
            console.error("Failed to fetch screen data", err)
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoggingIn(true)
        
        const maxRetries = 3
        let lastError = ''
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 15000 : 10000)
                
                const res = await fetch('/api/sys-admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...loginForm, login_type: 'screen' }),
                    signal: controller.signal
                })
                clearTimeout(timeout)
                
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
                    setIsLoggingIn(false)
                    return
                }
                
                // Real auth failure — don't retry
                if (res.status === 401 || res.status === 400) {
                    alert("Invalid Admin Credentials")
                    setIsLoggingIn(false)
                    return
                }
                
                lastError = `Server error (${res.status})`
            } catch (err: any) {
                lastError = err.name === 'AbortError' ? 'Request timed out' : 'Connection error'
                // Wait briefly before retrying (cold-start recovery)
                if (attempt < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, 1500))
                }
            }
        }
        
        alert(lastError || "Connection failed after multiple attempts")
        setIsLoggingIn(false)
    }

    if (loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? 'dark bg-background' : 'light-mode bg-background')}>
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-4", isDark ? 'dark bg-background text-foreground' : 'light-mode bg-background text-foreground')}>
                <Card className="w-full max-w-md p-6 rounded-md border border-border bg-card shadow-sm">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                            <Gamepad2 size={24} />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Terminal Access</h2>
                        <p className="text-xs text-muted-foreground mt-1">Establish Connection to Mainframe</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            placeholder="Admin Node Identifier"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            className="w-full h-10 rounded-md px-3 font-normal border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Access Authorization Key"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className="w-full h-10 rounded-md px-3 font-normal border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground"
                            required
                        />
                        <Button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : 'Initialize Feed'}
                        </Button>
                    </form>
                </Card>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen p-6 flex flex-col h-screen", isDark ? 'dark bg-background text-foreground' : 'light-mode bg-background text-foreground')}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8 shrink-0 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white shrink-0">
                        <span className="font-bold text-xl">C</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cue Club</h1>
                        <p className="text-primary font-medium tracking-wider text-xs uppercase">Live Tournament Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold tabular-nums leading-none">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Local Clubhouse Time</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {/* Live Queue Section - Full Width */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                            <Gamepad2 size={20} className="text-primary" />
                            Live Queue Status
                        </h3>
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-8 rounded-md text-xs font-medium border border-border bg-card text-foreground px-3 hover:bg-muted transition-colors flex items-center gap-2 shadow-sm">
                                        <Filter size={14} className="text-primary" />
                                        <span>
                                            {selectedTableIds.includes('all')
                                                ? `Grid View: ${displayCount} Tables`
                                                : `Selected: ${selectedTableIds.length} Tables`
                                            }
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md">
                                    <div className="space-y-4">
                                        <div>
                                            <DropdownMenuLabel className="text-primary font-bold uppercase text-[10px] tracking-wider px-2 mb-1 flex items-center gap-2">
                                                <Users size={12} />
                                                Filter Tables
                                            </DropdownMenuLabel>
                                            <div className="space-y-0.5">
                                                <DropdownMenuCheckboxItem
                                                    checked={selectedTableIds.includes('all')}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) updateSelectedTables(['all']);
                                                        setCurrentPage(0);
                                                    }}
                                                    className="text-xs font-medium cursor-pointer rounded-sm py-1.5 focus:bg-accent focus:text-accent-foreground"
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
                                                        className="text-xs font-medium cursor-pointer rounded-sm py-1.5 focus:bg-accent focus:text-accent-foreground"
                                                    >
                                                        Table {table.number} - {table.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/20" />
                                <span className="text-xs font-medium uppercase tracking-wider">Live Update</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {displayedTables
                                .slice(currentPage * displayCount, (currentPage + 1) * displayCount)
                                .map(table => (
                                    <div key={table.id} className="flex flex-col gap-4 border border-border rounded-md p-6 bg-card text-card-foreground shadow-sm relative overflow-hidden group min-h-[350px] max-h-[500px]">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center relative z-10 shrink-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-md flex items-center justify-center text-primary border border-border bg-muted/50 shrink-0 overflow-hidden">
                                                    {table.game_image ? (
                                                        <img src={table.game_image} alt={table.game_type} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Gamepad2 size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                        <h5 className="text-2xl font-bold tracking-tight">#{table.number}</h5>
                                                        <p className="text-sm font-bold text-primary">{table.name}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{table.game_type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Players List */}
                                        <div className="flex-1 min-h-0 relative z-10">
                                            {table.players.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center rounded-md border border-dashed border-border p-6 opacity-60 bg-muted/10">
                                                    <PlayCircle size={32} className="mb-2 text-muted-foreground/30" />
                                                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/40 text-center">Operational Standby</p>
                                                </div>
                                            ) : (
                                                <div className="h-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
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
                                                                    "flex items-center justify-between py-2.5 px-4 rounded-md border transition-all duration-200",
                                                                    player.status === 'playing' ? "bg-primary/10 border-primary/30 text-foreground" :
                                                                        player.status === 'notified' ? "bg-blue-500/10 border-blue-500/30 text-blue-500 animate-pulse" :
                                                                            "bg-card border-border"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground",
                                                                        player.status === 'playing' && "bg-primary text-primary-foreground"
                                                                    )}>
                                                                        {player.status === 'playing' ? '🎮' : `#${player.daily_number}`}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-foreground leading-none mb-1">{player.name}</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={cn(
                                                                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                                                player.status === 'playing' ? "bg-primary/20 border-primary/30 text-primary" :
                                                                                    player.status === 'notified' ? "bg-blue-500/20 border-blue-500/30 text-blue-500" :
                                                                                        "bg-muted border-border text-muted-foreground"
                                                                            )}>
                                                                                {player.status}
                                                                            </span>
                                                                            {player.status === 'notified' && (
                                                                                <div className="flex items-center gap-1 text-blue-500 font-bold">
                                                                                    <Clock size={10} />
                                                                                    <span className="text-xs">{player.timer}s</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {player.recent_orders.length > 0 && (
                                                                    <div className="hidden sm:block px-2 py-1 rounded-md border border-border bg-muted/40">
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                            {player.recent_orders[0].name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {displayedTables.length > displayCount && (
                        <div className="flex justify-center items-center gap-4 mt-6 mb-2 shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="rounded-md w-10 h-10 border border-border bg-card text-foreground hover:bg-muted transition-colors p-0 flex items-center justify-center"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <div className="flex items-center gap-2 text-sm font-bold tracking-wider">
                                <span className="text-primary">{currentPage + 1}</span>
                                <span className="text-muted-foreground/30">/</span>
                                <span className="text-muted-foreground">{Math.ceil(displayedTables.length / displayCount)}</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(displayedTables.length / displayCount) - 1, p + 1))}
                                disabled={currentPage >= Math.ceil(displayedTables.length / displayCount) - 1}
                                className="rounded-md w-10 h-10 border border-border bg-card text-foreground hover:bg-muted transition-colors p-0 flex items-center justify-center"
                            >
                                <ChevronRight size={20} />
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
                    border-radius: 4px;
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
                    border-radius: 4px;
                }
            `}</style>
        </div>
    )
}

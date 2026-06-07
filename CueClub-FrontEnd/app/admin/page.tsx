'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Coffee,
    ShoppingCart,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
    Award,
    Lock,
    LogOut,
    Search,
    ChevronRight,
    DollarSign,
    Zap,
    Clock,
    ChevronDown,
    History,
    Archive,
    Gamepad2,
    Settings,
    Timer,
    Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSectionTheme } from '@/hooks/use-section-theme'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

type Tab = 'dashboard' | 'waiters' | 'menu' | 'orders' | 'clients' | 'sessions' | 'financials' | 'history' | 'games' | 'admins' | 'settings'

interface AdminUser {
    id: number;
    username: string;
    admin_level: string;
    created_at: string;
}

interface Menu {
    id: number;
    name: string;
    description: string;
    price: number | string;
    category: string;
    image_path: string;
    is_available: boolean;
    popularity: number;
}

interface Waiter {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    status: string;
    role: string;
    current_load: number;
    joined_at: string;
}

interface Order {
    id: number;
    name: string;
    price: number | string;
    status: string;
    customer: string;
    table: string;
    waiter: string;
    created_at: string;
}

interface FinancialRecord {
    id: number;
    order: string;
    order_details?: string;
    amount: string;
    type: string;
    method: string;
    status: string;
    note: string;
    date: string;
}

interface ClientRecord {
    id: number;
    full_name: string;
    phone: string;
    email: string;
}

interface GameSession {
    id: number;
    client: string;
    client_id?: number | null;
    opponent?: string | null;
    opponent_id?: number | null;
    table: string;
    table_name?: string;
    status: string;
    daily_number: number;
    created_at: string;
    winner?: string | null;
}

interface HistoryRecord {
    category: 'Session' | 'Order' | 'Finance';
    detail: string;
    status: string;
    date: string;
    info: string;
}

interface GameType {
    id: number;
    name: string;
    image_path: string;
    station_count: number;
    description: string;
}

interface GamingTable {
    id: number;
    name: string;
    number: number;
    club: string;
    game_type_id: number | null;
    game_type_name: string | null;
}

export default function AdminPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { theme, toggleTheme, isDark } = useSectionTheme('admin')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loginForm, setLoginForm] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    // Data states
    const [waiters, setWaiters] = useState<Waiter[]>([])
    const [menu, setMenu] = useState<Menu[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<ClientRecord[]>([])
    const [sessions, setSessions] = useState<GameSession[]>([])
    const [financials, setFinancials] = useState<FinancialRecord[]>([])
    const [historyData, setHistoryData] = useState<HistoryRecord[]>([])
    const [historyFilter, setHistoryFilter] = useState('All')
    const [historySearch, setHistorySearch] = useState('')
    const [gameTypes, setGameTypes] = useState<GameType[]>([])
    const [gamingTables, setGamingTables] = useState<GamingTable[]>([])
    const [admins, setAdmins] = useState<AdminUser[]>([])

    // UI states
    const [showModal, setShowModal] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [adminLevel, setAdminLevel] = useState<string | null>(null)
    const [winnerModal, setWinnerModal] = useState<GameSession | null>(null)
    const [settingWinner, setSettingWinner] = useState(false)
    const [dataLoading, setDataLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [gameFilter, setGameFilter] = useState<string>('All')

    // Session management states
    const [sessionConfig, setSessionConfig] = useState<{admin_session_hours: number, screen_session_hours: number, user_session_hours: number} | null>(null)
    const [sessionRemaining, setSessionRemaining] = useState<string | null>(null)
    const [savingConfig, setSavingConfig] = useState(false)

    const fetchWithAuth = async (url: string, options: any = {}) => {
        const token = localStorage.getItem('cueclub_admin_token')
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        })
    }

    // Check session validity on mount and periodically
    const checkSessionValidity = async () => {
        const loginTimestamp = localStorage.getItem('cueclub_admin_login_timestamp')
        const sessionDuration = parseFloat(localStorage.getItem('cueclub_admin_session_duration') || '6')
        
        if (!loginTimestamp) {
            // Legacy session without timestamp - force re-login
            handleLogout()
            return false
        }
        
        // Quick client-side check
        const loginTime = new Date(loginTimestamp).getTime()
        const now = Date.now()
        const elapsedHours = (now - loginTime) / (1000 * 60 * 60)
        
        if (elapsedHours > sessionDuration) {
            handleLogout()
            alert('Your admin session has expired. Please log in again.')
            return false
        }
        
        // Calculate remaining time
        const remainingHours = sessionDuration - elapsedHours
        if (remainingHours < 1) {
            const mins = Math.floor(remainingHours * 60)
            setSessionRemaining(`${mins}m`)
        } else {
            const hrs = Math.floor(remainingHours)
            const mins = Math.floor((remainingHours - hrs) * 60)
            setSessionRemaining(`${hrs}h ${mins}m`)
        }
        
        return true
    }

    useEffect(() => {
        const token = localStorage.getItem('cueclub_admin_token')
        const level = localStorage.getItem('cueclub_admin_level')
        if (token) {
            // Verify session is not expired before restoring
            const loginTimestamp = localStorage.getItem('cueclub_admin_login_timestamp')
            const sessionDuration = parseFloat(localStorage.getItem('cueclub_admin_session_duration') || '6')
            
            if (loginTimestamp) {
                const loginTime = new Date(loginTimestamp).getTime()
                const elapsedHours = (Date.now() - loginTime) / (1000 * 60 * 60)
                
                if (elapsedHours > sessionDuration) {
                    // Session expired
                    localStorage.removeItem('cueclub_admin_token')
                    localStorage.removeItem('cueclub_admin_level')
                    localStorage.removeItem('cueclub_admin_login_timestamp')
                    localStorage.removeItem('cueclub_admin_session_duration')
                    alert('Your admin session has expired. Please log in again.')
                    return
                }
            } else {
                // Legacy session without timestamp - clear and force re-login
                localStorage.removeItem('cueclub_admin_token')
                localStorage.removeItem('cueclub_admin_level')
                return
            }
            
            setIsLoggedIn(true)
            setAdminLevel(level)
            fetchAllData()
            checkSessionValidity()
        }

        // Check session validity every 60 seconds
        const sessionCheckInterval = setInterval(() => {
            const t = localStorage.getItem('cueclub_admin_token')
            if (t) checkSessionValidity()
        }, 60000)
        
        return () => clearInterval(sessionCheckInterval)
    }, [])

    const fetchAllData = async () => {
        setDataLoading(true)
        try {
            const [wRes, mRes, oRes, cRes, sRes, fRes, gtRes, tRes] = await Promise.all([
                fetchWithAuth('/api/sys-admin/waiters'),
                fetchWithAuth('/api/sys-admin/menu'),
                fetchWithAuth('/api/sys-admin/orders'),
                fetchWithAuth('/api/sys-admin/clients'),
                fetchWithAuth('/api/sys-admin/sessions'),
                fetchWithAuth('/api/sys-admin/financials'),
                fetchWithAuth('/api/sys-admin/game-types'),
                fetchWithAuth('/api/sys-admin/gaming-tables')
            ])
            if (wRes.ok) setWaiters(await wRes.json())
            if (mRes.ok) setMenu(await mRes.json())
            if (oRes.ok) setOrders(await oRes.json())
            if (cRes.ok) setClients(await cRes.json())
            if (sRes.ok) setSessions(await sRes.json())
            if (fRes.ok) setFinancials(await fRes.json())
            if (gtRes.ok) setGameTypes(await gtRes.json())
            if (tRes.ok) setGamingTables(await tRes.json())

            if (localStorage.getItem('cueclub_admin_level') === 'super_admin') {
                const aRes = await fetchWithAuth('/api/sys-admin/admins')
                if (aRes.ok) setAdmins(await aRes.json())
            }

            const hRes = await fetchWithAuth('/api/sys-admin/history')
            if (hRes.ok) setHistoryData(await hRes.json())
            setHasFetched(true)
        } catch (err) {
            console.error("Failed to fetch admin data", err)
        } finally {
            setDataLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
        const maxRetries = 3
        let lastError = ''
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 15000 : 10000)
                
                const res = await fetch('/api/sys-admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...loginForm, login_type: 'admin' }),
                    signal: controller.signal
                })
                clearTimeout(timeout)
                
                if (res.ok) {
                    const data = await res.json()
                    localStorage.setItem('cueclub_admin_token', data.token)
                    localStorage.setItem('cueclub_admin_level', data.admin_level)
                    localStorage.setItem('cueclub_admin_login_timestamp', data.login_timestamp)
                    localStorage.setItem('cueclub_admin_session_duration', String(data.session_duration_hours))
                    setIsLoggedIn(true)
                    setAdminLevel(data.admin_level)
                    fetchAllData()
                    checkSessionValidity()
                    setLoading(false)
                    return
                }
                
                // Real auth failure — don't retry
                if (res.status === 401 || res.status === 400) {
                    alert("Invalid Credentials")
                    setLoading(false)
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
        setLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('cueclub_admin_token')
        localStorage.removeItem('cueclub_admin_level')
        localStorage.removeItem('cueclub_admin_login_timestamp')
        localStorage.removeItem('cueclub_admin_session_duration')
        setIsLoggedIn(false)
        setAdminLevel(null)
        setSessionRemaining(null)
    }

    const fetchSessionConfig = async () => {
        try {
            const res = await fetchWithAuth('/api/sys-admin/session-config')
            if (res.ok) {
                const data = await res.json()
                setSessionConfig(data)
            }
        } catch (err) {
            console.error('Failed to fetch session config', err)
        }
    }

    const handleSaveSessionConfig = async (adminHours: number, screenHours: number, userHours: number) => {
        setSavingConfig(true)
        try {
            const res = await fetchWithAuth('/api/sys-admin/session-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_session_hours: adminHours,
                    screen_session_hours: screenHours,
                    user_session_hours: userHours
                })
            })
            if (res.ok) {
                const data = await res.json()
                setSessionConfig({ admin_session_hours: data.admin_session_hours, screen_session_hours: data.screen_session_hours, user_session_hours: data.user_session_hours })
                // Update local session duration if it changed
                localStorage.setItem('cueclub_admin_session_duration', String(data.admin_session_hours))
                alert('Session configuration updated successfully')
            } else {
                const err = await res.json()
                alert(err.detail || 'Failed to update')
            }
        } catch (err) {
            alert('Connection error')
        } finally {
            setSavingConfig(false)
        }
    }

    const handleUpdateOrderStatus = async (id: number, status: string) => {
        try {
            const res = await fetchWithAuth(`/api/sys-admin/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
            }
        } catch (err) {
            alert("Update failed")
        }
    }

    const handleDelete = async (type: string, id: number) => {
        if (!confirm('Are you sure?')) return
        const apiType = type === 'games' ? 'game-types' : type;
        try {
            const res = await fetchWithAuth(`/api/sys-admin/${apiType}/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchAllData()
            }
        } catch (err) {
            alert("Delete failed")
        }
    }

    const handleSetWinner = async (sessionId: number, winnerId: number | null) => {
        setSettingWinner(true)
        try {
            const res = await fetchWithAuth('/api/set-session-winner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, winner_id: winnerId })
            })
            if (res.ok) {
                await fetchWithAuth(`/api/sys-admin/sessions/${sessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' })
                })
                setWinnerModal(null)
                fetchAllData()
            } else {
                const err = await res.json()
                alert(err.detail || 'Failed to set winner')
            }
        } catch (e) {
            alert('Network error setting winner')
        } finally {
            setSettingWinner(false)
        }
    }

    return (
        <div className={cn("h-screen flex overflow-hidden relative font-sans items-center justify-center transition-colors duration-200 bg-background text-foreground", isDark ? 'dark' : 'light-mode')}>
            {!isLoggedIn ? (
                <Card className="w-full max-w-[360px] rounded-md p-6 border border-border bg-card shadow-sm relative z-10 text-foreground">
                    <div className="space-y-6">
                        <div className="text-center space-y-3 relative">
                            <div className="absolute top-0 right-0 flex gap-2">
                                <LanguageToggle />
                                <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mx-auto border border-primary/20">
                                <Lock className="text-primary" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
                            <p className="text-xs text-muted-foreground">Master Control Access</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                    className="w-full h-10 rounded-md px-3 font-normal border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full h-10 rounded-md px-3 font-normal border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'System Unlock'}
                            </Button>
                        </form>
                    </div>
                </Card>
            ) : (
                 <div className="w-full h-full flex overflow-hidden relative z-10">
                    {/* Sidebar */}
                    <aside className="w-60 border-r border-border p-6 flex flex-col hidden lg:flex relative shrink-0 bg-card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-lg">C</span>
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-foreground">CueClub</h2>
                                <span className="text-[10px] text-muted-foreground font-medium">Admin Suite v2.1</span>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                            {[
                                {
                                    group: t('admin.coreOperations', 'Core Operations'),
                                    items: [
                                        { id: 'dashboard', icon: LayoutDashboard, label: t('admin.controlCenter', 'Control Center'), level: 'simple_admin' },
                                        { id: 'history', icon: History, label: t('admin.systemLogs', 'System Logs'), level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: t('admin.gamingArena', 'Gaming Arena'),
                                    items: [
                                        { id: 'sessions', icon: Clock, label: t('admin.liveSessions', 'Live Sessions'), level: 'simple_admin' },
                                        { id: 'games', icon: Gamepad2, label: t('admin.tableSetup', 'Table Setup'), level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: t('admin.serviceMenu', 'Service & Menu'),
                                    items: [
                                        { id: 'orders', icon: ShoppingCart, label: t('admin.orderStream', 'Order Stream'), level: 'simple_admin' },
                                        { id: 'menu', icon: Coffee, label: t('admin.menuCatalog', 'Menu Catalog'), level: 'super_admin' },
                                        { id: 'waiters', icon: Users, label: t('admin.staffRoster', 'Staff Roster'), level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: t('admin.administration', 'Administration'),
                                    items: [
                                        { id: 'clients', icon: Users, label: t('admin.memberDatabase', 'Member Database'), level: 'super_admin' },
                                        { id: 'financials', icon: DollarSign, label: t('admin.financialLedger', 'Financial Ledger'), level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: t('admin.systemSecurity', 'System Security'),
                                    items: [
                                        { id: 'admins', icon: Lock, label: t('admin.accessControl', 'Access Control'), level: 'super_admin' },
                                        { id: 'settings', icon: Settings, label: t('admin.sessionSettings', 'Session Settings'), level: 'super_admin' },
                                    ]
                                }
                            ].map((section, idx) => {
                                const visibleItems = section.items.filter(item => 
                                    adminLevel === 'super_admin' || item.level === 'simple_admin'
                                )
                                if (visibleItems.length === 0) return null

                                return (
                                <div key={idx} className="space-y-1">
                                    <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                                        {section.group}
                                    </h3>
                                    <div className="space-y-0.5">
                                        {visibleItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id as Tab)}
                                                className={cn(
                                                    "w-full h-9 rounded-md px-3 flex items-center gap-3 font-medium text-xs transition-colors duration-150 text-left",
                                                    activeTab === item.id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <item.icon size={16} className="shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                )
                            })}
                        </nav>

                        {sessionRemaining && (
                            <div className="rounded-md px-3 py-2 mb-3 flex items-center gap-3 border border-border bg-muted/50">
                                <Timer size={14} className="text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Session Expires</p>
                                    <p className="text-xs font-semibold text-foreground">{sessionRemaining}</p>
                                </div>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="h-9 rounded-md px-3 justify-start gap-3 font-medium text-xs text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                        >
                            <LogOut size={16} />
                            Logout
                        </Button>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6 overflow-hidden flex flex-col relative gap-6 bg-background">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border pb-4">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    {activeTab === 'dashboard' ? t('admin.controlCenter', 'Control Center') :
                                        activeTab === 'sessions' ? t('admin.liveSessions', 'Live Sessions') :
                                            activeTab === 'games' ? t('admin.tableSetup', 'Table Setup') :
                                                activeTab === 'clients' ? t('admin.memberDatabase', 'Member Database') :
                                                    activeTab === 'waiters' ? t('admin.staffRoster', 'Staff Roster') :
                                                        activeTab === 'menu' ? t('admin.menuCatalog', 'Menu Catalog') :
                                                            activeTab === 'orders' ? t('admin.orderStream', 'Order Stream') :
                                                                activeTab === 'admins' ? t('admin.accessControl', 'Access Control') :
                                                                    activeTab === 'settings' ? t('admin.sessionSettings', 'Session Settings') :
                                                                        activeTab === 'history' ? t('admin.systemLogs', 'System Logs') : t('admin.financialLedger', 'Financial Ledger')}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-muted-foreground">{t('admin.adminCommandNode', 'Admin Command Node')}</p>
                                    {dataLoading && (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border border-primary/20 bg-primary/10 text-primary animate-pulse">
                                            <Loader2 className="animate-spin" size={10} />
                                            Syncing Vault...
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <LanguageToggle />
                                <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                                <div className="rounded-md h-9 px-3 flex items-center gap-2 min-w-[200px] border border-border bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
                                    <Search size={14} className="text-muted-foreground shrink-0" />
                                    <input
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs flex-1 text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                        </header>                        {!hasFetched ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <div className="text-center">
                                    <h3 className="text-sm font-semibold text-foreground">Establishing Database Link...</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Securing connection with remote node</p>
                                </div>
                            </div>
                        ) : (
                            <>
                        {activeTab === 'dashboard' && (
                            <div className="flex-1 flex flex-col min-h-0 gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                                    <StatCard label="Active Reach" value={clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)).length} icon={Users} trend="+3 mem" />
                                    <StatCard label="Live Game" value={sessions.filter(s => s.status === 'playing' && (!searchTerm || s.table_name?.toLowerCase().includes(searchTerm.toLowerCase()))).length} icon={Clock} trend="Active" />
                                    <StatCard label="Staff On" value={waiters.filter(w => w.status === 'active').length} icon={Zap} trend="Optimized" />
                                    <StatCard label="Revenue" value={`${financials.filter(f => !searchTerm || f.order_details?.toLowerCase().includes(searchTerm.toLowerCase())).reduce((s, o) => s + parseFloat((o.amount as string) || '0'), 0)} DH`} icon={DollarSign} trend="+12%" />
                                </div>

                                <Card className="rounded-md border border-border bg-card p-6 flex-1 overflow-hidden flex flex-col min-h-0 shadow-sm">
                                    <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between shrink-0">
                                        <div>
                                            <CardTitle className="text-base font-bold tracking-tight text-foreground">Recent Activity</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            <span className="text-xs font-medium text-primary">Live Feed</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-0 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-3">
                                            {orders.slice(0, 5).map(order => (
                                                <div key={order.id} className="rounded-md p-4 flex items-center justify-between border border-border bg-muted/30 hover:bg-muted/50 transition-colors duration-155">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center text-primary shrink-0">
                                                            <Zap size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-foreground">{order.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-muted-foreground">{order.customer} • {order.table}</p>
                                                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                    {order.waiter}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-primary">{order.price} DH</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(order.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'menu' && (
                            <section className="space-y-4 h-full flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Item Repository</h2>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowModal({ type: 'menu' })}>
                                        <Plus size={14} /> Add New Item
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Detail</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Category</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Popularity</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Price</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {menu.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{item.id}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                                    {item.name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-xs text-foreground">{item.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 text-foreground">{item.category}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Award size={12} className="text-amber-500" />
                                                                <span className="text-xs font-semibold text-foreground">{item.popularity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-sm text-foreground">{item.price} <span className="text-[10px] text-muted-foreground">DH</span></td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'menu', data: item })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('menu', item.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'waiters' && (
                            <section className="space-y-4 h-full flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personnel Node</h2>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowModal({ type: 'waiters' })}>
                                        <Plus size={14} /> Recruit Staff
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Staff Name</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Role</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Current Load</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {waiters.map(waiter => (
                                                    <tr key={waiter.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground">
                                                                    <Users size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-xs text-foreground">{waiter.full_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">Member #{waiter.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 text-foreground">
                                                                {waiter.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", waiter.status === 'active' ? "bg-emerald-500" : "bg-red-500")} />
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{waiter.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="w-20 h-1.5 rounded-full overflow-hidden bg-muted border border-border">
                                                                    <div
                                                                        className={cn("h-full transition-all duration-300", waiter.current_load > 3 ? "bg-red-500" : "bg-primary")}
                                                                        style={{ width: `${Math.min(100, (waiter.current_load / 5) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground">{waiter.current_load} Active Orders</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'waiters', data: waiter })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('waiters', waiter.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'orders' && (
                             <section className="h-full flex flex-col space-y-4 min-h-0">
                                 <div className="flex justify-between items-center shrink-0">
                                     <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Command Stream</h2>
                                     <p className="text-xs text-muted-foreground">{orders.length} Orders</p>
                                 </div>
                                 <div className="border border-border bg-card rounded-md flex-1 overflow-y-auto relative custom-scrollbar shadow-sm">
                                     <div className="absolute inset-0 p-4 space-y-3">
                                         {orders.filter(o => !searchTerm || o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer?.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                                             <div key={order.id} className="rounded-md p-4 flex flex-col md:flex-row items-center justify-between border border-border bg-muted/30 hover:bg-muted/50 transition-colors duration-150 gap-4 group">
                                                 <div className="flex items-center gap-3 w-full md:w-auto">
                                                     <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                                                         {order.customer?.charAt(0) || '?'}
                                                     </div>
                                                     <div>
                                                        <p className="font-semibold text-sm text-foreground">{order.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-semibold text-primary">{order.customer}</span>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <span className="text-xs text-muted-foreground">{order.table}</span>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                Responsible: {order.waiter}
                                                            </span>
                                                        </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                     <div className="text-right">
                                                         <p className="text-sm font-bold text-primary">{order.price} DH</p>
                                                         <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleTimeString()}</p>
                                                     </div>

                                                     <div className="flex items-center gap-2">
                                                         <div className={cn(
                                                             "px-2.5 py-1 rounded text-[10px] font-semibold border text-center min-w-[80px]",
                                                             order.status === 'served' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                                 order.status === 'preparing' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                                                     order.status === 'pending' ? "bg-primary/10 border-primary/20 text-primary animate-pulse" : "bg-red-500/10 border-red-500/20 text-red-600"
                                                         )}>
                                                             {order.status}
                                                         </div>

                                                         <div className="flex items-center gap-1">
                                                             {order.status !== 'served' && order.status !== 'cancelled' && (
                                                                 <>
                                                                     {order.status === 'pending' && (
                                                                         <Button
                                                                             variant="ghost"
                                                                             size="icon"
                                                                             className="h-8 w-8 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-md"
                                                                             onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                                                         >
                                                                             <Clock size={14} />
                                                                         </Button>
                                                                     )}
                                                                     <Button
                                                                         variant="ghost"
                                                                         size="icon"
                                                                         className="h-8 w-8 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md"
                                                                         onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                                                                     >
                                                                         <CheckCircle size={14} />
                                                                     </Button>
                                                                 </>
                                                             )}
                                                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-primary/20 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={() => setShowModal({ type: 'orders', data: order })}>
                                                                 <Edit size={12} />
                                                             </Button>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                          ))}
                                     </div>
                                 </div>
                             </section>
                        )}

                        {activeTab === 'clients' && (
                            <section className="space-y-4 h-full flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Member Registry</h2>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowModal({ type: 'clients' })}>
                                        <Plus size={14} /> Register Member
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Client Profile</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Contact</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))).map(client => (
                                                    <tr key={client.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{client.id}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                                                                    {client.full_name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-xs text-foreground">{client.full_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">Verified Member</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <p className="text-xs font-semibold text-foreground">{client.email || 'No Email'}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">{client.phone || 'No Phone'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'clients', data: client })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('clients', client.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'sessions' && (
                            <section className="space-y-4 h-full flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pool Command</h2>
                                        <div className="flex items-center gap-2">
                                            <Filter size={14} className="text-muted-foreground" />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setGameFilter('All')}
                                                    className={cn(
                                                        "h-6 rounded px-2 text-[10px] font-medium transition-colors border",
                                                        gameFilter === 'All'
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                                                    )}
                                                >
                                                    All
                                                </button>
                                                {gameTypes.map(gt => (
                                                    <button
                                                        key={gt.id}
                                                        onClick={() => setGameFilter(gt.name)}
                                                        className={cn(
                                                            "h-6 rounded px-2 text-[10px] font-medium transition-colors border",
                                                            gameFilter === gt.name
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                                                        )}
                                                    >
                                                        {gt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowModal({ type: 'sessions' })}>
                                        <Plus size={14} /> New Session
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Queue</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Member</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Opponent</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Table</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Initiated</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {sessions.filter(s => {
                                                    const matchesSearch = !searchTerm || s.client?.toLowerCase().includes(searchTerm.toLowerCase()) || s.table?.toLowerCase().includes(searchTerm.toLowerCase())
                                                    if (gameFilter === 'All') return matchesSearch
                                                    const sessionTable = gamingTables.find(t => t.name === s.table || `Table ${t.number}` === s.table)
                                                    const matchesGame = sessionTable?.game_type_name === gameFilter
                                                    return matchesSearch && matchesGame
                                                }).map(session => (
                                                    <tr key={session.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                        <td className="px-4 py-3 text-xs font-mono text-primary font-bold">#{session.daily_number}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{session.client}</td>
                                                        <td className="px-4 py-3">
                                                            {session.opponent ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs">⚔️</span>
                                                                    <p className="font-medium text-xs text-muted-foreground">{session.opponent}</p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground/50 uppercase">Solo</span>
                                                            )}
                                                            {session.winner && (
                                                                <p className="text-[10px] text-amber-500 font-semibold mt-1">👑 {session.winner}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary">
                                                                {session.table}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn(
                                                                    "w-1.5 h-1.5 rounded-full",
                                                                    session.status === 'playing' ? "bg-emerald-500" :
                                                                        session.status === 'waiting' ? "bg-amber-500" : "bg-red-500"
                                                                )} />
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{session.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <p className="text-[10px] text-muted-foreground">{new Date(session.created_at).toLocaleTimeString()}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                {session.opponent && session.status === 'playing' && !session.winner && (
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-500/20 hover:text-amber-600 rounded-md" onClick={() => setWinnerModal(session)} title="Crown Winner">
                                                                        <Award size={12} />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'sessions', data: session })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('sessions', session.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'financials' && (
                            <section className="space-y-4 h-full flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Audit Ledger</h2>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowModal({ type: 'financials' })}>
                                        <Plus size={14} /> Post Record
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Reference</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Method</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Amount</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {financials.filter(f => !searchTerm || f.order?.toLowerCase().includes(searchTerm.toLowerCase()) || f.note?.toLowerCase().includes(searchTerm.toLowerCase())).map(rec => (
                                                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-xs text-foreground">{rec.order}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(rec.date).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-medium border",
                                                                rec.type === 'revenue' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-red-500/10 border-red-500/20 text-red-600"
                                                            )}>
                                                                {rec.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                                            {rec.method}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", rec.status === 'cleared' ? "bg-emerald-500" : "bg-amber-500")} />
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{rec.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className={cn("px-4 py-3 text-right font-semibold text-sm", rec.type === 'revenue' ? 'text-emerald-500' : 'text-red-500')}>
                                                            {rec.type === 'revenue' ? '+' : '-'}{rec.amount} DH
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'financials', data: rec })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('financials', rec.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'history' && (
                            <section className="space-y-4 flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Event Ledger</h2>
                                    <div className="flex gap-1">
                                        {['All', 'Session', 'Order', 'Finance'].map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setHistoryFilter(filter)}
                                                className={cn(
                                                    "h-6 rounded px-2 text-[10px] font-medium transition-colors border",
                                                    historyFilter === filter
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                                                )}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden flex-1 relative shadow-sm">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Activity Details</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Telemetry</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {historyData
                                                    .filter(rec => historyFilter === 'All' || rec.category === historyFilter)
                                                    .filter(rec => !searchTerm || rec.detail.toLowerCase().includes(searchTerm.toLowerCase()) || rec.info.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((rec, index) => (
                                                        <tr key={index} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                                        rec.category === 'Session' ? "bg-primary" :
                                                                            rec.category === 'Order' ? "bg-amber-500" : "bg-emerald-500"
                                                                    )} />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{rec.category}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="font-semibold text-xs text-foreground">{rec.detail}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 text-foreground">
                                                                    {rec.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-[10px] text-muted-foreground">{rec.info}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <p className="text-[10px] font-medium text-foreground">
                                                                    {new Date(rec.date).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                    {new Date(rec.date).toLocaleTimeString()}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'games' && (
                            <section className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* Gaming Tables Pane */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-4">
                                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gaming Tables</h2>
                                            <Button 
                                                variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                                                onClick={() => setShowModal({ type: 'gaming-tables', data: null })}
                                            >
                                                <Plus size={14} /> Add Table
                                            </Button>
                                        </div>
                                        <div className="border border-border bg-card rounded-md overflow-hidden relative shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                        <tr>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Number</th>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Category</th>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {gamingTables.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(table => (
                                                            <tr key={table.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-semibold text-xs text-foreground">{table.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{table.club}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 text-foreground">
                                                                        #{table.number}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 border border-primary/20 text-primary">
                                                                        {table.game_type_name || 'General'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'gaming-tables', data: table })}>
                                                                            <Edit size={12} />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('gaming-tables', table.id)}>
                                                                            <Trash2 size={12} />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Game Types Pane */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-4">
                                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Game Categories</h2>
                                            <Button 
                                                variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                                                onClick={() => setShowModal({ type: 'game-types', data: null })}
                                            >
                                                <Plus size={14} /> Add Category
                                            </Button>
                                        </div>
                                        <div className="border border-border bg-card rounded-md overflow-hidden relative shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="sticky top-0 z-10 bg-muted/80 border-b border-border">
                                                        <tr>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Stations</th>
                                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {gameTypes.filter(g => !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(gt => (
                                                            <tr key={gt.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-semibold text-xs text-foreground">{gt.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground line-clamp-1">{gt.description || 'No specs'}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 text-foreground">
                                                                        {gt.station_count}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'game-types', data: gt })}>
                                                                            <Edit size={12} />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('game-types', gt.id)}>
                                                                            <Trash2 size={12} />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'settings' && (
                            <section className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <SessionSettingsPanel
                                    isDark={isDark}
                                    sessionConfig={sessionConfig}
                                    savingConfig={savingConfig}
                                    onFetch={fetchSessionConfig}
                                    onSave={handleSaveSessionConfig}
                                />
                            </section>
                        )}
                        {activeTab === 'admins' && (
                            <section className="space-y-4">
                                <div className="flex justify-between items-center px-4">
                                    <div />
                                    <Button
                                        onClick={() => setShowModal({ type: 'admins', data: null })}
                                        variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                                    >
                                        <Plus size={14} /> Provision New Node
                                    </Button>
                                </div>
                                <div className="border border-border bg-card rounded-md overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/80 border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Administrator</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Auth Level</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {admins.map(admin => (
                                                <tr key={admin.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {admin.username[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-xs text-foreground">{admin.username}</p>
                                                                <p className="text-[10px] text-muted-foreground">Registered Node</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                                            admin.admin_level === 'super_admin' ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
                                                        )}>
                                                            {admin.admin_level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-md" onClick={() => setShowModal({ type: 'admins', data: admin })}>
                                                                <Edit size={12} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md" onClick={() => handleDelete('admins', admin.id)}>
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                        </>
                        )}          </main>
                </div>
            )}

            {/* Simple Modal Implementation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 text-foreground">
                    <Card className="w-full max-w-xl bg-card border border-border rounded-md p-6 relative text-foreground">
                        <button className="absolute top-6 right-6 text-muted-foreground hover:text-foreground" onClick={() => setShowModal(null)}>
                            <XCircle size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6">
                            {showModal.data ? 'Update' : 'Create'} {showModal.type.replace(/^\w/, (c: any) => c.toUpperCase())}
                        </h2>

                        <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            const data = Object.fromEntries(fd.entries())
                            const url = showModal.data
                                ? `/api/sys-admin/${showModal.type}/${showModal.data.id}`
                                : `/api/sys-admin/${showModal.type}`

                            fetchWithAuth(url, {
                                method: showModal.data ? 'PUT' : 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            }).then(() => {
                                setShowModal(null)
                                fetchAllData()
                            })
                        }}>
                            {showModal.type === 'menu' && (
                                <div className="space-y-3">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Item Name" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <input name="image_path" defaultValue={showModal.data?.image_path} placeholder="Image Path / URL (Optional)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <textarea name="description" defaultValue={showModal.data?.description} placeholder="Description" className="w-full bg-background border border-border rounded-md h-20 p-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="price" defaultValue={showModal.data?.price} placeholder="Price (DH)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                        <input
                                            name="category"
                                            defaultValue={showModal.data?.category}
                                            placeholder="Category"
                                            list="category-suggestions"
                                            className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'waiters' && (
                                <div className="space-y-3">
                                    <input name="full_name" defaultValue={showModal.data?.full_name} placeholder="Full Name" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="role" defaultValue={showModal.data?.role || 'waiter'} placeholder="Role (waiter/manager/comptable)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                        <input name="phone" defaultValue={showModal.data?.phone} placeholder="Phone" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <input name="email" defaultValue={showModal.data?.email} placeholder="Email" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="active">Active</option>
                                            <option value="off_duty">Off Duty</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'clients' && (
                                <div className="space-y-3">
                                    <input name="full_name" defaultValue={showModal.data?.full_name} placeholder="Full Name" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="email" defaultValue={showModal.data?.email} placeholder="Email" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                        <input name="phone" defaultValue={showModal.data?.phone} placeholder="Phone" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <input name="password" type="password" placeholder="Account Password (Secure Hashing)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                </div>
                            )}

                            {showModal.type === 'sessions' && (
                                <div className="space-y-3">
                                    <input name="daily_number" defaultValue={showModal.data?.daily_number} placeholder="Queue Number" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="waiting">Waiting</option>
                                            <option value="playing">Playing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'orders' && (
                                <div className="space-y-3">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Order Detail" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <input name="price" defaultValue={showModal.data?.price} placeholder="Total Price" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="pending">Pending</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="served">Served</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'financials' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="amount" defaultValue={showModal.data?.amount} placeholder="Amount (DH)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                        <select name="record_type" defaultValue={showModal.data?.type || 'revenue'} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="revenue">Revenue (+)</option>
                                            <option value="expense">Expense (-)</option>
                                            <option value="payout">Staff Payout</option>
                                        </select>
                                    </div>
                                    <select name="payment_method" defaultValue={showModal.data?.method || 'cash'} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                        <option value="cash">Cash</option>
                                        <option value="card">Card / POS</option>
                                        <option value="transfer">Bank Transfer</option>
                                    </select>
                                    <textarea name="note" defaultValue={showModal.data?.note} placeholder="Comptable Note / Audit Trail" className="w-full bg-background border border-border rounded-md h-20 p-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                </div>
                            )}

                            {showModal.type === 'game-types' && (
                                <div className="space-y-3">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Game Name (e.g., PS5, Billiard)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="station_count" type="number" min="1" defaultValue={showModal.data?.station_count} placeholder="Number of Stations" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                                        <input name="image_path" defaultValue={showModal.data?.image_path} placeholder="Cover Image URL (Optional)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <textarea name="description" defaultValue={showModal.data?.description} placeholder="Game Requirements / Specifications" className="w-full bg-background border border-border rounded-md h-20 p-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                </div>
                            )}

                            {showModal.type === 'gaming-tables' && (
                                <div className="space-y-3">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Table Name (e.g., Billiards Table Alpha)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="number" type="number" min="1" defaultValue={showModal.data?.number} placeholder="Table Number (e.g., 1, 2)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                                        <input name="club" defaultValue={showModal.data?.club || 'CueClub'} placeholder="Club (e.g., CueClub)" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <div className="relative group">
                                        <select name="game_type_id" defaultValue={showModal.data?.game_type_id || ''} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="">Select Game Category</option>
                                            {gameTypes.map(gt => (
                                                <option key={gt.id} value={gt.id}>{gt.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'admins' && (
                                <div className="space-y-3">
                                    <input name="username" defaultValue={showModal.data?.username} placeholder="Administrator Node Identifier" className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                                    <div className="relative group">
                                        <select name="admin_level" defaultValue={showModal.data?.admin_level || 'simple_admin'} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value="super_admin">Super Administrator (Full Root)</option>
                                            <option value="simple_admin">Simple Administrator (Ops Only)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                    </div>
                                    <input name="password" type="password" placeholder={showModal.data ? "New Access Key (Leave blank to keep same)" : "Initial Access Key"} className="w-full bg-background border border-border rounded-md h-10 px-3 font-normal text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required={!showModal.data} />
                                </div>
                            )}

                            <Button className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm">
                                {showModal.data ? 'Update System Record' : 'Commit New Entry'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Winner Selection Modal */}
            {winnerModal && (
                <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6 text-foreground">
                    <Card className="w-full max-w-md bg-card border border-border rounded-md p-6 relative text-foreground shadow-sm">
                        <button className="absolute top-6 right-6 text-muted-foreground hover:text-foreground" onClick={() => setWinnerModal(null)}>
                            <XCircle size={20} />
                        </button>
                        <div className="text-center space-y-6">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-md flex items-center justify-center mx-auto border border-amber-500/20 text-amber-500">
                                <Award size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Crown the Winner</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {winnerModal.client} vs {winnerModal.opponent} — {winnerModal.table}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, winnerModal.client_id!)}
                                    disabled={settingWinner}
                                    className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
                                >
                                    {settingWinner ? <Loader2 size={16} className="animate-spin mr-2" /> : <Award size={16} className="mr-2" />}
                                    {winnerModal.client} Wins
                                </Button>
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, winnerModal.opponent_id!)}
                                    disabled={settingWinner}
                                    className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
                                >
                                    {settingWinner ? <Loader2 size={16} className="animate-spin mr-2" /> : <Award size={16} className="mr-2" />}
                                    {winnerModal.opponent} Wins
                                </Button>
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, null)}
                                    disabled={settingWinner}
                                    variant="outline"
                                    className="w-full h-10 rounded-md font-medium text-sm border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Draw / No Winner
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value, icon: Icon, trend, isDark }: any) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-md border border-border bg-card flex-1">
            <div className="w-10 h-10 rounded-md flex items-center justify-center text-primary bg-primary/10 shrink-0">
                <Icon size={20} />
            </div>
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
                    {trend && (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 leading-none">{trend}</span>
                    )}
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground leading-none">{value}</h3>
            </div>
        </div>
    )
}

const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.01);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(234, 88, 12, 0.3);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(234, 88, 12, 0.6);
    }
    /* Firefox */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(234, 88, 12, 0.3) rgba(255, 255, 255, 0.01);
    }
`;

if (typeof document !== 'undefined') {
    const styleId = 'cueclub-scrollbar-style';
    if (!document.getElementById(styleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.innerHTML = customScrollbarStyles;
        document.head.appendChild(styleTag);
    }
}

function SessionSettingsPanel({ isDark, sessionConfig, savingConfig, onFetch, onSave }: any) {
    useEffect(() => {
        onFetch()
    }, [])

    const [adminHours, setAdminHours] = useState(sessionConfig?.admin_session_hours || 6)
    const [screenHours, setScreenHours] = useState(sessionConfig?.screen_session_hours || 12)
    const [userHours, setUserHours] = useState(sessionConfig?.user_session_hours || 24)

    useEffect(() => {
        if (sessionConfig) {
            setAdminHours(sessionConfig.admin_session_hours)
            setScreenHours(sessionConfig.screen_session_hours)
            setUserHours(sessionConfig.user_session_hours)
        }
    }, [sessionConfig])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(adminHours, screenHours, userHours)
    }

    return (
        <div className="max-w-4xl mx-auto mt-6 px-4">
            <Card className="rounded-md border border-border bg-card text-foreground shadow-sm relative overflow-hidden">
                <CardHeader className="pb-6 relative">
                    <CardTitle className="text-xl font-bold tracking-tight">Session Lifecycle</CardTitle>
                    <CardDescription className="text-xs text-primary font-medium tracking-wider">Global Timeout Configuration</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-md border border-border bg-muted/30 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Lock size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">Admin Control Panel</h3>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Duration before forced logout</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-xl text-primary shrink-0">{adminHours}h</div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.5" max="24" step="0.5" 
                                        value={adminHours} 
                                        onChange={e => setAdminHours(parseFloat(e.target.value))}
                                        className="w-full accent-primary h-1 bg-muted rounded-md appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground mt-2">
                                    <span>30 min</span>
                                    <span>24 hours</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-md border border-border bg-muted/30 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                                <Gamepad2 size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">Screen Display Client</h3>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Duration before screen resets</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-xl text-blue-500 shrink-0">{screenHours}h</div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" max="168" step="1" 
                                        value={screenHours} 
                                        onChange={e => setScreenHours(parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-muted rounded-md appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground mt-2">
                                    <span>1 hour</span>
                                    <span>1 week</span>
                                </div>
                            </div>
                        </div>

                        {/* User / Member Session Duration */}
                        <div className="p-4 rounded-md border border-border bg-muted/30 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground">Member Login Session</h3>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Duration before user must re-login</p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-xl text-emerald-500 shrink-0">{userHours}h</div>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" max="168" step="0.5" 
                                    value={userHours} 
                                    onChange={e => setUserHours(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500 h-1 bg-muted rounded-md appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-medium text-muted-foreground mt-2">
                                <span>30 min</span>
                                <span>1 week</span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={savingConfig || (sessionConfig?.admin_session_hours === adminHours && sessionConfig?.screen_session_hours === screenHours && sessionConfig?.user_session_hours === userHours)}
                            className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                        >
                            {savingConfig ? 'Committing Changes...' : 'Save Configuration'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

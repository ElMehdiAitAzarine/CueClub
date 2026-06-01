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
    Timer
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
    device_id: string;
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
        <div className={cn("h-screen flex overflow-hidden relative font-['Outfit'] items-center justify-center transition-colors duration-500", isDark ? 'dark bg-[#050505] text-white' : 'light-mode bg-[#F7F5F0] text-[#1A1A1A]')}>
            {/* Global Background Aesthetic */}
            <div className="absolute inset-0 z-0 transition-opacity duration-500">
                {isDark ? (
                    <>
                        <img
                            src="/images/bg_billiardo.jpg"
                            alt="Billiards Background"
                            className="w-full h-full object-cover"
                        />
                        {/* Balanced Darkness & Shadowing as in Home Page */}
                        <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/80" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#EFECE5] via-[#F7F5F0] to-[#FAF9F5]" />
                )}
            </div>

            {!isLoggedIn ? (
                <Card className={cn("w-full max-w-[400px] rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl relative z-10", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white/70 border-[#D5D0C8]')}>
                    <div className="space-y-8">
                        <div className="text-center space-y-3 relative">
                            <div className="absolute top-0 right-0 flex gap-2">
                                <LanguageToggle />
                                <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                            </div>
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/30">
                                <Lock className="text-primary" size={32} />
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Admin Portal</h1>
                            <p className="text-[#888] text-[9px] font-black uppercase tracking-widest">Master Control Access</p>
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
                                    className={cn("w-full h-12 rounded-xl px-6 font-bold focus:outline-none focus:border-primary/50 transition-all text-sm border-none focus-visible:ring-1", isDark ? 'bg-white/5 text-white' : 'bg-[#E8E4DC] text-[#1A1A1A]')}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className={cn("w-full h-12 rounded-xl px-6 font-bold focus:outline-none focus:border-primary/50 transition-all text-sm border-none focus-visible:ring-1", isDark ? 'bg-white/5 text-white' : 'bg-[#E8E4DC] text-[#1A1A1A]')}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-primary text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'System Unlock'}
                            </Button>
                        </form>
                    </div>
                </Card>
            ) : (
                 <div className="w-full h-full flex overflow-hidden relative z-10">
                    {/* Sidebar */}
                    <aside className={cn("w-72 border-r p-6 flex flex-col hidden lg:flex relative shrink-0 transition-all duration-300", isDark ? 'bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl' : 'bg-[#EFECE5]/80 backdrop-blur-3xl border-[#D5D0C8] shadow-lg shadow-black/5')}>
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                <span className="text-black font-black text-xl">C</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tighter italic leading-none">CueClub</h2>
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Admin Suite v2.1</span>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
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
                                        { id: 'games', icon: Gamepad2, label: t('admin.tableSetup', 'Table Setup'), level: 'simple_admin' },
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
                                <div key={idx} className="space-y-2">
                                    <h3 className="px-6 text-[8px] font-black uppercase tracking-[0.3em] text-primary/70 mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
                                        {section.group}
                                    </h3>
                                    <div className="space-y-1">
                                        {visibleItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id as Tab)}
                                                className={cn(
                                                    "w-full h-11 rounded-xl px-6 flex items-center gap-4 font-black uppercase tracking-widest text-[9px] transition-all group/nav",
                                                    activeTab === item.id
                                                        ? "bg-primary text-black shadow-lg shadow-primary/40 scale-[1.02] z-10"
                                                        : isDark ? "text-white/70 hover:bg-white/[0.05] hover:text-white" : "text-[#4A4540]/80 hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
                                                )}
                                            >
                                                <item.icon size={14} className={cn(
                                                    "transition-all duration-300",
                                                    activeTab === item.id
                                                        ? "scale-110 text-black"
                                                        : "text-primary group-hover/nav:scale-110 group-hover/nav:text-primary"
                                                )} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                )
                            })}
                        </nav>

                        {sessionRemaining && (
                            <div className={cn("rounded-xl px-4 py-3 mb-3 flex items-center gap-3 border", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#E8E4DC]/50 border-[#D5D0C8]')}>
                                <Timer size={14} className="text-primary shrink-0" />
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Session Expires</p>
                                    <p className="text-sm font-black text-primary">{sessionRemaining}</p>
                                </div>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="h-12 rounded-xl px-6 justify-start gap-4 font-black uppercase tracking-widest text-[10px] text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                        >
                            <LogOut size={16} />
                            Logout
                        </Button>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6 overflow-hidden flex flex-col relative gap-4">
                        <header className="flex justify-between items-end shrink-0">
                            <div>
                                <h1 className={cn("text-2xl font-black uppercase tracking-tighter italic mb-0.5", isDark ? 'text-white' : 'text-[#1A1A1A]')}>
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
                                <div className="flex items-center gap-3">
                                    <p className="text-primary font-black tracking-[0.4em] uppercase text-[7px] italic opacity-80">{t('admin.adminCommandNode', 'Admin Command Node')}</p>
                                    {dataLoading && (
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border transition-all duration-300 animate-pulse",
                                            isDark 
                                                ? "bg-primary/10 border-primary/20 text-primary" 
                                                : "bg-[#E8E4DC] border-[#D5D0C8] text-[#1A1A1A]"
                                        )}>
                                            <Loader2 className="animate-spin text-primary" size={8} />
                                            Syncing Vault...
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <LanguageToggle />
                                <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
                                <div className={cn("rounded-lg h-8 px-4 flex items-center gap-3 min-w-[240px] focus-within:border-primary/50 transition-all backdrop-blur-md", isDark ? 'bg-white/5 border border-white/10 shadow-xl' : 'bg-white border border-[#D5D0C8] shadow-sm shadow-black/5')}>
                                    <Search size={12} className="text-muted-foreground" />
                                    <input
                                        placeholder="Intelligence Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={cn("bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest flex-1", isDark ? 'text-white placeholder:text-white/20' : 'text-[#1A1A1A] placeholder:text-[#B0AAA0]')}
                                    />
                                </div>
                            </div>
                        </header>
                        {!hasFetched ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background animate-ping" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-sm font-black uppercase tracking-wider">Establishing Database Link...</h3>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Securing telemetric handshake with remote node</p>
                                </div>
                            </div>
                        ) : (
                            <>
                        {activeTab === 'dashboard' && (
                            <div className="flex-1 flex flex-col min-h-0 gap-6">
                                <div className={cn("flex items-center justify-between gap-4 shrink-0 px-8 py-4 border rounded-[2.5rem] backdrop-blur-2xl mx-2 relative overflow-hidden group/stats transition-all duration-300", isDark ? 'bg-white/[0.03] border-white/10 shadow-2xl' : 'bg-[#EFECE5]/80 border-[#D5D0C8] shadow-lg shadow-black/5')}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-700" />
                                    <StatCard label="Active Reach" value={clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)).length} icon={Users} trend="+3 mem" isDark={isDark} />
                                    <div className={cn("w-px h-12 hidden md:block", isDark ? 'bg-white/10' : 'bg-[#D5D0C8]')} />
                                    <StatCard label="Live Game" value={sessions.filter(s => s.status === 'playing' && (!searchTerm || s.table_name?.toLowerCase().includes(searchTerm.toLowerCase()))).length} icon={Clock} trend="Active" isDark={isDark} />
                                    <div className={cn("w-px h-12 hidden md:block", isDark ? 'bg-white/10' : 'bg-[#D5D0C8]')} />
                                    <StatCard label="Staff On" value={waiters.filter(w => w.status === 'active').length} icon={Zap} trend="Optimized" isDark={isDark} />
                                    <div className={cn("w-px h-12 hidden md:block", isDark ? 'bg-white/10' : 'bg-[#D5D0C8]')} />
                                    <StatCard label="Revenue" value={`${financials.filter(f => !searchTerm || f.order_details?.toLowerCase().includes(searchTerm.toLowerCase())).reduce((s, o) => s + parseFloat((o.amount as string) || '0'), 0)} DH`} icon={DollarSign} trend="+12%" isDark={isDark} />
                                </div>

                                <Card className={cn("rounded-[1.5rem] px-6 py-2 border-none flex-1 overflow-hidden flex flex-col min-h-0 backdrop-blur-xl transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5 shadow-2xl' : 'bg-[#EFECE5]/80 border-[#D5D0C8]/60 shadow-lg shadow-black/5')}>
                                    <CardHeader className="px-0 pt-0 pb-2 flex flex-row items-center justify-between shrink-0">
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tighter italic">Recent Activity</CardTitle>

                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary">Live Feed</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-0 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-3">
                                            {orders.slice(0, 5).map(order => (
                                                <div key={order.id} className={cn("rounded-xl p-5 flex items-center justify-between border transition-all duration-300", isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-white/80 border-[#E5E1D8] hover:bg-[#FAF9F5]')}>
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                                            <Zap size={20} />
                                                        </div>
                                                        <div>
                                                            <p className={cn("font-black uppercase tracking-tight text-base", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{order.name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{order.customer} • {order.table}</p>
                                                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                                    {order.waiter}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-primary">{order.price} DH</p>
                                                        <p className={cn("text-[9px] font-black uppercase", isDark ? 'text-muted-foreground' : 'text-[#8A857E]')}>{new Date(order.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'menu' && (
                            <section className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className={cn("text-lg font-black uppercase italic", isDark ? 'text-white/40' : 'text-[#1A1A1A]/50')}>Item Repository</h2>
                                    <Button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black font-black uppercase tracking-widest rounded-xl px-4 h-8 text-[9px] transition-all" onClick={() => setShowModal({ type: 'menu' })}>
                                        <Plus className="mr-2" size={12} /> Add New Item
                                    </Button>
                                </div>
                                <div className={cn("border rounded-[2.5rem] overflow-hidden flex-1 relative transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md border-b", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                <tr>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>ID</th>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Detail</th>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Category</th>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Score</th>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Price</th>
                                                    <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {menu.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                                    <tr key={item.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className={cn("px-8 py-6 font-black text-xs italic", isDark ? 'text-white/20' : 'text-[#8A857E]')}>#{item.id}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center italic font-black transition-colors", isDark ? 'bg-white/5 text-white/10 group-hover:text-primary' : 'bg-white border border-[#D5D0C8] text-[#8A857E] group-hover:text-primary')}>
                                                                    {item.name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className={cn("font-black uppercase tracking-tight", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{item.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[300px] italic">{item.description}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex justify-center">
                                                                <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-[#D5D0C8]')}>
                                                                    {item.category}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="text-sm font-black text-primary italic">★ {item.popularity}</span>
                                                        </td>
                                                        <td className={cn("px-8 py-6 text-right font-black text-xl", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{item.price} <span className={cn("text-xs", isDark ? 'text-white/40' : 'text-[#8A857E]')}>DH</span></td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-10 w-10 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'menu', data: item })}>
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-10 w-10 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('menu', item.id)}>
                                                                    <Trash2 size={14} />
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
                            <section className="space-y-6 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className={cn("text-xl font-black uppercase italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Personnel Node</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-10 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'waiters' })}>
                                        <Plus className="mr-2" size={14} /> Recruit Staff
                                    </Button>
                                </div>
                                <div className={cn("border rounded-[2rem] overflow-hidden flex-1 relative transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md border-b", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                <tr>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Staff Name</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Identity / Role</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Status</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Current Load</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {waiters.map(waiter => (
                                                    <tr key={waiter.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", isDark ? 'bg-white/5 border-white/10 group-hover:bg-primary/20 group-hover:border-primary/50' : 'bg-white border-[#D5D0C8] group-hover:bg-primary/10 group-hover:border-primary/50')}>
                                                                    <Users className={cn("group-hover:text-primary", isDark ? 'text-white/20' : 'text-[#8A857E]')} size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className={cn("font-black uppercase tracking-tight text-sm", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{waiter.full_name}</p>
                                                                    <p className={cn("text-[9px] font-bold uppercase tracking-widest italic", isDark ? 'text-white/30' : 'text-[#8A857E]')}>Member #{waiter.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary/80", isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-[#D5D0C8]')}>
                                                                {waiter.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn("w-2 h-2 rounded-full", waiter.status === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/50' : 'text-[#4A4540]')}>{waiter.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className={cn("w-20 h-1.5 rounded-full overflow-hidden border", isDark ? 'bg-white/5 border-white/5' : 'bg-[#D5D0C8] border-[#C5BFB5]')}>
                                                                    <div
                                                                        className={cn("h-full transition-all duration-1000", waiter.current_load > 3 ? "bg-red-500" : "bg-primary")}
                                                                        style={{ width: `${Math.min(100, (waiter.current_load / 5) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className={cn("text-[9px] font-black uppercase", isDark ? 'text-white/40' : 'text-[#6B6560]')}>{waiter.current_load} Orders Active</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className={cn("rounded-xl h-8 w-8 hover:bg-primary hover:text-black", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')} onClick={() => setShowModal({ type: 'waiters', data: waiter })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-8 w-8 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('waiters', waiter.id)}>
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
                             <section className="h-full flex flex-col space-y-6">
                                 <div className="flex justify-between items-center shrink-0">
                                     <h2 className={cn("text-xl font-black uppercase italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Command Stream</h2>
                                     <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{orders.length} Active Records</p>
                                 </div>
                                 <div className={cn("rounded-[2rem] p-6 border-none flex-1 overflow-y-auto relative custom-scrollbar transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5 shadow-2xl' : 'bg-[#EFECE5]/85 border-[#D5D0C8] shadow-lg shadow-black/5')}>
                                     <div className="absolute inset-0 p-6 space-y-4">
                                         {orders.filter(o => !searchTerm || o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer?.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                                             <div key={order.id} className={cn("rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border transition-all gap-6 group duration-300", isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-[#E5E1D8] hover:bg-[#FAF9F5]')}>
                                                 <div className="flex items-center gap-6 w-full md:w-auto">
                                                     <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border italic font-black text-lg", isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-[#FAF9F5] border-[#D5D0C8] text-[#8A857E]')}>
                                                         {order.customer?.charAt(0) || '?'}
                                                     </div>
                                                    <div>
                                                        <p className={cn("text-lg font-black uppercase tracking-tight", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{order.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic">{order.customer}</span>
                                                            <span className={isDark ? 'text-white/10' : 'text-[#D5D0C8]'}>•</span>
                                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#6B6560]')}>{order.table}</span>
                                                            <span className={isDark ? 'text-white/10' : 'text-[#D5D0C8]'}>•</span>
                                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                                Responsible: {order.waiter}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <p className={cn("text-2xl font-black", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{order.price} DH</p>
                                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/30' : 'text-[#8A857E]')}>{new Date(order.created_at).toLocaleTimeString()}</p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <div className={cn(
                                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border text-center min-w-[100px]",
                                                            order.status === 'served' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                                                order.status === 'preparing' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                                                    order.status === 'pending' ? "bg-primary/10 border-primary/30 text-primary" : "bg-red-500/10 border-red-500/30 text-red-500"
                                                        )}>
                                                            {order.status}
                                                        </div>

                                                        <div className="flex gap-1">
                                                            {order.status !== 'served' && order.status !== 'cancelled' && (
                                                                <>
                                                                    {order.status === 'pending' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg"
                                                                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                                                        >
                                                                            <Clock size={12} />
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg"
                                                                        onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                                                                    >
                                                                        <CheckCircle size={12} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg hover:bg-primary hover:text-black opacity-0 group-hover:opacity-100 transition-opacity", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')} onClick={() => setShowModal({ type: 'orders', data: order })}>
                                                                <Edit size={10} />
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
                            <section className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className={cn("text-xl font-black uppercase italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Member Registry</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'clients' })}>
                                        <Plus className="mr-2" size={14} /> Register Member
                                    </Button>
                                </div>
                                <div className={cn("border rounded-[2.5rem] overflow-hidden flex-1 relative", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md", isDark ? 'bg-white/5' : 'bg-[#E8E4DC]')}>
                                                <tr>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>ID</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Client Profile</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Contact</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Device Fingerprint</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))).map(client => (
                                                    <tr key={client.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className={cn("px-8 py-6 font-black text-xs italic", isDark ? 'text-white/20' : 'text-[#8A857E]')}>#{client.id}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border italic font-black", isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-white border border-[#D5D0C8] text-[#8A857E]')}>
                                                                    {client.full_name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className={cn("font-black uppercase tracking-tight", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{client.full_name}</p>
                                                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest italic", isDark ? 'text-white/30' : 'text-[#8A857E]')}>Verified User</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <p className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{client.email || 'NO EMAIL'}</p>
                                                            <p className={cn("text-[10px] font-bold mt-1", isDark ? 'text-white/40' : 'text-[#6B6560]')}>{client.phone || 'NO PHONE'}</p>
                                                        </td>
                                                        <td className={cn("px-8 py-6 text-center text-[8px] font-mono", isDark ? 'text-white/30' : 'text-[#8A857E]')}>
                                                            {client.device_id?.substring(0, 16) || 'UNLINKED NODE'}...
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className={cn("rounded-xl h-10 w-10 hover:bg-primary hover:text-black", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')} onClick={() => setShowModal({ type: 'clients', data: client })}>
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-10 w-10 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('clients', client.id)}>
                                                                    <Trash2 size={14} />
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
                            <section className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className={cn("text-xl font-black uppercase italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Pool Command</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'sessions' })}>
                                        <Plus className="mr-2" size={14} /> New Session
                                    </Button>
                                </div>
                                <div className={cn("border rounded-[2.5rem] overflow-hidden flex-1 relative", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md", isDark ? 'bg-white/5' : 'bg-[#E8E4DC]')}>
                                                <tr>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Queue</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Member</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Opponent</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Table</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Status</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Initiated</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {sessions.filter(s => !searchTerm || s.client?.toLowerCase().includes(searchTerm.toLowerCase()) || s.table?.toLowerCase().includes(searchTerm.toLowerCase())).map(session => (
                                                    <tr key={session.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className="px-8 py-6 font-black text-primary text-xl italic">#{session.daily_number}</td>
                                                        <td className="px-8 py-6">
                                                            <p className={cn("font-black uppercase tracking-tight", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{session.client}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {session.opponent ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px]">⚔️</span>
                                                                    <p className={cn("font-bold uppercase tracking-tight text-xs", isDark ? 'text-white/70' : 'text-[#4A4540]')}>{session.opponent}</p>
                                                                </div>
                                                            ) : (
                                                                <span className={cn("text-[10px] uppercase tracking-widest", isDark ? 'text-white/20' : 'text-[#8A857E]')}>Solo</span>
                                                            )}
                                                            {session.winner && (
                                                                <p className="text-[9px] text-amber-500 font-black uppercase mt-1">👑 {session.winner}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="px-4 py-1.5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                                {session.table}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className={cn(
                                                                    "w-2 h-2 rounded-full",
                                                                    session.status === 'playing' ? "bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" :
                                                                        session.status === 'waiting' ? "bg-amber-400" : "bg-red-500"
                                                                )} />
                                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/50' : 'text-[#6B6560]')}>{session.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <p className={cn("text-[10px] font-bold uppercase", isDark ? 'text-white/40' : 'text-[#8A857E]')}>{new Date(session.created_at).toLocaleTimeString()}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {session.opponent && session.status === 'playing' && !session.winner && (
                                                                    <Button variant="ghost" size="icon" className="bg-amber-500/10 text-amber-500 rounded-xl h-10 w-10 hover:bg-amber-500 hover:text-black" onClick={() => setWinnerModal(session)} title="Crown Winner">
                                                                        <Award size={14} />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className={cn("rounded-xl h-10 w-10 hover:bg-primary hover:text-black", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')} onClick={() => setShowModal({ type: 'sessions', data: session })}>
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-10 w-10 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('sessions', session.id)}>
                                                                    <Trash2 size={14} />
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
                            <section className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <h2 className={cn("text-xl font-black uppercase italic", isDark ? 'text-white' : 'text-[#1A1A1A]')}>Audit Ledger</h2>
                                    <Button className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-emerald-500 hover:text-black transition-all" onClick={() => setShowModal({ type: 'financials' })}>
                                        <Plus className="mr-2" size={14} /> Post Record
                                    </Button>
                                </div>
                                <div className={cn("border rounded-[2rem] overflow-hidden flex-1 relative", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md", isDark ? 'bg-white/5' : 'bg-[#E8E4DC]')}>
                                                <tr>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Reference</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Type</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Method</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Status</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Amount</th>
                                                    <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {financials.filter(f => !searchTerm || f.order?.toLowerCase().includes(searchTerm.toLowerCase()) || f.note?.toLowerCase().includes(searchTerm.toLowerCase())).map(rec => (
                                                    <tr key={rec.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className="px-6 py-4">
                                                            <p className={cn("font-black uppercase tracking-tight text-xs", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{rec.order}</p>
                                                            <p className="text-[8px] text-muted-foreground font-black uppercase">{new Date(rec.date).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                                                rec.type === 'revenue' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                            )}>
                                                                {rec.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]')}>{rec.method}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", rec.status === 'cleared' ? "bg-emerald-500" : "bg-amber-500")} />
                                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]')}>{rec.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className={cn("px-6 py-4 text-right font-black", isDark ? 'text-white' : 'text-[#1A1A1A]')}>
                                                            {rec.type === 'revenue' ? '+' : '-'}{rec.amount} DH
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className={cn("rounded-xl h-8 w-8 hover:bg-primary hover:text-black", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')} onClick={() => setShowModal({ type: 'financials', data: rec })}>
                                                                    <Edit size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-8 w-8 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('financials', rec.id)}>
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
                                    <h2 className={cn("text-lg font-black uppercase italic", isDark ? 'text-white/40' : 'text-[#1A1A1A]/50')}>System Event Ledger</h2>
                                    <div className="flex gap-2">
                                        {['All', 'Session', 'Order', 'Finance'].map(filter => (
                                            <Button
                                                key={filter}
                                                onClick={() => setHistoryFilter(filter)}
                                                className={cn(
                                                    "h-8 rounded-xl px-4 font-black uppercase tracking-widest text-[9px] transition-all",
                                                    historyFilter === filter
                                                        ? "bg-primary text-black shadow-lg shadow-primary/30"
                                                        : isDark ? "bg-white/5 text-white/50 hover:text-white hover:bg-white/10" : "bg-white border border-[#D5D0C8] text-[#1A1A1A]/70 hover:bg-[#E8E4DC]"
                                                )}
                                            >
                                                {filter}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className={cn("border rounded-[2.5rem] overflow-hidden flex-1 relative transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className={cn("sticky top-0 z-10 backdrop-blur-md border-b", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                <tr>
                                                    <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Category</th>
                                                    <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Activity Details</th>
                                                    <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Status</th>
                                                    <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Telemetry</th>
                                                    <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                {historyData
                                                    .filter(rec => historyFilter === 'All' || rec.category === historyFilter)
                                                    .filter(rec => !searchTerm || rec.detail.toLowerCase().includes(searchTerm.toLowerCase()) || rec.info.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((rec, index) => (
                                                        <tr key={index} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-2.5 h-2.5 rounded-full shadow-lg shrink-0",
                                                                        rec.category === 'Session' ? "bg-primary shadow-primary/50" :
                                                                            rec.category === 'Order' ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                                                                    )} />
                                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white/80' : 'text-black')}>{rec.category}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className={cn("font-black uppercase tracking-tight text-xs", isDark ? "text-white" : "text-black")}>{rec.detail}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={cn("px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all", isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-[#FAF9F5] border-[#C5BFB5] text-black')}>
                                                                    {rec.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]')}>{rec.info}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <p className={cn("text-[9px] font-black uppercase", isDark ? 'text-white/40' : 'text-[#5C564F]')}>
                                                                    {new Date(rec.date).toLocaleDateString()}
                                                                </p>
                                                                <p className={cn("text-[10px] font-black italic", isDark ? "text-white/80" : "text-black")}>
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
                            <section className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {/* Gaming Tables Pane */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-4">
                                            <h2 className={cn("text-lg font-black uppercase italic", isDark ? 'text-white/40' : 'text-[#1A1A1A]/50')}>Gaming Tables</h2>
                                            <Button 
                                                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black font-black uppercase tracking-widest rounded-xl px-4 h-8 text-[9px] transition-all"
                                                onClick={() => setShowModal({ type: 'gaming-tables', data: null })}
                                            >
                                                <Plus className="mr-2" size={12} /> Add Table
                                            </Button>
                                        </div>
                                        <div className={cn("border rounded-[2.5rem] overflow-hidden backdrop-blur-md relative transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className={cn("border-b", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                        <tr>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Name</th>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Number</th>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Category</th>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                        {gamingTables.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(table => (
                                                            <tr key={table.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className={cn("font-black uppercase tracking-tight text-xs", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{table.name}</p>
                                                                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{table.club}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-white border-[#D5D0C8]')}>
                                                                        #{table.number}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="text-[9px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                                        {table.game_type_name || 'General'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-8 w-8 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'gaming-tables', data: table })}>
                                                                            <Edit size={12} />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-8 w-8 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('gaming-tables', table.id)}>
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
                                            <h2 className={cn("text-lg font-black uppercase italic", isDark ? 'text-white/40' : 'text-[#1A1A1A]/50')}>Game Categories</h2>
                                            <Button 
                                                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black font-black uppercase tracking-widest rounded-xl px-4 h-8 text-[9px] transition-all"
                                                onClick={() => setShowModal({ type: 'game-types', data: null })}
                                            >
                                                <Plus className="mr-2" size={12} /> Add Category
                                            </Button>
                                        </div>
                                        <div className={cn("border rounded-[2.5rem] overflow-hidden backdrop-blur-md relative transition-all duration-300", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className={cn("border-b", isDark ? 'bg-white/5 border-white/5' : 'bg-[#E8E4DC] border-[#D5D0C8]')}>
                                                        <tr>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Category</th>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Stations</th>
                                                            <th className={cn("px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right", isDark ? 'text-white/40' : 'text-[#4A4540]/80')}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={cn("divide-y", isDark ? 'divide-white/5' : 'divide-[#D5D0C8]')}>
                                                        {gameTypes.filter(g => !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(gt => (
                                                            <tr key={gt.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className={cn("font-black uppercase tracking-tight text-xs", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{gt.name}</p>
                                                                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest italic">{gt.description || 'No specs'}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", isDark ? 'bg-white/5 border border-white/10 text-white/80' : 'bg-white border border-[#D5D0C8]')}>
                                                                        {gt.station_count}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-8 w-8 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'game-types', data: gt })}>
                                                                            <Edit size={12} />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="bg-red-500/10 text-red-500 rounded-xl h-8 w-8 hover:bg-red-500 hover:text-white" onClick={() => handleDelete('game-types', gt.id)}>
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
                            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex-1 overflow-y-auto custom-scrollbar pr-2">
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
                            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex justify-between items-center px-4">
                                    <div />
                                    <Button
                                        onClick={() => setShowModal({ type: 'admins', data: null })}
                                        className="h-10 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        <Plus className="mr-2" size={14} /> Provision New Node
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className={cn("border rounded-[2.5rem] overflow-hidden backdrop-blur-md", isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#EFECE5]/80 border-[#D5D0C8]')}>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className={cn("border-b", isDark ? 'border-white/5 bg-white/[0.01]' : 'border-[#D5D0C8] bg-[#E8E4DC]')}>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Administrator</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 text-center">Auth Level</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn("divide-y", isDark ? 'divide-white/[0.03]' : 'divide-[#D5D0C8]')}>
                                                {admins.map(admin => (
                                                    <tr key={admin.id} className={cn("transition-colors group", isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#E8E4DC]/40')}>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic shadow-lg shadow-primary/5">
                                                                    {admin.username[0]}
                                                                </div>
                                                                <div>
                                                                    <p className={cn("font-black uppercase tracking-tight mb-0.5", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{admin.username}</p>
                                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest italic leading-none", isDark ? 'text-white/20' : 'text-[#B0AAA0]')}>Registered Node</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className={cn(
                                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/20",
                                                                admin.admin_level === 'super_admin' ? "bg-primary/20 text-primary border border-primary/20" : isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-[#E8E4DC] text-[#6B6560] border border-[#D5D0C8]"
                                                            )}>
                                                                {admin.admin_level}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setShowModal({ type: 'admins', data: admin })} className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all", isDark ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-white border border-[#D5D0C8] text-[#8A857E] hover:bg-[#E8E4DC] hover:text-[#1A1A1A]')}><Edit size={14} /></button>
                                                                <button onClick={() => handleDelete('admins', admin.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
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
                        </>
                        )}          </main>
                </div>
            )}

            {/* Simple Modal Implementation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 dark text-white">
                    <Card className="w-full max-w-xl bg-[#09090B] border-white/10 rounded-[2rem] p-8 relative text-white">
                        <button className="absolute top-6 right-6 text-white/20 hover:text-white" onClick={() => setShowModal(null)}>
                            <XCircle size={28} />
                        </button>
                        <h2 className="text-2xl font-black uppercase italic mb-6 text-white">
                            {showModal.data ? 'Update' : 'Create'} {showModal.type.replace(/^\w/, (c: any) => c.toUpperCase())}
                        </h2>

                        <form className="space-y-6" onSubmit={(e) => {
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
                                <div className="space-y-4">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Item Name" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <input name="image_path" defaultValue={showModal.data?.image_path} placeholder="Image Path / URL (Optional)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <textarea name="description" defaultValue={showModal.data?.description} placeholder="Description" className="w-full bg-white/5 border-white/10 rounded-xl h-20 p-4 font-bold text-sm" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="price" defaultValue={showModal.data?.price} placeholder="Price (DH)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                        <input
                                            name="category"
                                            defaultValue={showModal.data?.category}
                                            placeholder="Category"
                                            list="category-suggestions"
                                            className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'waiters' && (
                                <div className="space-y-4">
                                    <input name="full_name" defaultValue={showModal.data?.full_name} placeholder="Full Name" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="role" defaultValue={showModal.data?.role || 'waiter'} placeholder="Role (waiter/manager/comptable)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                        <input name="phone" defaultValue={showModal.data?.phone} placeholder="Phone" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    </div>
                                    <input name="email" defaultValue={showModal.data?.email} placeholder="Email" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm">
                                            <option value="active" className="bg-[#0A0A0A]">Active</option>
                                            <option value="off_duty" className="bg-[#0A0A0A]">Off Duty</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary transition-colors pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'clients' && (
                                <div className="space-y-4">
                                    <input name="full_name" defaultValue={showModal.data?.full_name} placeholder="Full Name" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="email" defaultValue={showModal.data?.email} placeholder="Email" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" />
                                        <input name="phone" defaultValue={showModal.data?.phone} placeholder="Phone" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" />
                                    </div>
                                    <input name="password" type="password" placeholder="Account Password (Secure Hashing)" className="w-full bg-white/5 border-primary/20 rounded-xl h-12 px-6 font-bold text-sm focus:border-primary text-white" />
                                </div>
                            )}

                            {showModal.type === 'sessions' && (
                                <div className="space-y-4">
                                    <input name="daily_number" defaultValue={showModal.data?.daily_number} placeholder="Queue Number" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm">
                                            <option value="waiting" className="bg-[#0A0A0A]">Waiting</option>
                                            <option value="playing" className="bg-[#0A0A0A]">Playing</option>
                                            <option value="completed" className="bg-[#0A0A0A]">Completed</option>
                                            <option value="cancelled" className="bg-[#0A0A0A]">Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary transition-colors pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'orders' && (
                                <div className="space-y-4">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Order Detail" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <input name="price" defaultValue={showModal.data?.price} placeholder="Total Price" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    <div className="relative group">
                                        <select name="status" defaultValue={showModal.data?.status} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm">
                                            <option value="pending" className="bg-[#0A0A0A]">Pending</option>
                                            <option value="preparing" className="bg-[#0A0A0A]">Preparing</option>
                                            <option value="served" className="bg-[#0A0A0A]">Served</option>
                                            <option value="cancelled" className="bg-[#0A0A0A]">Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary transition-colors pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'financials' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="amount" defaultValue={showModal.data?.amount} placeholder="Amount (DH)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                        <select name="record_type" defaultValue={showModal.data?.type || 'revenue'} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none text-sm">
                                            <option value="revenue" className="bg-[#0A0A0A]">Revenue (+)</option>
                                            <option value="expense" className="bg-[#0A0A0A]">Expense (-)</option>
                                            <option value="payout" className="bg-[#0A0A0A]">Staff Payout</option>
                                        </select>
                                    </div>
                                    <select name="payment_method" defaultValue={showModal.data?.method || 'cash'} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none text-sm">
                                        <option value="cash" className="bg-[#0A0A0A]">Cash</option>
                                        <option value="card" className="bg-[#0A0A0A]">Card / POS</option>
                                        <option value="transfer" className="bg-[#0A0A0A]">Bank Transfer</option>
                                    </select>
                                    <textarea name="note" defaultValue={showModal.data?.note} placeholder="Comptable Note / Audit Trail" className="w-full bg-white/5 border-white/10 rounded-xl h-20 p-4 font-bold text-sm" />
                                </div>
                            )}

                            {showModal.type === 'game-types' && (
                                <div className="space-y-4">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Game Name (e.g., PS5, Billiard)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="station_count" type="number" min="1" defaultValue={showModal.data?.station_count} placeholder="Number of Stations" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" required />
                                        <input name="image_path" defaultValue={showModal.data?.image_path} placeholder="Cover Image URL (Optional)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" />
                                    </div>
                                    <textarea name="description" defaultValue={showModal.data?.description} placeholder="Game Requirements / Specifications" className="w-full bg-white/5 border-white/10 rounded-xl h-20 p-4 font-bold text-sm" />
                                </div>
                            )}

                            {showModal.type === 'gaming-tables' && (
                                <div className="space-y-4 text-white">
                                    <input name="name" defaultValue={showModal.data?.name} placeholder="Table Name (e.g., Billiards Table Alpha)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="number" type="number" min="1" defaultValue={showModal.data?.number} placeholder="Table Number (e.g., 1, 2)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" required />
                                        <input name="club" defaultValue={showModal.data?.club || 'CueClub'} placeholder="Club (e.g., CueClub)" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm text-white" />
                                    </div>
                                    <div className="relative group">
                                        <select name="game_type_id" defaultValue={showModal.data?.game_type_id || ''} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm text-white">
                                            <option value="" className="bg-[#0A0A0A]">Select Game Category</option>
                                            {gameTypes.map(gt => (
                                                <option key={gt.id} value={gt.id} className="bg-[#0A0A0A]">{gt.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary transition-colors pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {showModal.type === 'admins' && (
                                <div className="space-y-4">
                                    <input name="username" defaultValue={showModal.data?.username} placeholder="Administrator Node Identifier" className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold text-sm" required />
                                    <div className="relative group">
                                        <select name="admin_level" defaultValue={showModal.data?.admin_level || 'simple_admin'} className="w-full bg-white/5 border-white/10 rounded-xl h-12 px-6 font-bold appearance-none cursor-pointer focus:border-primary/50 transition-all outline-none text-sm">
                                            <option value="super_admin" className="bg-[#0A0A0A]">Super Administrator (Full Root)</option>
                                            <option value="simple_admin" className="bg-[#0A0A0A]">Simple Administrator (Ops Only)</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary transition-colors pointer-events-none" size={18} />
                                    </div>
                                    <input name="password" type="password" placeholder={showModal.data ? "New Access Key (Leave blank to keep same)" : "Initial Access Key"} className="w-full bg-white/5 border-primary/20 rounded-xl h-12 px-6 font-bold text-sm focus:border-primary" required={!showModal.data} />
                                </div>
                            )}

                            <Button className="w-full h-14 bg-primary text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">
                                {showModal.data ? 'Update System Record' : 'Commit New Entry'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Winner Selection Modal */}
            {winnerModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
                    <Card className={cn("w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl", isDark ? 'bg-[#09090B] border-white/10 text-white' : 'bg-white border-[#D5D0C8] text-[#1A1A1A]')}>
                        <button className={cn("absolute top-6 right-6", isDark ? 'text-white/20 hover:text-white' : 'text-black/20 hover:text-black')} onClick={() => setWinnerModal(null)}>
                            <XCircle size={28} />
                        </button>
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                                <Award className="text-amber-500" size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-wider">Crown the Winner</h2>
                                <p className={cn("text-xs mt-1", isDark ? 'text-white/40' : 'text-[#8A857E]')}>
                                    {winnerModal.client} vs {winnerModal.opponent} — {winnerModal.table}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, winnerModal.client_id!)}
                                    disabled={settingWinner}
                                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs"
                                >
                                    {settingWinner ? <Loader2 size={16} className="animate-spin mr-2" /> : <Award size={16} className="mr-2" />}
                                    {winnerModal.client} Wins
                                </Button>
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, winnerModal.opponent_id!)}
                                    disabled={settingWinner}
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs"
                                >
                                    {settingWinner ? <Loader2 size={16} className="animate-spin mr-2" /> : <Award size={16} className="mr-2" />}
                                    {winnerModal.opponent} Wins
                                </Button>
                                <Button
                                    onClick={() => handleSetWinner(winnerModal.id, null)}
                                    disabled={settingWinner}
                                    variant="outline"
                                    className={cn("w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]", isDark ? 'border-white/10' : 'border-[#D5D0C8]')}
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
        <div className={cn("flex items-center gap-6 px-4 py-2 rounded-[1.5rem] transition-all cursor-default group relative z-10 flex-1 justify-center", isDark ? 'hover:bg-white/5' : 'hover:bg-[#FAF9F5]/80')}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-primary/20 shrink-0", isDark ? 'bg-white/5' : 'bg-white border border-[#D5D0C8]')}>
                <Icon size={24} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                    <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] leading-none", isDark ? 'text-white/40' : 'text-[#6B6560]')}>{label}</p>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">{trend}</span>
                </div>
                <h3 className={cn("text-2xl font-black italic uppercase tracking-tighter leading-none", isDark ? 'text-white' : 'text-[#1A1A1A]')}>{value}</h3>
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
            <Card className={cn("rounded-[2rem] border shadow-2xl relative overflow-hidden transition-all duration-300", isDark ? 'bg-[#111] text-white border-white/5' : 'bg-white text-[#1A1A1A] border-[#D5D0C8]')}>
                <div className={cn("absolute top-0 right-0 p-8 opacity-5", isDark ? "text-white" : "text-black")}>
                    <Timer size={200} />
                </div>
                <CardHeader className="pb-8 z-10 relative">
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Session Lifecycle</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Global Timeout Configuration</CardDescription>
                </CardHeader>
                <CardContent className="z-10 relative">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className={cn("p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300", isDark ? 'bg-white/5 border-white/10' : 'bg-[#F7F5F0] border-[#E8E4DC]')}>
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                <Lock size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-black uppercase tracking-widest text-sm">Admin Control Panel</h3>
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Duration before forced logout</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-2xl text-primary shrink-0">{adminHours}h</div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.5" max="24" step="0.5" 
                                        value={adminHours} 
                                        onChange={e => setAdminHours(parseFloat(e.target.value))}
                                        className={cn("w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer", isDark ? "bg-white/10" : "bg-[#D5D0C8]")}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-4">
                                    <span>30 min</span>
                                    <span>24 hours</span>
                                </div>
                            </div>

                            <div className={cn("p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300", isDark ? 'bg-white/5 border-white/10' : 'bg-[#F7F5F0] border-[#E8E4DC]')}>
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                                                <Gamepad2 size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-black uppercase tracking-widest text-sm">Screen Display Client</h3>
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Duration before screen resets</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-2xl text-blue-500 shrink-0">{screenHours}h</div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" max="168" step="1" 
                                        value={screenHours} 
                                        onChange={e => setScreenHours(parseFloat(e.target.value))}
                                        className={cn("w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer", isDark ? "bg-white/10" : "bg-[#D5D0C8]")}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-4">
                                    <span>1 hour</span>
                                    <span>1 week</span>
                                </div>
                            </div>
                        </div>

                        {/* User / Member Session Duration */}
                        <div className={cn("p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300", isDark ? 'bg-white/5 border-white/10' : 'bg-[#F7F5F0] border-[#E8E4DC]')}>
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase tracking-widest text-sm">Member Login Session</h3>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Duration before user must re-login</p>
                                        </div>
                                    </div>
                                    <div className="font-black text-2xl text-emerald-500 shrink-0">{userHours}h</div>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" max="168" step="0.5" 
                                    value={userHours} 
                                    onChange={e => setUserHours(parseFloat(e.target.value))}
                                    className={cn("w-full accent-emerald-500 h-2 rounded-lg appearance-none cursor-pointer", isDark ? "bg-white/10" : "bg-[#D5D0C8]")}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-4">
                                <span>30 min</span>
                                <span>1 week</span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={savingConfig || (sessionConfig?.admin_session_hours === adminHours && sessionConfig?.screen_session_hours === screenHours && sessionConfig?.user_session_hours === userHours)}
                            className="w-full h-14 bg-primary text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {savingConfig ? 'Committing Changes...' : 'Save Configuration'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

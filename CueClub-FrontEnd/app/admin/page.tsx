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
    Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tab = 'dashboard' | 'waiters' | 'menu' | 'orders' | 'clients' | 'sessions' | 'financials' | 'history' | 'games' | 'admins'

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
    table: string;
    table_name?: string;
    status: string;
    daily_number: number;
    created_at: string;
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

export default function AdminPage() {
    const router = useRouter()
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
    const [admins, setAdmins] = useState<AdminUser[]>([])

    // UI states
    const [showModal, setShowModal] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [adminLevel, setAdminLevel] = useState<string | null>(null)

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

    useEffect(() => {
        const token = localStorage.getItem('cueclub_admin_token')
        const level = localStorage.getItem('cueclub_admin_level')
        if (token) {
            setIsLoggedIn(true)
            setAdminLevel(level)
            fetchAllData()
        }
    }, [])

    const fetchAllData = async () => {
        try {
            const [wRes, mRes, oRes, cRes, sRes, fRes, gtRes] = await Promise.all([
                fetchWithAuth('/api/sys-admin/waiters'),
                fetchWithAuth('/api/sys-admin/menu'),
                fetchWithAuth('/api/sys-admin/orders'),
                fetchWithAuth('/api/sys-admin/clients'),
                fetchWithAuth('/api/sys-admin/sessions'),
                fetchWithAuth('/api/sys-admin/financials'),
                fetchWithAuth('/api/sys-admin/game-types')
            ])
            if (wRes.ok) setWaiters(await wRes.json())
            if (mRes.ok) setMenu(await mRes.json())
            if (oRes.ok) setOrders(await oRes.json())
            if (cRes.ok) setClients(await cRes.json())
            if (sRes.ok) setSessions(await sRes.json())
            if (fRes.ok) setFinancials(await fRes.json())
            if (gtRes.ok) setGameTypes(await gtRes.json())

            if (localStorage.getItem('cueclub_admin_level') === 'super_admin') {
                const aRes = await fetchWithAuth('/api/sys-admin/admins')
                if (aRes.ok) setAdmins(await aRes.json())
            }

            const hRes = await fetchWithAuth('/api/sys-admin/history')
            if (hRes.ok) setHistoryData(await hRes.json())
        } catch (err) {
            console.error("Failed to fetch admin data", err)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/sys-admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            })
            if (res.ok) {
                const data = await res.json()
                localStorage.setItem('cueclub_admin_token', data.token)
                localStorage.setItem('cueclub_admin_level', data.admin_level)
                setIsLoggedIn(true)
                setAdminLevel(data.admin_level)
                fetchAllData()
            } else {
                alert("Invalid Credentials")
            }
        } catch (err) {
            alert("Connection error")
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('cueclub_admin_token')
        localStorage.removeItem('cueclub_admin_level')
        setIsLoggedIn(false)
        setAdminLevel(null)
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

    const handleDelete = async (type: Tab, id: number) => {
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

    return (
        <div className="dark h-screen bg-[#050505] text-white flex overflow-hidden relative font-['Outfit'] items-center justify-center">
            {/* Global Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/bg_billiardo.jpg"
                    alt="Billiards Background"
                    className="w-full h-full object-cover"
                />
                {/* Balanced Darkness & Shadowing as in Home Page */}
                <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/80" />
            </div>

            {!isLoggedIn ? (
                <Card className="w-full max-w-[400px] bg-white/[0.02] border-white/5 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl relative z-10">
                    <div className="space-y-8">
                        <div className="text-center space-y-3">
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
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-6 font-bold focus:outline-none focus:border-primary/50 transition-all text-white text-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-6 font-bold focus:outline-none focus:border-primary/50 transition-all text-white text-sm"
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
                    <aside className="w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 p-6 flex flex-col hidden lg:flex relative shadow-2xl shrink-0">
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
                                    group: 'Core Operations',
                                    items: [
                                        { id: 'dashboard', icon: LayoutDashboard, label: 'Control Center', level: 'simple_admin' },
                                        { id: 'history', icon: History, label: 'System Logs', level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: 'Gaming Arena',
                                    items: [
                                        { id: 'sessions', icon: Clock, label: 'Live Sessions', level: 'simple_admin' },
                                        { id: 'games', icon: Gamepad2, label: 'Table Setup', level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: 'Service & Menu',
                                    items: [
                                        { id: 'orders', icon: ShoppingCart, label: 'Order Stream', level: 'simple_admin' },
                                        { id: 'menu', icon: Coffee, label: 'Menu Catalog', level: 'super_admin' },
                                        { id: 'waiters', icon: Users, label: 'Staff Roster', level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: 'Administration',
                                    items: [
                                        { id: 'clients', icon: Users, label: 'Member Database', level: 'super_admin' },
                                        { id: 'financials', icon: DollarSign, label: 'Financial Ledger', level: 'super_admin' },
                                    ]
                                },
                                {
                                    group: 'System Security',
                                    items: [
                                        { id: 'admins', icon: Lock, label: 'Access Control', level: 'super_admin' },
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
                                                        : "text-white/70 hover:bg-white/[0.05] hover:text-white"
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
                                <h1 className="text-2xl font-black uppercase tracking-tighter italic mb-0.5 text-white">
                                    {activeTab === 'dashboard' ? 'Control - Panel' :
                                        activeTab === 'sessions' ? 'Sessions' :
                                            activeTab === 'games' ? 'Stations' :
                                                activeTab === 'clients' ? 'Registry' :
                                                    activeTab === 'waiters' ? 'Staff' :
                                                        activeTab === 'menu' ? 'Repository' :
                                                            activeTab === 'orders' ? 'Orders' :
                                                                activeTab === 'admins' ? 'Access Control' :
                                                                    activeTab === 'history' ? 'History' : 'Finance'}
                                </h1>
                                <p className="text-primary font-black tracking-[0.4em] uppercase text-[7px] italic opacity-80">Admin Command Node</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-lg h-8 px-4 flex items-center gap-3 min-w-[240px] focus-within:border-primary/50 transition-all shadow-xl backdrop-blur-md">
                                    <Search size={12} className="text-muted-foreground" />
                                    <input
                                        placeholder="Intelligence Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest flex-1 text-white placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                        </header>

                        {activeTab === 'dashboard' && (
                            <div className="flex-1 flex flex-col min-h-0 gap-6">
                                <div className="flex items-center justify-between gap-4 shrink-0 px-8 py-4 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-2xl mx-2 shadow-2xl relative overflow-hidden group/stats">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-700" />
                                    <StatCard label="Active Reach" value={clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)).length} icon={Users} trend="+3 mem" />
                                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                                    <StatCard label="Live Game" value={sessions.filter(s => s.status === 'playing' && (!searchTerm || s.table_name?.toLowerCase().includes(searchTerm.toLowerCase()))).length} icon={Clock} trend="Active" />
                                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                                    <StatCard label="Staff On" value={waiters.filter(w => w.status === 'active').length} icon={Zap} trend="Optimized" />
                                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                                    <StatCard label="Revenue" value={`${financials.filter(f => !searchTerm || f.order_details?.toLowerCase().includes(searchTerm.toLowerCase())).reduce((s, o) => s + parseFloat((o.amount as string) || '0'), 0)} DH`} icon={DollarSign} trend="+12%" />
                                </div>

                                <Card className="bg-white/[0.02] border-white/5 rounded-[1.5rem] px-6 py-2 border-none shadow-2xl flex-1 overflow-hidden flex flex-col min-h-0 backdrop-blur-xl">
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
                                                <div key={order.id} className="bg-white/5 rounded-xl p-5 flex items-center justify-between border border-white/5 hover:bg-white/[0.07] transition-all">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                                            <Zap size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black uppercase tracking-tight text-base">{order.name}</p>
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
                                                        <p className="text-[9px] text-muted-foreground font-black uppercase">{new Date(order.created_at).toLocaleTimeString()}</p>
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
                                    <h2 className="text-lg font-black uppercase italic text-white/40">Item Repository</h2>
                                    <Button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black font-black uppercase tracking-widest rounded-xl px-4 h-8 text-[9px] transition-all" onClick={() => setShowModal({ type: 'menu' })}>
                                        <Plus className="mr-2" size={12} /> Add New Item
                                    </Button>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">ID</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Detail</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Category</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Score</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Price</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {menu.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-8 py-6 font-black text-white/20 text-xs italic">#{item.id}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center italic font-black text-white/10 group-hover:text-primary transition-colors">
                                                                    {item.name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black uppercase tracking-tight text-white">{item.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[300px] italic">{item.description}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex justify-center">
                                                                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest">
                                                                    {item.category}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="text-sm font-black text-primary italic">★ {item.popularity}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-xl">{item.price} <span className="text-xs opacity-40">DH</span></td>
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
                                    <h2 className="text-xl font-black uppercase italic">Personnel Node</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-10 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'waiters' })}>
                                        <Plus className="mr-2" size={14} /> Recruit Staff
                                    </Button>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Staff Name</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Identity / Role</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Status</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Current Load</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {waiters.map(waiter => (
                                                    <tr key={waiter.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                                                                    <Users className="text-white/20 group-hover:text-primary" size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black uppercase tracking-tight text-white text-sm">{waiter.full_name}</p>
                                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-50 italic">Member #{waiter.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary/80">
                                                                {waiter.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn("w-2 h-2 rounded-full", waiter.status === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{waiter.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                    <div
                                                                        className={cn("h-full transition-all duration-1000", waiter.current_load > 3 ? "bg-red-500" : "bg-primary")}
                                                                        style={{ width: `${Math.min(100, (waiter.current_load / 5) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] font-black text-white/40 uppercase">{waiter.current_load} Orders Active</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-8 w-8 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'waiters', data: waiter })}>
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
                                    <h2 className="text-xl font-black uppercase italic text-white">Command Stream</h2>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{orders.length} Active Records</p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 border-none shadow-2xl flex-1 overflow-y-auto relative custom-scrollbar">
                                    <div className="absolute inset-0 p-6 space-y-4">
                                        {orders.filter(o => !searchTerm || o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer?.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                                            <div key={order.id} className="bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-white/5 hover:bg-white/[0.07] transition-all gap-6 group">
                                                <div className="flex items-center gap-6 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 italic font-black text-lg text-white/20">
                                                        {order.customer?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black uppercase tracking-tight">{order.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic">{order.customer}</span>
                                                            <span className="text-white/10">•</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{order.table}</span>
                                                            <span className="text-white/10">•</span>
                                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                                Responsible: {order.waiter}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black">{order.price} DH</p>
                                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{new Date(order.created_at).toLocaleTimeString()}</p>
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
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/5 rounded-lg hover:bg-primary hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setShowModal({ type: 'orders', data: order })}>
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
                                    <h2 className="text-xl font-black uppercase italic">Member Registry</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'clients' })}>
                                        <Plus className="mr-2" size={14} /> Register Member
                                    </Button>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">ID</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Client Profile</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Contact</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Device Fingerprint</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {clients.filter(c => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))).map(client => (
                                                    <tr key={client.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-8 py-6 font-black text-white/20 text-xs italic">#{client.id}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 italic font-black text-white/20">
                                                                    {client.full_name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black uppercase tracking-tight text-white">{client.full_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50 italic">Verified User</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{client.email || 'NO EMAIL'}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground mt-1">{client.phone || 'NO PHONE'}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-center text-[8px] font-mono text-white/30">
                                                            {client.device_id?.substring(0, 16) || 'UNLINKED NODE'}...
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-10 w-10 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'clients', data: client })}>
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
                                    <h2 className="text-xl font-black uppercase italic">Pool Command</h2>
                                    <Button className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-primary hover:text-black transition-all" onClick={() => setShowModal({ type: 'sessions' })}>
                                        <Plus className="mr-2" size={14} /> New Session
                                    </Button>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Queue</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Member</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Table</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Status</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Initiated</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {sessions.filter(s => !searchTerm || s.client?.toLowerCase().includes(searchTerm.toLowerCase()) || s.table?.toLowerCase().includes(searchTerm.toLowerCase())).map(session => (
                                                    <tr key={session.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-8 py-6 font-black text-primary text-xl italic">#{session.daily_number}</td>
                                                        <td className="px-8 py-6">
                                                            <p className="font-black uppercase tracking-tight text-white">{session.client}</p>
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
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{session.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <p className="text-[10px] font-bold text-white/40 uppercase">{new Date(session.created_at).toLocaleTimeString()}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-10 w-10 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'sessions', data: session })}>
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
                                    <h2 className="text-xl font-black uppercase italic">Audit Ledger</h2>
                                    <Button className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-black uppercase tracking-widest rounded-xl px-6 h-9 text-[10px] hover:bg-emerald-500 hover:text-black transition-all" onClick={() => setShowModal({ type: 'financials' })}>
                                        <Plus className="mr-2" size={14} /> Post Record
                                    </Button>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Reference</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Type</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Method</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Status</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Amount</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {financials.filter(f => !searchTerm || f.order?.toLowerCase().includes(searchTerm.toLowerCase()) || f.note?.toLowerCase().includes(searchTerm.toLowerCase())).map(rec => (
                                                    <tr key={rec.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-black uppercase tracking-tight text-white text-xs">{rec.order}</p>
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
                                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{rec.method}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", rec.status === 'cleared' ? "bg-emerald-500" : "bg-amber-500")} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{rec.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-white">
                                                            {rec.type === 'revenue' ? '+' : '-'}{rec.amount} DH
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="bg-white/5 rounded-xl h-8 w-8 hover:bg-primary hover:text-black" onClick={() => setShowModal({ type: 'financials', data: rec })}>
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
                            <section className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-xl font-black uppercase italic text-white/50">Master History</h2>
                                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                            {['All', 'Session', 'Order', 'Finance'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setHistoryFilter(f)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                                        historyFilter === f ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white"
                                                    )}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex bg-white/5 border border-white/10 rounded-lg h-9 px-4 items-center gap-3 min-w-[300px]">
                                        <Search size={14} className="text-white/20" />
                                        <input
                                            placeholder="Search entire vault..."
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs font-bold flex-1 text-white"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Classification</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40">Descriptor</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Outcome</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Metadata</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {historyData
                                                    .filter(rec => historyFilter === 'All' || rec.category === historyFilter)
                                                    .filter(rec => !historySearch ||
                                                        rec.detail?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                                        rec.info?.toLowerCase().includes(historySearch.toLowerCase())
                                                    )
                                                    .map((rec, idx) => (
                                                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                                                                        rec.category === 'Session' ? "bg-primary shadow-primary/50" :
                                                                            rec.category === 'Order' ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                                                                    )} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{rec.category}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-black uppercase tracking-tight text-white text-xs">{rec.detail}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest opacity-60">
                                                                    {rec.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{rec.info}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <p className="text-[9px] font-black text-white/20 uppercase">
                                                                    {new Date(rec.date).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-[10px] font-black text-white italic">
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
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Administrator</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 text-center">Auth Level</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {admins.map(admin => (
                                                    <tr key={admin.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic shadow-lg shadow-primary/5">
                                                                    {admin.username[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black uppercase tracking-tight text-white mb-0.5">{admin.username}</p>
                                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic leading-none">Registered Node</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className={cn(
                                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/20",
                                                                admin.admin_level === 'super_admin' ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-white/50 border border-white/10"
                                                            )}>
                                                                {admin.admin_level}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setShowModal({ type: 'admins', data: admin })} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"><Edit size={14} /></button>
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
                    </main>
                </div>
            )}

            {/* Simple Modal Implementation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <Card className="w-full max-w-xl bg-white/5 border-white/10 rounded-[2rem] p-8 relative">
                        <button className="absolute top-6 right-6 text-white/20 hover:text-white" onClick={() => setShowModal(null)}>
                            <XCircle size={28} />
                        </button>
                        <h2 className="text-2xl font-black uppercase italic mb-6">
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
        </div>
    )
}

function StatCard({ label, value, icon: Icon, trend }: any) {
    return (
        <div className="flex items-center gap-6 px-4 py-2 hover:bg-white/5 rounded-[1.5rem] transition-all cursor-default group relative z-10 flex-1 justify-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-primary/20 shrink-0">
                <Icon size={24} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] leading-none">{label}</p>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">{trend}</span>
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{value}</h3>
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

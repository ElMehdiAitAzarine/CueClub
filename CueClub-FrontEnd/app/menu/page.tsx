'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    ArrowLeft, 
    Coffee, 
    Zap, 
    Wind, 
    Droplets, 
    ShoppingCart, 
    CheckCircle2,
    Loader2,
    Plus,
    Minus,
    Trash2,
    XCircle,
    LayoutGrid,
    Check,
    BarChart2,
    Clock,
    History as HistoryIcon,
    Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MenuItem {
    id: number | string;
    name: string;
    description: string;
    price: number | string;
    category: string;
    image_path: string;
    popularity: number;
}

interface Order {
    id: number;
    name: string;
    price: number;
    status: 'pending' | 'cancelled' | 'served' | 'completed';
    created_at: string;
    game_table_name?: string;
    order_table_number?: number;
    waiter?: string;
}

interface CafeTable {
    number: number;
    status: 'free' | 'occupied';
    client_id: string | null;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Coffee': return Coffee;
        case 'Tea': return Droplets;
        case 'Cold': return Wind;
        case 'Snacks': return Zap;
        default: return Zap;
    }
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Coffee': return 'from-orange-500 to-amber-600';
        case 'Tea': return 'from-emerald-500 to-teal-600';
        case 'Cold': return 'from-blue-400 to-indigo-500';
        case 'Snacks': return 'from-purple-500 to-pink-600';
        default: return 'from-gray-500 to-gray-600';
    }
}

export default function MenuPage() {
    const router = useRouter()
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<{[key: string]: number}>({})
    const [ordering, setOrdering] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [gamingTableId, setGamingTableId] = useState<string | null>(null)
    const [selectedCafeTable, setSelectedCafeTable] = useState<number | null>(null)
    const [cafeTables, setCafeTables] = useState<CafeTable[]>([])
    const [activeCategory, setActiveCategory] = useState<string>('All')
    const [userOrders, setUserOrders] = useState<Order[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [guestNameInput, setGuestNameInput] = useState('')
    const [isGuest, setIsGuest] = useState(false)

    useEffect(() => {
        const storedId = localStorage.getItem('cueclub_user_id')
        const storedGamingId = localStorage.getItem('cueclub_table_id')
        const storedGuest = localStorage.getItem('cueclub_is_guest') === 'true'
        
        fetchMenu()
        
        if (storedId) {
            setUserId(storedId)
            setGamingTableId(storedGamingId)
            setIsGuest(storedGuest)
            fetchOrders(storedId)
            fetchCafeTables()
        } else {
            setLoadingOrders(false)
        }
    }, [router])

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/sys-admin/menu')
            if (res.ok) setMenuItems(await res.json())
        } catch (err) {
            console.error("Failed to fetch menu", err)
        }
    }

    const fetchCafeTables = async () => {
        try {
            const res = await fetch('/api/cafe-tables', {
                headers: { 'X-Pinggy-No-Screen': 'true' }
            })
            if (res.ok) {
                const data = await res.json()
                setCafeTables(data)
                // If user is already at a table, select it
                const myTable = data.find((t: any) => t.client_id == userId)
                if (myTable) setSelectedCafeTable(myTable.number)
            }
        } catch (err) {
            console.error("Failed to fetch cafe tables", err)
        }
    }

    const fetchOrders = async (id: string) => {
        try {
            const res = await fetch(`/api/user-orders?client_id=${id}`, {
                headers: { 'X-Pinggy-No-Screen': 'true' }
            })
            if (res.ok) {
                const data = await res.json()
                setUserOrders(data)
            }
        } catch (err) {
            console.error("Failed to fetch orders", err)
        } finally {
            setLoadingOrders(false)
        }
    }

    const handleCancelOrder = async (orderId: number) => {
        if (!userId) return
        try {
            const res = await fetch('/api/cancel-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Pinggy-No-Screen': 'true'
                },
                body: JSON.stringify({
                    client_id: userId,
                    order_id: orderId
                })
            })
            if (res.ok) {
                fetchOrders(userId)
            } else {
                const err = await res.json()
                alert(err.detail)
            }
        } catch (err) {
            alert("Connection error")
        }
    }

    const handleOccupyTable = async (num: number) => {
        if (!userId) return
        const res = await fetch('/api/occupy-cafe-table', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Pinggy-No-Screen': 'true'
            },
            body: JSON.stringify({
                client_id: userId,
                table_number: num
            })
        })
        if (res.ok) {
            setSelectedCafeTable(num)
            fetchCafeTables()
        } else {
            const err = await res.json()
            alert(err.detail)
        }
    }

    const updateCart = (id: string, delta: number) => {
        setCart(prev => {
            const current = prev[id] || 0
            const next = Math.max(0, current + delta)
            if (next === 0) {
                const { [id]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [id]: next }
        })
    }

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menuItems.find(m => String(m.id) === String(id))
        return sum + (parseFloat(item?.price as string) || 0) * qty
    }, 0)

    const handlePlaceOrder = async () => {
        if (!userId || totalItems === 0) return
        
        if (!selectedCafeTable && !gamingTableId) {
            setShowTablePicker(true);
            alert("Please select your table or seat number first! 📍");
            return;
        }

        setOrdering(true)
        
        try {
            const orders = Object.entries(cart).map(async ([id, qty]) => {
                const item = menuItems.find(m => String(m.id) === String(id))
                if (!item) return
                
                const res = await fetch('/api/place-order', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Pinggy-No-Screen': 'true'
                    },
                    body: JSON.stringify({
                        client_id: userId,
                        item_name: qty > 1 ? `${qty}x ${item.name}` : item.name,
                        price: (parseFloat(item.price as string) * qty),
                        table_id: gamingTableId,
                        cafe_table_number: selectedCafeTable
                    })
                })
                return res.ok
            })

            await Promise.all(orders)
            setCart({})
            fetchOrders(userId)
            alert("Order placed successfully! ☕")
        } catch (err) {
            alert("Failed to place order. Connection issues.")
        } finally {
            setOrdering(false)
        }
    }

    const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category))).sort()]

    const filteredItems = activeCategory === 'All' 
        ? menuItems 
        : menuItems.filter(i => i.category === activeCategory)

    const pendingOrders = userOrders.filter(o => o.status === 'pending')

    return (
        <div className="dark min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 pb-32">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white/5"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="text-center">
                        <h1 className="text-lg font-black uppercase tracking-[0.2em] italic">Club Menu</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Member Service</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowHistory(true)}
                            className="p-2 rounded-full hover:bg-white/5 transition-colors relative"
                        >
                            <BarChart2 size={20} className="text-muted-foreground" />
                            {userOrders.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                            )}
                        </button>
                        <div className="relative">
                            <ShoppingCart size={20} className={cn("transition-colors", totalItems > 0 ? "text-primary" : "text-muted-foreground")} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-8 relative z-10">
                
                {/* Guest Call to Action */}
                {/* Guest Mode Section / Welcome */}
                {!userId ? (
                    <section className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={80} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                                    <div className="w-2 h-8 bg-primary rounded-full" />
                                    Guest Mode
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2">Order instantly without an account</p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Enter Your Full Name"
                                    value={guestNameInput}
                                    onChange={(e) => setGuestNameInput(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 h-14 text-sm font-bold focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                                />
                                <Button 
                                    onClick={async () => {
                                        if (!guestNameInput.trim()) return alert("Enter your name first")
                                        try {
                                            const res = await fetch('/api/guest-login', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ full_name: guestNameInput })
                                            })
                                            if (res.ok) {
                                                const data = await res.json()
                                                setUserId(data.id.toString())
                                                setIsGuest(true)
                                                localStorage.setItem('cueclub_user_id', data.id.toString())
                                                localStorage.setItem('cueclub_user_name', data.name)
                                                localStorage.setItem('cueclub_is_guest', 'true')
                                                fetchOrders(data.id.toString())
                                                fetchCafeTables()
                                            }
                                        } catch (err) {
                                            alert("Login failed")
                                        }
                                    }}
                                    className="bg-primary text-black font-black uppercase tracking-widest text-xs h-14 px-8 rounded-2xl hover:scale-105 transition-transform"
                                >
                                    Continue
                                </Button>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Already have an account?</p>
                                <Button 
                                    variant="link" 
                                    onClick={() => router.push('/signup')}
                                    className="text-primary text-[9px] font-black uppercase tracking-widest h-auto p-0"
                                >
                                    Member Login
                                </Button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Welcome back,</p>
                            <h2 className="text-xl font-black uppercase italic text-white">{localStorage.getItem('cueclub_user_name')}</h2>
                        </div>
                        {isGuest && (
                            <span className="bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                                Guest Session
                            </span>
                        )}
                    </section>
                )}

                {/* Cafe Table Picker */}
                {userId && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <LayoutGrid size={14} /> Your Location {selectedCafeTable ? `(Table ${selectedCafeTable})` : '(Take a Seat)'}
                            </h2>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowTablePicker(!showTablePicker)}
                                className="text-[10px] font-bold uppercase tracking-widest h-8"
                            >
                                {showTablePicker ? 'Close Picker' : 'Change Table'}
                            </Button>
                        </div>
                        
                        <AnimatePresence>
                            {showTablePicker && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white/5 border border-white/5 rounded-[2rem] p-6"
                                >
                                    <div className="grid grid-cols-5 gap-3">
                                        {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
                                            const table = cafeTables.find(t => t.number === num)
                                            const isMe = table?.client_id == userId
                                            const isTaken = table?.status === 'occupied' && !isMe
                                            
                                            return (
                                                <button
                                                    key={num}
                                                    disabled={isTaken}
                                                    onClick={() => handleOccupyTable(num)}
                                                    className={cn(
                                                        "h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all border",
                                                        isMe ? "bg-primary border-primary text-black" :
                                                        isTaken ? "bg-red-500/10 border-red-500/20 text-red-500/50 cursor-not-allowed" :
                                                        selectedCafeTable === num ? "bg-white/20 border-white/40 text-white" :
                                                        "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                                                    )}
                                                >
                                                    {isMe ? <Check size={16} /> : num}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[8px] text-muted-foreground uppercase text-center mt-6 tracking-[0.2em] font-bold italic">Select where you are sitting for accurate delivery</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                )}

                {/* Pending Orders Section */}
                {userId && pendingOrders.length > 0 && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                            <HistoryIcon size={14} /> Active Orders
                        </h2>
                        <div className="space-y-2">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                            <Coffee size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{order.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.price} DH • Pending</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                    >
                                        <XCircle size={18} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Category Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                activeCategory === cat 
                                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20" 
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Table Menu (Linear Rows) */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, idx) => {
                            const Icon = getCategoryIcon(item.category)
                            const itemColor = getCategoryColor(item.category)
                            const qty = cart[item.id] || 0
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group"
                                >
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex items-center gap-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-primary/20 relative overflow-hidden">
                                        {/* Minimalist Icon/Image Placeholder */}
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500",
                                            itemColor
                                        )}>
                                            <Icon size={24} className="text-white drop-shadow-md" />
                                        </div>

                                        {/* Main Details in Row */}
                                        <div className="flex-1 min-w-0 md:grid md:grid-cols-4 md:items-center gap-6">
                                            <div className="md:col-span-2">
                                                <h3 className="font-black uppercase tracking-tight text-white flex items-center gap-3">
                                                    {item.name}
                                                    <span className="text-[10px] font-black text-primary italic">★ {item.popularity}</span>
                                                </h3>
                                                <p className="text-[10px] text-muted-foreground truncate opacity-60 italic">{item.description}</p>
                                            </div>
                                            
                                            <div className="hidden md:block text-center">
                                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {item.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 mt-3 md:mt-0">
                                                <span className="text-white font-black text-base">{item.price} <span className="text-[10px] opacity-40">DH</span></span>
                                                
                                                {userId ? (
                                                    <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                                                        {qty > 0 && (
                                                            <>
                                                                <button 
                                                                    onClick={() => updateCart(String(item.id), -1)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="w-6 text-center text-xs font-black">{qty}</span>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => updateCart(String(item.id), 1)}
                                                            className={cn(
                                                                "h-8 rounded-lg flex items-center justify-center transition-all px-3",
                                                                qty > 0 
                                                                    ? "w-8 hover:bg-white/10" 
                                                                    : "bg-primary text-black font-black uppercase tracking-widest text-[9px]"
                                                            )}
                                                        >
                                                            {qty > 0 ? <Plus size={14} /> : 'Add'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Sign in to order</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </main>

            {/* Floating Order Tray */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-4 right-4 z-[100] max-w-4xl mx-auto"
                    >
                        <div className="bg-primary shadow-[0_20px_50px_-10px_rgba(234,88,12,0.5)] rounded-[2.5rem] p-4 flex items-center justify-between border-t border-white/20">
                            <div className="pl-4">
                                <p className="text-black/60 text-[9px] font-black uppercase tracking-widest">Total Bill</p>
                                <p className="text-black text-xl font-black">{totalPrice} <span className="text-xs">DH</span></p>
                            </div>
                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={ordering}
                                className="bg-black text-white hover:bg-neutral-900 h-14 px-8 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[10px] group flex items-center gap-4"
                            >
                                {ordering ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Confirm Selection
                                        <div className="bg-white/10 p-2 rounded-full group-hover:bg-primary group-hover:text-black transition-all">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Order History Overlay */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[90%] md:w-[400px] bg-[#0A0A0A] border-l border-white/5 z-[120] p-8 shadow-2xl overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Order History</h2>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Full Session Ledger</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setShowHistory(false)}
                                    className="rounded-full hover:bg-white/5"
                                >
                                    <XCircle size={24} />
                                </Button>
                            </div>

                            {loadingOrders ? (
                                <div className="h-64 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : userOrders.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center opacity-20 space-y-4">
                                    <BarChart2 size={64} />
                                    <p className="text-xs font-black uppercase tracking-widest text-center">No orders recorded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Session Spend</p>
                                        <p className="text-3xl font-black text-primary">
                                            {userOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.price : 0), 0)} <span className="text-sm">DH</span>
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Recent Timeline</h3>
                                        {userOrders.map((order) => (
                                            <div key={order.id} className="relative pl-6 pb-2 border-l border-white/10 last:border-0 ml-2">
                                                <div className={cn(
                                                    "absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A]",
                                                    order.status === 'pending' ? "bg-primary animate-pulse" :
                                                    order.status === 'served' ? "bg-emerald-500" : "bg-red-500"
                                                )} />
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-bold tracking-tight text-white">{order.name}</p>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-primary">{order.price} DH</p>
                                                            <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mt-1 italic">
                                                                {order.waiter}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                            <Clock size={12} />
                                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="opacity-30 mx-1">|</span>
                                                            <span className="text-primary/70">
                                                                {order.order_table_number ? `Table ${order.order_table_number}` : (order.game_table_name || 'General')}
                                                            </span>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                                            order.status === 'pending' ? "bg-primary/10 border-primary/20 text-primary" :
                                                            order.status === 'served' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                            "bg-red-500/10 border-red-500/20 text-red-500"
                                                        )}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    {order.status === 'pending' && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="w-full h-8 text-[8px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg mt-2"
                                                        >
                                                            Request Cancellation
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

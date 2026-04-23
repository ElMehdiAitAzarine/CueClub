'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Phone, ChevronRight, UserCircle, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
        setError(null)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        let deviceId = localStorage.getItem('cueclub_device_id')
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('cueclub_device_id', deviceId)
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: formData.phone,
                    password: formData.password,
                    device_id: deviceId
                })
            })

            const data = await res.json()
            if (res.ok) {
                localStorage.setItem('cueclub_user_id', data.id)
                localStorage.setItem('cueclub_user_name', data.user)
                localStorage.setItem('cueclub_logged_in', 'true')
                
                if (data.is_screen) {
                    router.push('/screen')
                } else {
                    router.push('/home')
                }
            } else {
                setError(data.detail || "Login failed")
            }
        } catch (err) {
            setError("Connection error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="dark min-h-screen bg-background flex flex-col selection:bg-primary/30 h-screen overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-secondary/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header / Logo */}
            <header className="p-6 relative z-10">
                <Link href="/" className="flex items-center gap-2 w-fit group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-12 transition-transform duration-500">
                        <span className="text-white font-black text-xl">C</span>
                    </div>
                    <div>
                        <span className="text-xl font-bold text-foreground block leading-tight">Cue-Club</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Excellence Defined</span>
                    </div>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 relative z-10 overflow-hidden min-h-0">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-white">Welcome Back</h1>
                        <p className="text-sm text-muted-foreground">The club house awaits your return.</p>
                    </div>

                    <Card className="border-white/10 shadow-2xl bg-[#09090b]/80 backdrop-blur-xl overflow-hidden rounded-3xl border">
                        <form onSubmit={handleLogin}>
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-4 relative">
                                    <UserCircle className="text-primary" size={40} />
                                    <div className="absolute -top-1 -right-1">
                                        <Sparkles className="text-primary animate-pulse" size={16} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 px-8">
                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] uppercase font-bold p-3 rounded-lg text-center animate-in fade-in zoom-in">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2 group">
                                    <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Identification</Label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="phone"
                                            type="text"
                                            placeholder="Phone, email or name"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="h-12 pl-11 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Password</Label>
                                        <Link href="#" className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Forgot?</Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="h-12 pl-11 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="px-8 pb-8 pt-4">
                                <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold rounded-2xl group relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300">
                                    <span className="relative z-10 flex items-center">
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Authorize Access"}
                                        {!loading && <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground">
                        New to the club?{' '}
                        <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-semibold underline underline-offset-4 decoration-primary/30">
                            Claim your membership
                        </Link>
                    </p>
                </div>
            </main>

            <footer className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                © 2026 Cue-Club Game • Secure Terminal
            </footer>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}

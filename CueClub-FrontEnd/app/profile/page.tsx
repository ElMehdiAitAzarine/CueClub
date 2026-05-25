'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Camera, Upload, CheckCircle2, Loader2, Phone, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSectionTheme } from '@/hooks/use-section-theme'
import ThemeToggle from '@/components/ThemeToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function ProfilePage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { theme, toggleTheme, isDark } = useSectionTheme('user')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [profileFile, setProfileFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const storedId = localStorage.getItem('cueclub_user_id')
        if (!storedId) {
            router.push('/login')
            return
        }
        setUserId(storedId)
        fetchProfile(storedId)
    }, [router])

    const fetchProfile = async (id: string) => {
        try {
            const res = await fetch(`/api/get-profile?client_id=${id}`)
            if (res.ok) {
                const data = await res.json()
                setFormData({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    phone: data.phone || '',
                    password: '',
                    confirmPassword: '',
                })
                if (data.photo_path) {
                    setProfileImage(data.photo_path)
                }
            }
        } catch (err) {
            console.error("Failed to fetch profile", err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
        if (errors[id]) {
            setErrors((prev) => {
                const updated = { ...prev }
                delete updated[id]
                return updated
            })
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProfileFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.firstName) newErrors.firstName = 'Required'
        if (!formData.lastName) newErrors.lastName = 'Required'
        if (!formData.phone) newErrors.phone = 'Required'
        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate() || !userId) return
        setIsSubmitting(true)

        const fd = new FormData()
        fd.append('client_id', userId)
        fd.append('first_name', formData.firstName)
        fd.append('last_name', formData.lastName)
        fd.append('phone', formData.phone)
        if (formData.password) {
            fd.append('password', formData.password)
        }
        if (profileFile) {
            fd.append('photo', profileFile)
        }

        try {
            const res = await fetch('/api/update-profile', {
                method: 'POST',
                body: fd
            })
            const result = await res.json()
            if (res.ok) {
                localStorage.setItem('cueclub_user_name', result.user_name)
                alert("Profile updated successfully!")
                router.back()
            } else {
                alert(result.detail || "Update failed")
            }
        } catch (err) {
            alert("Connection failure")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? 'dark bg-background' : 'light-mode bg-[#F7F5F0]')}>
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen text-foreground selection:bg-primary/30 pb-10", isDark ? 'dark bg-[#0A0A0A]' : 'light-mode bg-[#F7F5F0]')}>
            <header className={cn("sticky top-0 z-50 backdrop-blur-md border-b p-4 flex items-center justify-between gap-4", isDark ? 'bg-[#0A0A0A]/80 border-white/5' : 'bg-[#F7F5F0]/90 border-[#D5D0C8]')}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-sm font-black uppercase">{t('profile.editProfile', 'Edit Profile')}</h1>
                </div>
                <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
            </header>

            <main className="max-w-lg mx-auto p-4 space-y-6">
                <Card className={cn("rounded-3xl overflow-hidden", isDark ? 'bg-white/5 border-white/10' : 'bg-[#EFECE5] border-[#D5D0C8]')}>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative w-24 h-24">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <div className={cn("w-full h-full rounded-full border-2 border-primary/20 overflow-hidden relative group", isDark ? 'bg-white/5' : 'bg-[#E8E4DC]')}>
                                {profileImage ? (
                                    <img src={profileImage.startsWith('data:') ? profileImage : `${window.location.origin}${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User size={40} className={isDark ? "text-white/20" : "text-black/20"} />
                                    </div>
                                )}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"
                                >
                                    <Camera size={20} className="text-white mb-1" />
                                    <span className="text-[8px] font-black uppercase">{t('profile.change', 'Change')}</span>
                                </button>
                            </div>
                        </div>
                        <CardTitle className="text-xl font-black">{t('profile.personalInfo', 'Personal Info')}</CardTitle>
                        <CardDescription className="text-xs">{t('profile.manageIdentity', 'Manage your club identity and security')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('profile.firstName', 'First Name')}</Label>
                                <Input 
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className={cn("rounded-xl border-none focus-visible:ring-1", isDark ? 'bg-white/5' : 'bg-white/80')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('profile.lastName', 'Last Name')}</Label>
                                <Input 
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className={cn("rounded-xl border-none focus-visible:ring-1", isDark ? 'bg-white/5' : 'bg-white/80')}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('profile.phone', 'Phone Number (Connection)')}</Label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input 
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={cn("rounded-xl pl-10 border-none focus-visible:ring-1", isDark ? 'bg-white/5' : 'bg-white/80')}
                                />
                            </div>
                        </div>
                        <div className={cn("pt-4 space-y-4 border-t", isDark ? 'border-white/5' : 'border-black/5')}>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('profile.changePassword', 'Change Password')}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('profile.newPassword', 'New Password')}</Label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input 
                                            id="password"
                                            type="password"
                                            placeholder="••••"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={cn("rounded-xl pl-10 border-none focus-visible:ring-1", isDark ? 'bg-white/5' : 'bg-white/80')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t('profile.confirm', 'Confirm')}</Label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input 
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={cn("rounded-xl pl-10 border-none focus-visible:ring-1", isDark ? 'bg-white/5' : 'bg-white/80', errors.confirmPassword && "border-destructive border-solid border-2")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-6">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            className="w-full bg-primary text-black font-black uppercase tracking-widest h-12 rounded-2xl flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            {t('profile.saveChanges', 'Save Changes')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
}

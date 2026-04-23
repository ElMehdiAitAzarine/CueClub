'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ChevronLeft, ChevronRight, Gamepad2, UserCircle, Phone, Lock, Check, Camera, Upload, Sparkles, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameType {
    id: number;
    name: string;
    image_path: string;
    description: string;
}

const getGameIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('billiard')) return '🎱';
    if (n.includes('snooker')) return '🎱';
    if (n.includes('carrom')) return '🔘';
    if (n.includes('dart')) return '🎯';
    if (n.includes('ps5') || n.includes('playstation')) return '🎮';
    return '🕹️';
}

const getGameStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('billiard')) return { style: 'hover:bg-blue-500/10 hover:border-blue-500/50', active: 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' };
    if (n.includes('carrom')) return { style: 'hover:bg-amber-500/10 hover:border-amber-500/50', active: 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' };
    if (n.includes('dart')) return { style: 'hover:bg-red-500/10 hover:border-red-500/50', active: 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' };
    return { style: 'hover:bg-primary/10 hover:border-primary/50', active: 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(234,88,12,0.2)]' };
}

export default function SignupPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [profileFile, setProfileFile] = useState<File | null>(null)
    const [selectedGames, setSelectedGames] = useState<string[]>([])
    const [isImageHovered, setIsImageHovered] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [availableGames, setAvailableGames] = useState<GameType[]>([])

    const progress = (step / 3) * 100

    useEffect(() => {
        fetch('/api/sys-admin/game-types')
            .then(res => res.json())
            .then(data => setAvailableGames(data))
            .catch(err => console.error("Failed to fetch games", err))
    }, [])

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.firstName) newErrors.firstName = 'Required'
        if (!formData.lastName) newErrors.lastName = 'Required'
        if (!formData.phone) newErrors.phone = 'Required'
        if (!formData.password) newErrors.password = 'Required'
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
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

    const getPasswordStrength = () => {
        if (!formData.password) return 0
        let strength = 0
        if (formData.password.length > 6) strength += 25
        if (/[A-Z]/.test(formData.password)) strength += 25
        if (/[0-9]/.test(formData.password)) strength += 25
        if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25
        return strength
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Resize image before setting state
            try {
                const resizedFile = await resizeImage(file, 800, 800);
                setProfileFile(resizedFile)
                const reader = new FileReader()
                reader.onloadend = () => {
                    setProfileImage(reader.result as string)
                }
                reader.readAsDataURL(resizedFile)
            } catch (err) {
                console.error("Resizing failed", err);
                // Fallback to original if resizing fails
                setProfileFile(file)
                const reader = new FileReader()
                reader.onloadend = () => {
                    setProfileImage(reader.result as string)
                }
                reader.readAsDataURL(file)
            }
        }
    }

    // Helper function to resize image
    const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const resizedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(resizedFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    }, 'image/jpeg', 0.8); // 80% quality
                };
                img.onerror = () => reject(new Error('Image load failed'));
            };
            reader.onerror = () => reject(new Error('File read failed'));
        });
    }

    const toggleGame = (gameId: string) => {
        setSelectedGames((prev) =>
            prev.includes(gameId)
                ? prev.filter((id) => id !== gameId)
                : [...prev, gameId]
        )
    }

    const handleRegistration = async () => {
        let deviceId = localStorage.getItem('cueclub_device_id')
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('cueclub_device_id', deviceId)
        }

        console.log("DEBUG: Form Data Check", {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            password: formData.password ? "SET" : "EMPTY",
            deviceId: deviceId,
            photoSelected: !!profileFile
        })
        const fd = new FormData()
        fd.append('first_name', formData.firstName)
        fd.append('last_name', formData.lastName)
        fd.append('phone', formData.phone)
        fd.append('email', formData.email)
        fd.append('password', formData.password)
        const trimmedDeviceId = deviceId?.trim();
        fd.append('device_id', trimmedDeviceId)
        if (profileFile) {
            fd.append('photo', profileFile)
        }

        const apiUrl = `/api/signup`;
        setIsSubmitting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                mode: "cors",
                credentials: "omit",
                headers: {
                },
                body: fd,
                signal: controller.signal
            })
            clearTimeout(timeoutId);
            const contentType = res.headers.get("content-type");
            let result;
            if (contentType && contentType.includes("application/json")) {
                result = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response received:", text);
                alert(`Server returned an unexpected response format. Please try again or check the server logs.\n\nResponse snippet: ${text.substring(0, 100)}`);
                return;
            }

            if (res.ok) {
                // Store session
                localStorage.setItem('cueclub_user_id', result.id);
                localStorage.setItem('cueclub_user_name', `${formData.firstName} ${formData.lastName}`);
                localStorage.setItem('cueclub_logged_in', 'true');
                setStep(3)
            } else {
                alert(result.detail || result.message || "Registration failed")
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                alert('Request timed out. Please check your connection and try again.');
            } else {
                alert(`Connection failure! Attempted: ${apiUrl}\nError: ${err.message || 'Unknown network error'}`)
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2)
        } else if (step === 2) {
            handleRegistration()
        } else if (step < 3) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const passwordStrength = getPasswordStrength()

    return (
        <div className="dark min-h-screen bg-background flex flex-col selection:bg-primary/30 h-screen overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-secondary/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header / Logo */}
            <header className="p-4 relative z-10 shrink-0">
                <Link href="/" className="flex items-center gap-4 w-fit group">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        {/* Intensity Lamp / Glow Effect */}
                        <div className="absolute inset-0 bg-white/60 blur-2xl rounded-full scale-110 opacity-70" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.9)_0%,_transparent_80%)] rounded-full animate-pulse-slow" />

                        <div className="relative w-14 h-14 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform duration-500 shadow-2xl shadow-primary/30 overflow-hidden border border-white/20">
                            <span className="text-white font-black text-3xl drop-shadow-lg">C</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-foreground block leading-tight tracking-tighter">Cue-Club</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Excellence Defined</span>
                    </div>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-2 relative z-10 overflow-hidden min-h-0">
                <div className="w-full max-w-lg space-y-3 px-2 flex flex-col min-h-0">
                    {/* Progress Indicator */}
                    {step < 3 && (
                        <div className="space-y-2 shrink-0">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-lg md:text-xl font-bold text-foreground">Create Account</h1>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Step {step} of 3</p>
                                </div>
                            </div>
                            <div className="relative h-1 bg-border/30 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-700 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <Card className="border-white/10 shadow-2xl bg-[#09090b]/80 backdrop-blur-xl overflow-hidden rounded-3xl border flex flex-col min-h-0">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col min-h-0 overflow-y-auto md:overflow-hidden">
                                <CardHeader className="text-center py-3 shrink-0">
                                    <div className="mx-auto mb-2 relative">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <button
                                            onMouseEnter={() => setIsImageHovered(true)}
                                            onMouseLeave={() => setIsImageHovered(false)}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "w-16 h-16 rounded-full border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center overflow-hidden relative group mx-auto",
                                                profileImage
                                                    ? "border-primary/50 shadow-lg shadow-primary/10"
                                                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                                            )}
                                        >
                                            {profileImage ? (
                                                <>
                                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    <div className={cn(
                                                        "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300",
                                                        isImageHovered ? "opacity-100" : "opacity-0"
                                                    )}>
                                                        <Camera className="text-white mb-0.5" size={14} />
                                                        <span className="text-[7px] text-white font-medium uppercase tracking-widest">Edit</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="text-primary mb-1" size={14} />
                                                    <span className="text-[7px] text-muted-foreground font-medium uppercase tracking-widest px-2 text-center leading-tight">Photo</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <CardTitle className="text-base font-bold">Personal Profile</CardTitle>
                                    <CardDescription className="text-[10px]">Enter your member details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2.5 pt-0 px-6 pb-2 shrink-1 overflow-visible">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1 group">
                                            <Label htmlFor="firstName" className={cn("text-[9px] uppercase tracking-widest text-muted-foreground transition-colors", errors.firstName ? "text-destructive" : "group-focus-within:text-primary")}>First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={cn("h-9 bg-white/5 border-white/10 transition-all rounded-lg text-xs", errors.firstName ? "border-destructive/50 focus:border-destructive" : "focus:border-primary/50 focus:ring-primary/20")}
                                            />
                                        </div>
                                        <div className="space-y-1 group">
                                            <Label htmlFor="lastName" className={cn("text-[9px] uppercase tracking-widest text-muted-foreground transition-colors", errors.lastName ? "text-destructive" : "group-focus-within:text-primary")}>Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={cn("h-9 bg-white/5 border-white/10 transition-all rounded-lg text-xs", errors.lastName ? "border-destructive/50 focus:border-destructive" : "focus:border-primary/50 focus:ring-primary/20")}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1 group">
                                            <Label htmlFor="phone" className={cn("text-[9px] uppercase tracking-widest text-muted-foreground transition-colors", errors.phone ? "text-destructive" : "group-focus-within:text-primary")}>Phone Number</Label>
                                            <div className="relative">
                                                <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 transition-colors", errors.phone ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary")} />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+212 ..."
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={cn("h-9 pl-8 bg-white/5 border-white/10 transition-all rounded-lg text-xs", errors.phone ? "border-destructive/50 focus:border-destructive" : "focus:border-primary/50 focus:ring-primary/20")}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1 group">
                                            <Label htmlFor="email" className="text-[9px] uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Email (Optional)</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="h-9 pl-8 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1 group">
                                            <Label htmlFor="password" className={cn("text-[9px] uppercase tracking-widest text-muted-foreground transition-colors", errors.password ? "text-destructive" : "group-focus-within:text-primary")}>Password</Label>
                                            <div className="relative">
                                                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 transition-colors", errors.password ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary")} />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className={cn("h-9 pl-8 bg-white/5 border-white/10 transition-all rounded-lg text-xs", errors.password ? "border-destructive/50 focus:border-destructive" : "focus:border-primary/50 focus:ring-primary/20")}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1 group">
                                            <Label htmlFor="confirmPassword" className={cn("text-[9px] uppercase tracking-widest text-muted-foreground transition-colors", errors.confirmPassword ? "text-destructive" : "group-focus-within:text-primary")}>Confirm</Label>
                                            <div className="relative">
                                                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 transition-colors", errors.confirmPassword ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary")} />
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    placeholder="••••"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className={cn("h-9 pl-8 bg-white/5 border-white/10 transition-all rounded-lg text-xs", errors.confirmPassword ? "border-destructive/50 focus:border-destructive" : "focus:border-primary/50 focus:ring-primary/20")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {formData.password && (
                                        <div className="space-y-1 px-1 shrink-0">
                                            <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
                                                <span className="text-muted-foreground">Security</span>
                                                <span className={cn("font-bold", passwordStrength <= 25 ? "text-destructive" : passwordStrength <= 50 ? "text-amber-500" : passwordStrength <= 75 ? "text-blue-500" : "text-emerald-500")}>
                                                    {passwordStrength <= 25 ? "Weak" : passwordStrength <= 50 ? "Fair" : passwordStrength <= 75 ? "Strong" : "Ideal"}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 h-0.5">
                                                {[25, 50, 75, 100].map((level) => (
                                                    <div key={level} className={cn("h-full flex-1 rounded-full", passwordStrength >= level ? (passwordStrength <= 25 ? "bg-destructive text-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]" : passwordStrength <= 50 ? "bg-amber-500" : passwordStrength <= 75 ? "bg-blue-500" : "bg-emerald-500") : "bg-white/10")} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="px-6 pb-5 pt-1 shrink-0">
                                    <Button onClick={handleNext} className="w-full h-11 text-sm font-bold rounded-xl group relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20">
                                        <span className="relative z-10 flex items-center">
                                            Continue to Interests
                                            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>
                                </CardFooter>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-700 flex flex-col min-h-0">
                                <CardHeader className="py-4 shrink-0">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Gamepad2 className="text-primary" size={20} />
                                        Your Arena
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">
                                        Select your competitive focus
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-6 space-y-2 shrink-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableGames.map((game) => {
                                            const { style, active } = getGameStyle(game.name);
                                            const isSelected = selectedGames.includes(String(game.id));
                                            return (
                                                <button
                                                    key={game.id}
                                                    type="button"
                                                    onClick={() => toggleGame(String(game.id))}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group/game",
                                                        style,
                                                        isSelected ? active : "border-white/5 bg-white/[0.02]"
                                                    )}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/game:opacity-100 transition-opacity" />
                                                    <div className="text-3xl relative z-10">{getGameIcon(game.name)}</div>
                                                    <div className="flex-1 min-w-0 relative z-10">
                                                        <h4 className="font-black uppercase tracking-tight text-white line-clamp-1 group-hover/game:text-primary transition-colors">
                                                            {game.name}
                                                        </h4>
                                                        <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">{game.description}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg shadow-primary/20 relative z-10">
                                                            <Check className="h-3 w-3 stroke-[3px]" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                                <CardFooter className="px-6 pb-5 pt-3 flex gap-3 shrink-0">
                                    <Button variant="ghost" onClick={handleBack} className="h-11 px-4 rounded-xl hover:bg-white/5 text-xs font-semibold" disabled={isSubmitting}>
                                        Back
                                    </Button>
                                    <Button onClick={handleNext} className="flex-1 h-11 text-sm font-bold rounded-xl group shadow-lg shadow-primary/20 transition-all duration-300" disabled={selectedGames.length === 0 || isSubmitting}>
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <>
                                                Finalize Registration
                                                <CheckCircle2 className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in zoom-in-95 duration-1000 flex flex-col min-h-0">
                                <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-primary/20 rounded-full absolute inset-0 blur-2xl animate-pulse" />
                                        <div className="w-24 h-24 rounded-full border-2 border-primary bg-card/50 overflow-hidden relative shadow-2xl">
                                            {profileImage ? (
                                                <img src={profileImage} alt="Welcome" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                    <UserCircle size={48} className="text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-2 rounded-xl shadow-xl shadow-primary/30">
                                            <Sparkles size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                                            Welcome to Cue-Club!
                                        </h2>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            Your legacy begins today.
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => router.push('/home')} className="w-full h-12 text-sm font-bold rounded-xl bg-white text-black hover:bg-neutral-200 transition-all duration-300" size="lg">
                                        Enter Club House
                                    </Button>
                                </CardContent>
                            </div>
                        )}
                    </Card>

                    {step < 3 && (
                        <p className="text-center text-[10px] text-muted-foreground pt-1 shrink-0">
                            Already part of the legacy?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-bold underline underline-offset-4 decoration-primary/30">
                                Log in
                            </Link>
                        </p>
                    )}
                </div>
            </main>

            <footer className="py-4 text-center text-[7px] text-muted-foreground uppercase tracking-[0.3em] opacity-40 shrink-0">
                © 2026 Cue-Club Game • Professional Cue Sports Foundation
            </footer>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite ease-in-out;
                }
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

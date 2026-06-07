'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ChevronLeft, ChevronRight, UserCircle, Phone, Lock, Check, Camera, Upload, Sparkles, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'



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
    const [isImageHovered, setIsImageHovered] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const progress = (step / 2) * 100



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



    const handleRegistration = async () => {
        console.log("DEBUG: Form Data Check", {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            password: formData.password ? "SET" : "EMPTY",
            photoSelected: !!profileFile
        })
        const fd = new FormData()
        fd.append('first_name', formData.firstName)
        fd.append('last_name', formData.lastName)
        fd.append('phone', formData.phone)
        fd.append('email', formData.email)
        fd.append('password', formData.password)
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
                setStep(2)
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
            if (validateStep1()) handleRegistration()
        }
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const passwordStrength = getPasswordStrength()

    return (
        <div className="dark min-h-screen bg-background flex flex-col selection:bg-primary/30 h-screen overflow-hidden">


            {/* Header / Logo */}
            <header className="p-4 relative z-10 shrink-0">
                <Link href="/" className="flex items-center gap-4 w-fit group">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="relative w-14 h-14 bg-primary rounded-md flex items-center justify-center">
                            <span className="text-white font-black text-3xl">C</span>
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
                    {step < 2 && (
                        <div className="space-y-2 shrink-0">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-lg md:text-xl font-bold text-foreground">Create Account</h1>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Step {step} of 2</p>
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

                    <Card className="border-white/10 bg-[#09090b] overflow-hidden rounded-md border flex flex-col min-h-0">
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
                                    <Button onClick={handleNext} className="w-full h-11 text-sm font-bold rounded-md group relative overflow-hidden bg-primary hover:bg-primary/90 transition-colors duration-200" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2 justify-center w-full">
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="relative z-10 flex items-center justify-center w-full">
                                                Finalize Registration
                                                <CheckCircle2 className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in zoom-in-95 duration-1000 flex flex-col min-h-0">
                                <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-2 border-primary bg-card/50 overflow-hidden relative">
                                            {profileImage ? (
                                                <img src={profileImage} alt="Welcome" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                    <UserCircle size={48} className="text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-2 rounded-md">
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
                                    <Button onClick={() => router.push('/home')} className="w-full h-12 text-sm font-bold rounded-md bg-white text-black hover:bg-neutral-200 transition-colors duration-200" size="lg">
                                        Enter Club House
                                    </Button>
                                </CardContent>
                            </div>
                        )}
                    </Card>

                    {step < 2 && (
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


        </div>
    )
}

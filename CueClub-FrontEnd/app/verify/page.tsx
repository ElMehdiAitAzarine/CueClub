'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Verifying your QR token...')

    useEffect(() => {
        const token = searchParams.get('token')

        if (!token) {
            setStatus('Invalid QR code scanned. No token found.')
            setTimeout(() => router.push('/'), 3000)
            return
        }

        const verifyToken = async () => {
            let deviceId = localStorage.getItem('cueclub_device_id')
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).substr(2, 9)
                localStorage.setItem('cueclub_device_id', deviceId)
            }

            const trimmedDeviceId = deviceId?.trim();
            console.log("DEBUG: Verifying device:", trimmedDeviceId);
            try {
                const response = await fetch(`/api/verify-scan`, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        device_id: trimmedDeviceId,
                        daily_token: token
                    })
                })

                const data = await response.json()

                if (response.ok && data.status === 'logged_in') {
                    // Save session to localStorage
                    localStorage.setItem('cueclub_user_id', String(data.id))
                    localStorage.setItem('cueclub_user_name', data.user)
                    localStorage.setItem('cueclub_logged_in', 'true')
                    
                    setStatus(`Access Authorized! Redirecting...`)
                    // Immediate redirect for "automatic" feel
                    router.push('/home')
                } else if (data.status === 'unregistered') {
                    setStatus('Device not recognized. Redirecting to registration...')
                    // Clear any stale session
                    localStorage.removeItem('cueclub_user_id')
                    localStorage.removeItem('cueclub_user_name')
                    localStorage.removeItem('cueclub_logged_in')
                    setTimeout(() => router.push('/signup'), 1500) // Reduced delay
                } else {
                    setStatus(data.detail || 'Verification failed. Please try again.')
                    setTimeout(() => router.push('/'), 2000) // Reduced delay
                }
            } catch (error) {
                setStatus('Connection to server failed. Redirecting...')
                setTimeout(() => router.push('/signup'), 1500) // Reduced delay
            }
        }

        verifyToken()
    }, [router, searchParams])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="animate-spin mb-6 text-primary" size={64} />
            <h1 className="text-2xl font-black uppercase text-white tracking-widest text-center px-4">
                {status}
            </h1>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <div className="dark min-h-screen bg-[#0A0A0A] flex items-center justify-center noise-texture">
            <Suspense fallback={<Loader2 className="animate-spin text-primary" size={64} />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}

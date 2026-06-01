'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import GamesSection from '@/components/GamesSection'
import FeaturesSection from '@/components/FeaturesSection'
import Footer from '@/components/Footer'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loggedIn = localStorage.getItem('cueclub_logged_in')
    const storedId = localStorage.getItem('cueclub_user_id')
    const storedName = localStorage.getItem('cueclub_user_name')

    if (loggedIn === 'true' && storedId && storedName) {
      // Check session expiration
      const loginTimestamp = localStorage.getItem('cueclub_user_login_timestamp')
      const sessionDuration = parseFloat(localStorage.getItem('cueclub_user_session_duration') || '24')
      
      let expired = false
      if (loginTimestamp) {
        const loginTime = new Date(loginTimestamp).getTime()
        const elapsedHours = (Date.now() - loginTime) / (1000 * 60 * 60)
        if (elapsedHours > sessionDuration) {
          expired = true
        }
      } else {
        expired = true
      }

      if (!expired) {
        router.replace('/home')
        return
      }
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="dark min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        <Hero />
        <GamesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}


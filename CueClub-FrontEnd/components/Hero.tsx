'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Magnetic from './Magnetic'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function Hero() {
  const { t } = useTranslation()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  const yPosText = useTransform(scrollY, [0, 500], [0, 100])

  const handleStartPlaying = () => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('cueclub_logged_in')
    if (isLoggedIn === 'true') {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-texture"
    >
      {/* Premium Static Background Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/images/bg_billiardo.jpg"
          alt="Billiards Background"
          className="w-full h-full object-cover"
        />
        {/* Balanced Darkness & Shadowing */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/80" />
      </motion.div>

      {/* Flat Panel Card Container */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center pt-20 md:pt-24 h-full justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card/90 border border-border p-6 md:p-10 rounded-md max-w-4xl w-full text-center flex flex-col items-center gap-4 md:gap-6"
        >
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="space-y-2">
              <motion.span
                initial={{ opacity: 0, letterSpacing: '0.2em' }}
                animate={{ opacity: 1, letterSpacing: '0.05em' }}
                transition={{ delay: 0.2, duration: 1 }}
                className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]"
              >
                {t('landing.heroPretitle', 'Excellence in Precision')}
              </motion.span>

              <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white uppercase">
                {t('landing.heroTitleLine1', 'MASTER THE ART OF')}<br />
                <span className="text-primary">{t('landing.heroTitleLine2', 'PRECISION')}</span>
              </h1>
            </div>

            <p className="text-xs md:text-base text-muted-foreground max-w-lg leading-relaxed">
              {t('landing.heroSubtitle', 'Where luxury meets competitive play. Join our world-class facilities for billiards, pool, carrom, and darts.')}
            </p>

            <div className="flex flex-col items-center gap-6 mt-2 w-full">
              <Button
                size="lg"
                onClick={handleStartPlaying}
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-md font-bold tracking-widest uppercase px-8 h-12 shadow-sm transition-colors text-xs"
              >
                {t('landing.start', 'Start')} {t('landing.playing', 'PLAYING')} {t('landing.now', 'Now')}
              </Button>

              <Link href="#tour">
                <button className="text-muted-foreground hover:text-white flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase transition-colors group">
                  <Play size={10} className="fill-current" />
                  {t('landing.virtualTour', 'Experience the Virtual Tour')}
                  <span className="h-[1px] w-0 bg-primary group-hover:w-6 transition-all duration-200 ml-2" />
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Particles (Chalk Dust Simulation) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {mounted && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: 0
            }}
            animate={{
              y: [null, '-20%', '120%'],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-1 h-1 bg-white/40 blur-[1px] rounded-full"
          />
        ))}
      </div>
    </section>
  )
}

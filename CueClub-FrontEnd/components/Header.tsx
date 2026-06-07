'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Magnetic from './Magnetic'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Read session from localStorage
    const loggedIn = localStorage.getItem('cueclub_logged_in')
    const name = localStorage.getItem('cueclub_user_name')
    if (loggedIn === 'true' && name) {
      setUserName(name)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('cueclub_logged_in')
    localStorage.removeItem('cueclub_user_id')
    localStorage.removeItem('cueclub_user_name')
    setUserName(null)
  }

  const navLinks = [
    { name: t('landing.philosophy', 'Philosophy'), href: '/#about' },
    { name: t('landing.games', 'Games'), href: '/#games' },
    { name: t('landing.excellence', 'Excellence'), href: '/#features' },
    { name: t('landing.menu', 'Menu'), href: '/menu' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 border-b border-border py-3 backdrop-blur-md"
    >
      <nav className="container mx-auto px-6 flex items-center justify-between lg:justify-center lg:gap-12">
        {/* Logo */}
        <Link href={userName ? "/home" : "/"} className="flex items-center gap-2 md:gap-3 group shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-transparent flex items-center justify-center shrink-0">
            <img src="/images/logo-cueclub.png" alt="CueClub Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg md:text-2xl font-bold text-white tracking-tight hidden sm:block">
            CUE-<span className="text-primary">CLUB</span>
          </span>
        </Link>

        {/* Desktop Navigation Group - Uniform Spacing */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors duration-200 group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-200" />
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {userName ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                {userName.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="text-white/45 hover:text-red-500 transition-colors p-1"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="outline" className="text-primary border-border hover:bg-muted transition-colors font-bold tracking-widest text-[10px] whitespace-nowrap px-4 h-10 rounded-md">
                {t('landing.memberLogin', 'MEMBER LOGIN')}
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2 hover:bg-white/5 rounded-md transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} className="md:w-7 md:h-7" /> : <Menu size={24} className="md:w-7 md:h-7" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-card border-t border-border"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-2xl font-bold text-foreground hover:text-primary transition-colors uppercase tracking-tight"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="h-[1px] bg-border my-2" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {userName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-bold text-base uppercase tracking-widest">{userName.split(' ')[0]}</span>
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="flex items-center gap-2 text-red-500 text-sm font-bold uppercase tracking-widest">
                      <LogOut size={16} /> {t('landing.signOut', 'Sign Out')}
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" className="w-full border border-border text-foreground font-medium h-10 rounded-md text-xs tracking-widest uppercase">
                      {t('landing.memberLogin', 'MEMBER LOGIN')}
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

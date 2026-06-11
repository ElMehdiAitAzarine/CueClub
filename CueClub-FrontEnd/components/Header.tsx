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
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-md py-3 md:py-4 glass-panel m-3 md:m-4 rounded-[20px] md:rounded-3xl border-white/5 shadow-2xl shadow-black/20"
    >
      <nav className="container mx-auto px-6 flex items-center justify-between lg:justify-center lg:gap-12">
        {/* Logo */}
        <Link href={userName ? "/home" : "/"} className="flex items-center gap-2 md:gap-3 group shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-transparent rounded-[10px] md:rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-primary/20">
            <img src="/images/logo-cueclub.png" alt="CueClub Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg md:text-2xl font-black text-white tracking-tighter hidden sm:block">
            CUE-<span className="text-primary">CLUB</span>
          </span>
        </Link>

        {/* Desktop Navigation Group - Uniform Spacing */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors duration-300 group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {userName ? (
            <Magnetic>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {userName.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="text-white/40 hover:text-red-400 transition-colors p-1"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </Magnetic>
          ) : (
            <Magnetic>
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline" className="text-amber-400 border-amber-400/20 hover:bg-amber-400/10 transition-all duration-500 font-bold tracking-widest text-[10px] whitespace-nowrap px-4 h-12 rounded-2xl">
                  {t('landing.memberLogin', 'MEMBER LOGIN')}
                </Button>
              </Link>
            </Magnetic>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
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
            className="lg:hidden overflow-hidden bg-[#171717] border-t border-white/5"
          >
            <div className="container mx-auto px-6 py-10 flex flex-col gap-8">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-3xl font-black text-white hover:text-primary transition-colors uppercase tracking-tight"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="h-[1px] bg-white/5 my-4" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {userName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg uppercase tracking-widest">{userName.split(' ')[0]}</span>
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="flex items-center gap-2 text-red-400 text-sm font-bold uppercase tracking-widest">
                      <LogOut size={16} /> {t('landing.signOut', 'Sign Out')}
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-white/10 text-white font-bold h-16 rounded-2xl text-xs tracking-widest uppercase">
                      {t('landing.memberLogin', 'MEMBER LOGIN')}
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Magnetic from './Magnetic'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="relative bg-[#0A0A0A] pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Newsletter Section - Flat Panel */}
        <div
          className="bg-card border border-border p-6 md:p-10 rounded-md mb-16 relative overflow-hidden group"
        >
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {t('landing.joinInnerCircle', 'JOIN THE')} <span className="text-primary">{t('landing.innerCircle', 'INNER CIRCLE')}</span>
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {t('landing.joinDesc', 'Receive exclusive invites to leagues, private events, and professional masterclasses.')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-background border border-border rounded-md">
              <Input
                type="email"
                placeholder="Excellence@cueclub.com"
                className="bg-transparent border-0 text-white placeholder:text-muted-foreground/50 h-10 pl-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-md font-bold transition-colors tracking-widest text-xs shrink-0">
                <span className="flex items-center">
                  {t('landing.subscribe', 'SUBSCRIBE')}
                  <Send className="ml-2" size={14} />
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Main Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight uppercase">
                Cue-<span className="text-primary">Club</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('landing.establishing', 'Establishing the global benchmark for luxury cue sports and precision gaming since 2018.')}
            </p>
            <div className="flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('landing.navigation', 'Navigation')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('landing.philosophy', 'Philosophy'), href: '/#about' },
                { name: t('landing.arenas', 'Arenas'), href: '/#games' },
                { name: t('landing.excellence', 'Excellence'), href: '/#features' },
                { name: t('landing.ourMenu', 'Our Menu'), href: '/menu' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-white font-medium text-sm transition-colors flex items-center group">
                    <span className="w-0 h-[1.5px] bg-primary group-hover:w-3 transition-all duration-200 mr-0 group-hover:mr-2" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('landing.headquarters', 'Headquarters')}</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start group">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground pt-1">
                  7th Avenue, Cue Plaza<br />New York, NY 10019
                </span>
              </li>
              <li className="flex gap-3 items-center group">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground tracking-wide">
                  +1 (800) ELITE-PL
                </span>
              </li>
              <li className="flex gap-3 items-center group">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  concierge@cueclub.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#525252] font-bold text-sm tracking-widest uppercase">
            {t('landing.copyright', '© 2024 CUE-CLUB GLOBAL. MASTER THE ART OF PRECISION.')}
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-[#525252] hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">{t('landing.privacyPolicy', 'Privacy Policy')}</Link>
            <Link href="#" className="text-[#525252] hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">{t('landing.termsOfExcellence', 'Terms of Excellence')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

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
        {/* Newsletter Section - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-8 md:p-16 rounded-[40px] mb-24 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          {/* Inner Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                {t('landing.joinInnerCircle', 'JOIN THE')} <span className="text-gradient">{t('landing.innerCircle', 'INNER CIRCLE')}</span>
              </h3>
              <p className="text-[#A3A3A3] text-lg max-w-md font-medium">
                {t('landing.joinDesc', 'Receive exclusive invites to leagues, private events, and professional masterclasses.')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <Input
                type="email"
                placeholder="Excellence@cueclub.com"
                className="bg-transparent border-0 text-white placeholder:text-white/20 h-14 pl-6 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
              />
              <Magnetic>
                <Button className="relative bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-white h-14 px-12 rounded-2xl font-black transition-all duration-500 group border-0 tracking-widest text-sm overflow-hidden shadow-[0_15px_30px_rgba(234,88,12,0.3)] hover:scale-105 active:scale-95">
                  <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] group-hover:animate-shine-once" />
                  <span className="relative z-10 flex items-center">
                    {t('landing.subscribe', 'SUBSCRIBE')}
                    <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
                  </span>
                </Button>
              </Magnetic>
            </div>
          </div>
        </motion.div>

        {/* Footer Main Content */}
        <div className="grid md:grid-cols-3 gap-16 mb-20">
          {/* Column 1: Brand */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] rounded-xl flex items-center justify-center rotate-3">
                <span className="text-white font-black text-2xl">C</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter uppercase">
                Cue-<span className="text-primary">Club</span>
              </span>
            </Link>
            <p className="text-[#A3A3A3] text-lg font-medium leading-relaxed">
              {t('landing.establishing', 'Establishing the global benchmark for luxury cue sports and precision gaming since 2018.')}
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <Magnetic key={i}>
                  <Link
                    href="#"
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all duration-500 hover:-translate-y-1 shadow-lg hover:shadow-primary/20"
                  >
                    <Icon size={20} />
                  </Link>
                </Magnetic>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-8">
            <h4 className="text-white font-black text-xl uppercase tracking-widest">{t('landing.navigation', 'Navigation')}</h4>
            <ul className="space-y-4">
              {[
                { name: t('landing.philosophy', 'Philosophy'), href: '/#about' },
                { name: t('landing.arenas', 'Arenas'), href: '/#games' },
                { name: t('landing.excellence', 'Excellence'), href: '/#features' },
                { name: t('landing.ourMenu', 'Our Menu'), href: '/menu' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[#A3A3A3] hover:text-white font-bold text-lg transition-colors flex items-center group">
                    <span className="w-0 h-[2px] bg-primary group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-3" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-8">
            <h4 className="text-white font-black text-xl uppercase tracking-widest">{t('landing.headquarters', 'Headquarters')}</h4>
            <ul className="space-y-6">
              <li className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <MapPin size={20} className="text-primary" />
                </div>
                <span className="text-lg text-[#A3A3A3] font-medium pt-1">
                  7th Avenue, Cue Plaza<br />New York, NY 10019
                </span>
              </li>
              <li className="flex gap-4 items-center group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Phone size={20} className="text-primary" />
                </div>
                <span className="text-lg text-[#A3A3A3] font-medium tracking-wide">
                  +1 (800) ELITE-PL
                </span>
              </li>
              <li className="flex gap-4 items-center group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Mail size={20} className="text-primary" />
                </div>
                <span className="text-lg text-[#A3A3A3] font-medium">
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

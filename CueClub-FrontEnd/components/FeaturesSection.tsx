'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Clock, Zap, Sparkles, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function FeaturesSection() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Trophy,
      title: t('landing.feat1Title', 'Competitive Leagues'),
      description: t('landing.feat1Desc', 'Quarterly tournaments with global rankings and significant prize pools for club members.'),
    },
    {
      icon: Users,
      title: t('landing.feat2Title', 'Member Network'),
      description: t('landing.feat2Desc', 'Connect with executives and professionals who share your passion for cue sports mastery.'),
    },
    {
      icon: Clock,
      title: t('landing.feat3Title', '24/7 Access'),
      description: t('landing.feat3Desc', 'Your membership grants round-the-clock entry to our private lounge and specialized arenas.'),
    },
    {
      icon: Zap,
      title: t('landing.feat4Title', 'Pro Equipment'),
      description: t('landing.feat4Desc', 'Regulation-grade tables and bespoke cues maintained daily to professional standards.'),
    },
    {
      icon: Sparkles,
      title: t('landing.feat5Title', 'Master Classes'),
      description: t('landing.feat5Desc', 'Personalized instruction from sanctioned professionals to refine your precision and strategy.'),
    },
    {
      icon: Shield,
      title: t('landing.feat6Title', 'Private Sanctuaries'),
      description: t('landing.feat6Desc', 'Exquisite, high-security facilities designed for focused play and premium comfort.'),
    },
  ]

  return (
    <section id="features" className="py-32 bg-[#0A0A0A] relative overflow-hidden">

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
          >
            {t('landing.the', 'THE')} <span className="text-gradient">{t('landing.advantage', 'ADVANTAGE')}</span>
          </motion.h2>
          <p className="text-[#A3A3A3] text-lg md:text-xl font-medium">
            {t('landing.featuresIntro', 'Beyond the game. Discover a world-class environment engineered for precision, networking, and peak performance.')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: (index % 3) * 0.1 + (Math.floor(index / 3) * 0.2),
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1]
                }}
                viewport={{ once: true }}
                className="group p-6 md:p-10 rounded-md bg-[#171717] border border-white/5 hover:border-primary/50 transition-colors duration-200"
              >
                {/* Icon Container */}
                <div className="mb-6 h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-primary" />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[#A3A3A3] text-sm md:text-base leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

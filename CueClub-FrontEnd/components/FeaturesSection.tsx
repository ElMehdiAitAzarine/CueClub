'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Clock, Zap, Sparkles, Shield } from 'lucide-react'

const features = [
  {
    icon: Trophy,
    title: 'Competitive Leagues',
    description: 'Quarterly tournaments with global rankings and significant prize pools for club members.',
  },
  {
    icon: Users,
    title: 'Member Network',
    description: 'Connect with executives and professionals who share your passion for cue sports mastery.',
  },
  {
    icon: Clock,
    title: '24/7 Access',
    description: 'Your membership grants round-the-clock entry to our private lounge and specialized arenas.',
  },
  {
    icon: Zap,
    title: 'Pro Equipment',
    description: 'Regulation-grade tables and bespoke cues maintained daily to professional standards.',
  },
  {
    icon: Sparkles,
    title: 'Master Classes',
    description: 'Personalized instruction from sanctioned professionals to refine your precision and strategy.',
  },
  {
    icon: Shield,
    title: 'Private Sanctuaries',
    description: 'Exquisite, high-security facilities designed for focused play and premium comfort.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
          >
            THE <span className="text-gradient">ADVANTAGE</span>
          </motion.h2>
          <p className="text-[#A3A3A3] text-lg md:text-xl font-medium">
            Beyond the game. Discover a world-class environment engineered for precision, networking, and peak performance.
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
                className="group p-6 md:p-10 rounded-[32px] bg-[#171717] border border-white/5 hover:border-primary/50 transition-all duration-700 hover:-translate-y-2"
              >
                {/* Icon Container */}
                <div className="mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F59E0B] flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-primary/20">
                  <Icon className="h-7 w-7 text-white" />
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

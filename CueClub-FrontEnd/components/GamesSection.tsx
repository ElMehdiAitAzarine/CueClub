'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight } from 'lucide-react'

const games = [
  {
    id: 1,
    title: 'Billiards',
    description: 'Precision cue sports played on professional felt with world-class equipment.',
    image: '/images/billiards.png',
    color: '#06B6D4', // Cyan
  },
  {
    id: 2,
    title: 'Carrom',
    description: 'A traditional masterpiece of precision and strategy on handcrafted wooden boards.',
    image: '/images/carrom.jpg',
    color: '#F59E0B', // Amber
  },
  {
    id: 3,
    title: 'Darts',
    description: 'The ultimate test of focus and accuracy on regulation competition boards.',
    image: '/images/darts.jpg',
    color: '#FB7185', // Rose
  },
]

export default function GamesSection() {
  return (
    <section id="games" className="py-32 bg-[#0A0A0A] noise-texture overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-20">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
          >
            OUR <span className="text-gradient">ARENAS</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#A3A3A3]"
          >
            Dive into our premium selection of precision-based games. Each arena is designed to provide an unparalleled competitive experience.
          </motion.p>
        </div>

        {/* Games Grid / Mobile Horizontal Scroll */}
        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-8 pb-8 md:pb-0 no-scrollbar snap-x snap-mandatory">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[85vw] md:w-full snap-center group"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] bg-[#171717] border border-white/5 transition-all duration-700 hover:shadow-[0_20px_80px_-15px_rgba(234,88,12,0.15)] group-hover:-translate-y-3">
                {/* Image Treatment */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-110 blur-0 group-hover:blur-[2px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,var(--primary-glow),transparent_70%)]" style={{ '--primary-glow': game.color } as any} />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
                  <motion.h3
                    style={{ color: game.color }}
                    className="text-3xl md:text-4xl font-black mb-3 tracking-tighter"
                  >
                    {game.title}
                  </motion.h3>
                  <p className="text-[#A3A3A3] text-sm md:text-base mb-6 line-clamp-2 pr-12 transition-colors group-hover:text-white">
                    {game.description}
                  </p>

                  {/* Click Area / Arrow */}
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    Enter Arena
                    <ChevronRight className="text-white bg-primary p-1 rounded-full" size={20} />
                  </div>
                </div>

                {/* Glass Border Overlay on Hover */}
                <div className="absolute inset-0 border-[1px] border-white/0 group-hover:border-white/20 rounded-[32px] transition-all duration-700 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

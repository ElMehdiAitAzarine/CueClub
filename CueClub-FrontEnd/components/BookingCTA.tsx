'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function BookingCTA() {
    const [isVisible, setIsVisible] = useState(false)
    const [counter, setCounter] = useState(3)

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past hero
            setIsVisible(window.scrollY > 800)
        }
        window.addEventListener('scroll', handleScroll)

        // Scarcity Counter Simulation
        const interval = setInterval(() => {
            setCounter(prev => (prev > 1 ? prev - (Math.random() > 0.8 ? 1 : 0) : 3))
        }, 10000)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            clearInterval(interval)
        }
    }, [])

    return (
        <>
            {/* Desktop Floating Action Button */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Button
                        className="group relative h-20 w-20 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F59E0B] shadow-[0_20px_40px_rgba(234,88,12,0.4)] border-0 flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-white rounded-full"
                        />
                        <Calendar className="text-white relative z-10" size={32} />
                    </Button>

                    <AnimatePresence>
                        {isVisible && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute bottom-full right-0 mb-4 bg-white p-4 rounded-2xl shadow-2xl w-64 border border-white/10 pointer-events-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-black font-black text-xs uppercase tracking-widest">
                                        Available Now
                                    </span>
                                </div>
                                <p className="text-[#525252] text-sm font-bold mt-1">
                                    Only {counter} tables remaining for tonight.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Mobile Sticky Bottom Bar */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4"
                    >
                        <div className="bg-[#171717]/90 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Limited Access</span>
                                <span className="text-primary font-bold text-sm">{counter} Tables Left</span>
                            </div>
                            <Button className="bg-primary hover:bg-[#F59E0B] text-white font-black px-8 rounded-2xl h-12 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                BOOK NOW
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

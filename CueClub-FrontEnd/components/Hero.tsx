'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, Loader2, QrCode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Magnetic from './Magnetic'

export default function Hero() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  const yPosText = useTransform(scrollY, [0, 500], [0, 100])

  const handleStartPlaying = () => {
    setIsScanning(true)
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isScanning) return;

    let html5QrCode: any = null;
    let isComponentMounted = true;

    // Poll until AnimatePresence finishes and #reader is in the DOM
    const initScanner = setInterval(async () => {
      if (!isComponentMounted || !document.getElementById("reader")) return;

      clearInterval(initScanner);
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!isComponentMounted) return;
      html5QrCode = new Html5Qrcode("reader");

      const onScanSuccess = async (decodedText: string) => {
        if (!isComponentMounted) return;

        try {
          if (html5QrCode?.isScanning) {
            await html5QrCode.stop();
          }
        } catch (err) {
          console.error("Failed to stop scanner", err);
        }
        setIsScanning(false);

        // Extract token
        let token = decodedText;
        try {
          const url = new URL(decodedText);
          const urlToken = url.searchParams.get("token");
          if (urlToken) token = urlToken;
        } catch (e) {
          // If it fails URL parsing, it might just be the token itself
        }

        // Proceed with verification
        try {
          let deviceId = localStorage.getItem('cueclub_device_id')
          if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('cueclub_device_id', deviceId)
          }

          const trimmedDeviceId = deviceId?.trim();
          console.log("DEBUG: Verifying device:", trimmedDeviceId);
          const verifyRes = await fetch(`/api/verify-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: trimmedDeviceId,
              daily_token: token
            })
          })

          const verifyData = await verifyRes.json()

          if (verifyRes.ok && verifyData.status === 'logged_in') {
            alert(`Welcome back, ${verifyData.user}! Access Authorized.`)
            router.push('/')
          } else {
            alert("Device not recognized. Please complete registration to continue.")
            router.push('/signup')
          }
        } catch (err) {
          console.error("Failed to fetch daily token:", err)
          alert("Error reaching server.")
        }
      };

      const onScanFailure = (error: any) => {
        // Ignored: Lots of read failures happen before a successful read
      };

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      ).catch((err) => {
        console.error("Error starting scanner", err);
        if (err.toString().includes("NotAllowedError") || err.toString().includes("Permission dismissed")) {
          alert("Camera access denied. Please click the camera icon in your browser address bar and choose 'Allow'.");
        } else {
          alert("Camera access denied or unavailable. Please check your browser permissions.");
        }
        setIsScanning(false);
      });
    }, 100);

    return () => {
      isComponentMounted = false;
      clearInterval(initScanner);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScanning, router]);

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

      {/* Floating Glassmorphism Panel */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center pt-20 md:pt-24 h-full justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-6 md:p-10 rounded-[40px] max-w-4xl w-full text-center flex flex-col items-center gap-4 md:gap-6 border-white/5"
        >
          <AnimatePresence mode="wait">
            {!isScanning ? (
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
                    Excellence in Precision
                  </motion.span>

                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tighter text-white uppercase">
                    MASTER THE ART OF<br />
                    <span className="text-gradient">PRECISION</span>
                  </h1>
                </div>

                <p className="text-xs md:text-base text-[#A3A3A3] max-w-lg leading-relaxed">
                  Where luxury meets competitive play. Join our world-class facilities for billiards, pool, carrom, and darts.
                </p>

                <div className="flex flex-col items-center gap-6 md:gap-8 mt-2 w-full">
                  <Magnetic>
                    <Button
                      size="lg"
                      onClick={handleStartPlaying}
                      className="group relative h-24 w-40 md:h-32 md:w-56 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-white border-0 rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(234,88,12,0.3)] flex flex-col items-center justify-center p-0 overflow-hidden"
                    >
                      <div className="absolute inset-0 z-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] group-hover:animate-shine-once" />

                      <motion.span
                        key="playing"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex flex-col items-center py-4 md:py-6"
                      >
                        <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/60 mb-1">Start</span>
                        <span className="text-xl md:text-3xl font-black tracking-widest uppercase leading-none">PLAYING</span>
                        <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/60 mt-1">Now</span>
                        <ArrowRight className="mt-4 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 text-white shrink-0" size={24} />
                      </motion.span>
                    </Button>
                  </Magnetic>

                  <Link href="#tour">
                    <button className="text-[#A3A3A3] hover:text-white flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase transition-colors group">
                      <Play size={10} className="fill-current" />
                      Experience the Virtual Tour
                      <span className="h-[1px] w-0 bg-primary group-hover:w-6 transition-all duration-500 ml-2" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="w-full flex justify-between items-center px-4">
                  <h2 className="text-xl font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <QrCode className="text-primary" />
                    Scan QR
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="hover:bg-white/10 rounded-full">
                    <X className="text-white" size={24} />
                  </Button>
                </div>
                <div className="relative w-full max-w-sm aspect-square bg-black/80 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(234,88,12,0.15)] flex items-center justify-center">
                  <div id="reader" className="w-full h-full" />
                </div>
                <p className="text-[#A3A3A3] text-sm animate-pulse tracking-wide uppercase font-bold text-center">
                  Point your camera at the screen<br />to start playing
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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

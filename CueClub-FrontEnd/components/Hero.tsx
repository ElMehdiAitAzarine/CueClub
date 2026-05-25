'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, Loader2, QrCode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Magnetic from './Magnetic'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function Hero() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  const yPosText = useTransform(scrollY, [0, 500], [0, 100])

  const handleStartPlaying = () => {
    setScannerError(null)
    setIsScanning(true)
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!isScanning) return;

    let stream: MediaStream | null = null;
    let isComponentMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 720 },
            height: { ideal: 720 }
          }
        });
        
        if (!isComponentMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Start frame capture and detection every 600ms
        intervalId = setInterval(captureAndDetectFrame, 600);
      } catch (err: any) {
        console.error("Camera access failed:", err);
        if (isComponentMounted) {
          setScannerError("Camera access denied or unavailable. Please grant permission.");
        }
      }
    };

    const captureAndDetectFrame = async () => {
      if (!videoRef.current || !isComponentMounted) return;

      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // Draw active frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to JPEG base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      try {
        let deviceId = localStorage.getItem('cueclub_device_id')
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substr(2, 9)
          localStorage.setItem('cueclub_device_id', deviceId)
        }

        const trimmedDeviceId = deviceId.trim();
        const response = await fetch('/api/detect-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: dataUrl,
            device_id: trimmedDeviceId
          })
        });

        if (!response.ok) {
          return; // Frame did not contain valid QR, try next frame
        }

        const data = await response.json();
        if (!isComponentMounted) return;

        if (data.status === 'logged_in') {
          localStorage.setItem('cueclub_user_id', String(data.id));
          localStorage.setItem('cueclub_user_name', data.user);
          localStorage.setItem('cueclub_logged_in', 'true');
          
          setIsScanning(false);
          router.push('/home');
        } else if (data.status === 'unregistered') {
          setIsScanning(false);
          router.push(`/signup?token=${data.token}`);
        }
      } catch (e) {
        console.error("QRDet backend scan check failed:", e);
      }
    };

    startCamera();

    return () => {
      isComponentMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
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
                    {t('landing.heroPretitle', 'Excellence in Precision')}
                  </motion.span>

                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tighter text-white uppercase">
                    {t('landing.heroTitleLine1', 'MASTER THE ART OF')}<br />
                    <span className="text-gradient">{t('landing.heroTitleLine2', 'PRECISION')}</span>
                  </h1>
                </div>

                <p className="text-xs md:text-base text-[#A3A3A3] max-w-lg leading-relaxed">
                  {t('landing.heroSubtitle', 'Where luxury meets competitive play. Join our world-class facilities for billiards, pool, carrom, and darts.')}
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
                        <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/60 mb-1">{t('landing.start', 'Start')}</span>
                        <span className="text-xl md:text-3xl font-black tracking-widest uppercase leading-none">{t('landing.playing', 'PLAYING')}</span>
                        <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/60 mt-1">{t('landing.now', 'Now')}</span>
                      </motion.span>
                    </Button>
                  </Magnetic>

                  <Link href="#tour">
                    <button className="text-[#A3A3A3] hover:text-white flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase transition-colors group">
                      <Play size={10} className="fill-current" />
                      {t('landing.virtualTour', 'Experience the Virtual Tour')}
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
                    {t('landing.scanQr', 'Scan QR')}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="hover:bg-white/10 rounded-full">
                    <X className="text-white" size={24} />
                  </Button>
                </div>
                <div className="relative w-full max-w-sm aspect-square bg-black/80 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(234,88,12,0.15)] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover absolute inset-0 animate-fade-in"
                    playsInline
                    autoPlay
                    muted
                  />
                  {/* Premium Scanning Overlay Guidelines */}
                  <div className="absolute inset-10 border-2 border-dashed border-primary/30 rounded-[2rem] pointer-events-none z-10 animate-pulse" />
                </div>
                {scannerError ? (
                  <p className="text-red-400 text-sm tracking-wide uppercase font-bold text-center">
                    {scannerError}
                  </p>
                ) : (
                  <p className="text-[#A3A3A3] text-sm animate-pulse tracking-wide uppercase font-bold text-center">
                    {t('landing.pointCamera', 'Point your camera at the screen to start playing')}
                  </p>
                )}
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

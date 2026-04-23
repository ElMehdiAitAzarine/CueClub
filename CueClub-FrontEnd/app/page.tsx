import Header from '@/components/Header'
import Hero from '@/components/Hero'
import GamesSection from '@/components/GamesSection'
import FeaturesSection from '@/components/FeaturesSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="dark min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        <Hero />
        <GamesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}

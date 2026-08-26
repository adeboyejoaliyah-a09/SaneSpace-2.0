import Navbar from '@/components/layout/Navbar'
import ScrollProgress from '@/components/ui/ScrollProgress'
import HeroSection from '@/components/landing/HeroSection'
import MoodStrip from '@/components/landing/MoodStrip'
import HowItWorks from '@/components/landing/HowItWorks'
import ContextSection from '@/components/landing/ContextSection'
import SpecialisationModes from '@/components/landing/SpecialisationModes'
import ProductJourney from '@/components/landing/ProductJourney'
import SocialProof from '@/components/landing/SocialProof'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <MoodStrip />
        <HowItWorks />
        <ContextSection />
        <SpecialisationModes />
        <ProductJourney />
        <SocialProof />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  )
}

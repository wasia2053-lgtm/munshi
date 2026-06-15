import { Navbar1 } from '@/components/ui/navbar-1'
import LandingBackground from '@/components/LandingBackground'
import Hero from '@/components/Hero'
import PainSection from '@/components/PainSection'
import HowItWorks from '@/components/HowItWorks'

export default function Home() {
  return (
    <LandingBackground>
      <Navbar1 />
      <Hero />
      <PainSection />
      <HowItWorks />
    </LandingBackground>
  )
}
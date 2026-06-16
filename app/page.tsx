import { Navbar1 } from '@/components/ui/navbar-1'
import LandingBackground from '@/components/LandingBackground'
import Hero from '@/components/Hero'
import PainSection from '@/components/PainSection'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Comparison from '@/components/Comparison'



export default function Home() {
  return (
    <LandingBackground>
      <Navbar1 />
      <Hero />
      <PainSection />
      <HowItWorks />
      <Features />
      <Comparison />
    </LandingBackground>

  )
}
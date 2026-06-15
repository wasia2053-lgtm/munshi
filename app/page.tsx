import { Navbar1 } from '@/components/ui/navbar-1'
import LandingBackground from '@/components/LandingBackground'
import Hero from '@/components/Hero'
import PainSection from '@/components/PainSection'

export default function Home() {
  return (
    <LandingBackground>
      <Navbar1 />
      <Hero />
      <PainSection />
    </LandingBackground>
  )
}
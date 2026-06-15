import { FloatingParticles } from "./floating-particles"

export default function LandingBackground({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ position: 'relative', background: '#000000', minHeight: '100vh' }}>
            {/* Fixed particle background - behind everything */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            >
                <FloatingParticles
                    particleCount={2500}
                    particleColor1="#4ae176"
                    particleColor2="#e3e2e2"
                    cameraDistance={1000}
                    rotationSpeed={0.04}
                    particleSize={14}
                    antigravityForce={18}
                    activationRate={20}
                />
            </div>

            {/* Content sits above */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    )
}
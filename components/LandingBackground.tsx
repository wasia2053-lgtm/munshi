export default function LandingBackground({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .landing-bg-root {
          position: relative;
          background: #000000;
          min-height: 100vh;
          overflow: hidden;
        }
        .landing-glow {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }
        .landing-glow-1 {
          top: -200px;
          left: -150px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(74,225,118,0.10) 0%, transparent 70%);
          animation: glow-drift-1 22s ease-in-out infinite;
        }
        .landing-glow-2 {
          top: 30%;
          right: -200px;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(74,225,118,0.06) 0%, transparent 70%);
          animation: glow-drift-2 28s ease-in-out infinite;
        }
        .landing-glow-3 {
          bottom: -250px;
          left: 20%;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          animation: glow-drift-3 26s ease-in-out infinite;
        }
        @keyframes glow-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.08); }
        }
        @keyframes glow-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -60px) scale(1.05); }
        }
        @keyframes glow-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.06); }
        }
        .landing-grain {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .landing-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div className="landing-bg-root">
        <div className="landing-glow landing-glow-1" />
        <div className="landing-glow landing-glow-2" />
        <div className="landing-glow landing-glow-3" />
        <div className="landing-grain" />
        <div className="landing-content">
          {children}
        </div>
      </div>
    </>
  )
}
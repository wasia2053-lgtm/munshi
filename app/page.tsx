'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLSpanElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Custom cursor
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener('mousemove', onMove);
    let animId: number;
    const animCursor = () => {
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      animId = requestAnimationFrame(animCursor);
    };
    animCursor();
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(animId); };
  }, []);

  useEffect(() => {
    // Particles
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const c = canvas;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      x = Math.random() * c.width;
      y = Math.random() * c.height;
      vx = (Math.random() - 0.5) * 0.3;
      vy = (Math.random() - 0.5) * 0.3;
      r = Math.random() * 1.5 + 0.5;
      alpha = Math.random() * 0.4 + 0.1;
      reset() {
        this.x = Math.random() * c.width;
        this.y = Math.random() * c.height;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > c.width || this.y < 0 || this.y > c.height) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,83,${this.alpha})`;
        ctx.fill();
      }
    }
    const particles = Array.from({ length: 80 }, () => new Particle());
    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,168,83,${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        particles[i].update();
        particles[i].draw();
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafId); };

  }, []);

  useEffect(() => {
    // Typing animation
    const el = typingRef.current;
    if (!el) return;
    const words = ['WhatsApp queries', 'late night orders', 'Roman Urdu messages', 'angry customers', 'COD confirmations', 'shipping questions'];
    let wi = 0, ci = 0, deleting = false;
    let timeout: ReturnType<typeof setTimeout>;
    const type = () => {
      const word = words[wi];
      if (!deleting) {
        el.textContent = word.slice(0, ci + 1);
        ci++;
        if (ci === word.length) { deleting = true; timeout = setTimeout(type, 1800); return; }
      } else {
        el.textContent = word.slice(0, ci - 1);
        ci--;
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; timeout = setTimeout(type, 300); return; }
      }
      timeout = setTimeout(type, deleting ? 60 : 90);
    };
    timeout = setTimeout(type, 1200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Scroll navbar
    const nav = document.getElementById('navbar');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Counter + scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const counters = entry.target.querySelectorAll<HTMLElement>('.counter');
          counters.forEach(counter => {
            const target = parseInt(counter.dataset.target || '0');
            const suffix = counter.dataset.suffix || '';
            const duration = 2000;
            const start = performance.now();
            const update = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const val = Math.floor(eased * target);
              counter.textContent = suffix === 'K' ? (val >= 1000 ? Math.floor(val / 1000) + 'K' : String(val)) : String(val);
              if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.stat-item, .feature-card, .pricing-card').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        :root {
          --bg: #102C26; --bg-card: #1A3D35; --bg-deep: #0D2420; --border: #2A4A42;
          --cream: #F7E7CE; --cream-muted: #C4A882; --cream-faint: #8A7560;
          --gold: #D4A853; --gold-light: #F0C96A; --gold-dark: #C4983F;
          --green-soft: #4CAF82;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--cream); font-family: 'DM Sans', sans-serif; overflow-x: hidden; cursor: none; }
        .cursor { width:12px;height:12px;background:var(--gold);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .2s,height .2s; }
        .cursor-ring { width:36px;height:36px;border:1px solid rgba(212,168,83,.5);border-radius:50%;position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:all .15s ease; }
        .aurora { position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden; }
        .aurora-orb { position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;animation:drift 12s ease-in-out infinite; }
        .aurora-orb:nth-child(1){width:600px;height:600px;background:radial-gradient(circle,#D4A853,transparent 70%);top:-200px;left:-100px;animation-duration:14s;}
        .aurora-orb:nth-child(2){width:500px;height:500px;background:radial-gradient(circle,#4CAF82,transparent 70%);top:20%;right:-150px;animation-duration:10s;animation-delay:-4s;}
        .aurora-orb:nth-child(3){width:400px;height:400px;background:radial-gradient(circle,#D4A853,transparent 70%);bottom:10%;left:30%;animation-duration:16s;animation-delay:-8s;}
        @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.05)}66%{transform:translate(-20px,20px) scale(.95)}}
        canvas { position:fixed;inset:0;z-index:0;pointer-events:none; }
        .page { position:relative;z-index:2; }
        nav { position:fixed;top:0;left:0;right:0;z-index:100;padding:0 16px sm:0 24px md:0 48px;height:72px;display:flex;align-items:center;justify-content:space-between;background:rgba(16,44,38,.6);backdrop-filter:blur(20px);border-bottom:1px solid rgba(42,74,66,.6);transition:all .3s; }
        nav.scrolled { background:rgba(13,36,32,.9);border-bottom-color:rgba(212,168,83,.2); }
        .nav-links { display:none md:flex;align-items:center;gap:24px lg:gap:36px;list-style:none; }
        .nav-links a { color:var(--cream-muted);text-decoration:none;font-size:14px;transition:color .2s; }
        .nav-links a:hover { color:var(--cream); }
        .mobile-menu-btn { display:flex md:hidden;flex-direction:column;gap:4px;padding:8px;background:transparent;border:none;cursor:pointer; }
        .mobile-menu-btn span { width:20px;height:2px;background:var(--cream);transition:all .3s; }
        .mobile-menu-btn.open span:nth-child(1) { transform:rotate(45deg) translate(5px,5px); }
        .mobile-menu-btn.open span:nth-child(2) { opacity:0; }
        .mobile-menu-btn.open span:nth-child(3) { transform:rotate(-45deg) translate(7px,-6px); }
        .mobile-nav { display:flex md:none;position:fixed;top:72px;left:0;right:0;background:var(--bg-deep);border-bottom:1px solid var(--border);flex-direction:column;padding:16px;gap:16px;transform:translateY(-100%);transition:transform .3s; }
        .mobile-nav.open { transform:translateY(0); }
        .mobile-nav a { display:block;padding:12px 16px;color:var(--cream-muted);text-decoration:none;font-size:16px;transition:color .2s; }
        .mobile-nav a:hover { color:var(--cream); }
        .btn-ghost { padding:9px 22px;border:1px solid rgba(196,168,130,.4);border-radius:8px;color:var(--cream-muted);background:transparent;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;text-decoration:none;font-family:'DM Sans',sans-serif; }
        .btn-ghost:hover { border-color:var(--cream);color:var(--cream); }
        .btn-gold { padding:10px 24px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));border:none;border-radius:8px;color:var(--bg-deep);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;font-family:'DM Sans',sans-serif; }
        .btn-gold:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(212,168,83,.3); }
        .hero { min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 16px sm:80px 24px md:100px 48px 80px;text-align:center;position:relative; }
        .hero-badge { display:inline-flex;align-items:center;gap:8px;padding:6px 14px sm:7px 18px;border:1px solid rgba(212,168,83,.4);border-radius:999px;font-size:11px sm:12px;font-weight:500;color:var(--gold);background:rgba(212,168,83,.07);letter-spacing:1px;text-transform:uppercase;margin-bottom:24px sm:32px;animation:fadeSlideDown .8s ease .2s both; }
        .badge-dot { width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulseDot 2s ease infinite; }
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .hero-headline { font-family:'Cormorant Garamond',serif;font-size:clamp(52px,8vw,96px);font-weight:700;line-height:1;letter-spacing:-1px;margin-bottom:8px;animation:fadeSlideDown .8s ease .4s both; }
        .line1 { color:var(--cream);display:block; }
        .line2 { color:transparent;background:linear-gradient(90deg,var(--gold),var(--gold-light),var(--gold));background-size:200% auto;-webkit-background-clip:text;background-clip:text;display:block;animation:shimmerText 4s linear infinite,fadeSlideDown .8s ease .4s both; }
        @keyframes shimmerText{0%{background-position:0% center}100%{background-position:200% center}}
        .hero-typing-wrap { font-family:'Cormorant Garamond',serif;font-size:clamp(22px,3vw,34px);font-weight:400;color:var(--cream-muted);margin-bottom:24px;height:44px;display:flex;align-items:center;justify-content:center;gap:10px;animation:fadeSlideDown .8s ease .6s both; }
        .typing-static { font-style:italic; }
        .typing-dynamic { color:var(--gold);font-style:italic;position:relative; }
        .typing-cursor { display:inline-block;width:2px;height:1em;background:var(--gold);margin-left:2px;vertical-align:middle;animation:blink .8s step-end infinite; }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .hero-sub { max-width:580px;font-size:15px sm:16px;line-height:1.7;color:var(--cream-faint);margin-bottom:36px sm:44px;animation:fadeSlideDown .8s ease .8s both; }
        .hero-ctas { display:flex;flex-direction:column sm:flex-row;gap:12px sm:16px;justify-content:center;align-items:center;flex-wrap:wrap;margin-bottom:48px sm:56px;animation:fadeSlideDown .8s ease 1s both; }
        .btn-hero-primary { padding:14px 28px sm:16px 36px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));border:none;border-radius:10px;color:var(--bg-deep);font-size:15px sm:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .25s;position:relative;overflow:hidden;width:100% sm:auto; }
        .btn-hero-primary:hover { transform:translateY(-3px);box-shadow:0 16px 40px rgba(212,168,83,.35); }
        .btn-hero-secondary { padding:14px 28px sm:16px 36px;border:1px solid rgba(196,168,130,.3);border-radius:10px;color:var(--cream-muted);background:transparent;font-size:15px sm:16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .25s;width:100% sm:auto; }
        .btn-hero-secondary:hover { border-color:var(--cream);color:var(--cream);transform:translateY(-2px); }
        .hero-trust { font-size:12px sm:13px;color:var(--cream-faint);display:flex;flex-direction:column sm:flex-row;gap:16px sm:24px;flex-wrap:wrap;justify-content:center;animation:fadeSlideDown .8s ease 1.1s both; }
        .hero-trust span { display:flex;align-items:center;gap:6px; }
        .trust-check { width:16px;height:16px;border-radius:50%;background:rgba(76,175,130,.2);border:1px solid var(--green-soft);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--green-soft); }
        .hero-visual { margin-top:64px;animation:fadeSlideDown .8s ease 1.3s both; }
        .chat-mockup { width:280px sm:320px md:340px;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.5),0 0 0 1px rgba(212,168,83,.1);animation:floatCard 5s ease-in-out infinite; }
        @keyframes floatCard{0%,100%{transform:translateY(0) rotate(-.5deg)}50%{transform:translateY(-16px) rotate(.5deg)}}
        .chat-header { padding:14px 18px;background:var(--bg-deep);display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border); }
        .chat-avatar { width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--bg-deep);font-family:'Cormorant Garamond',serif; }
        .chat-body { padding:16px;display:flex;flex-direction:column;gap:12px; }
        .msg { max-width:85%; }
        .msg-customer { align-self:flex-start;background:var(--bg-deep);border:1px solid var(--border);border-radius:16px 16px 16px 4px;padding:10px 14px; }
        .msg-bot { align-self:flex-end;background:rgba(212,168,83,.12);border:1px solid rgba(212,168,83,.25);border-radius:16px 16px 4px 16px;padding:10px 14px; }
        .msg-label { font-size:10px;color:var(--cream-faint);margin-bottom:4px; }
        .msg-bot .msg-label { color:var(--gold);text-align:right; }
        .msg-text { font-size:13px;line-height:1.5;color:var(--cream-muted); }
        .msg-bot .msg-text { color:var(--cream); }
        .msg-time { font-size:10px;color:var(--cream-faint);margin-top:4px; }
        .msg-bot .msg-time { text-align:right; }
        .typing-indicator { align-self:flex-end;background:rgba(212,168,83,.08);border:1px solid rgba(212,168,83,.15);border-radius:16px 16px 4px 16px;padding:10px 16px;display:flex;gap:4px;align-items:center; }
        .typing-dot { width:6px;height:6px;border-radius:50%;background:var(--gold);opacity:.7; }
        .typing-dot:nth-child(1){animation:typingBounce 1.2s ease infinite 0s}
        .typing-dot:nth-child(2){animation:typingBounce 1.2s ease infinite .2s}
        .typing-dot:nth-child(3){animation:typingBounce 1.2s ease infinite .4s}
        @keyframes typingBounce{0%,100%{transform:translateY(0);opacity:.7}50%{transform:translateY(-5px);opacity:1}}
        .speed-badge { background:var(--bg-card);border:1px solid rgba(212,168,83,.3);border-radius:12px;padding:10px 16px;font-size:12px;color:var(--gold);font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.3);display:flex;align-items:center;gap:6px;animation:floatCard 5s ease-in-out infinite;animation-delay:-2s; }
        .stats-bar { background:var(--bg-card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:40px 24px sm:40px 48px;display:flex;align-items:center;justify-content:center; }
        .stat-item { flex:1;max-width:260px;text-align:center;padding:0 20px sm:0 40px;position:relative;opacity:0;transform:translateY(20px);transition:all .6s ease; }
        .stat-item.visible { opacity:1;transform:translateY(0); }
        .stat-item+.stat-item::before { content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:1px;height:50px;background:linear-gradient(to bottom,transparent,var(--border),transparent); }
        .stat-number { font-family:'Cormorant Garamond',serif;font-size:36px sm:42px md:52px;font-weight:700;color:var(--gold);line-height:1;display:flex;align-items:baseline;justify-content:center;gap:2px; }
        .stat-suffix { font-size:24px sm:28px md:32px; }
        .stat-label { font-size:12px sm:13px;color:var(--cream-faint);margin-top:8px; }
        .features { padding:80px 24px sm:80px 32px md:100px 48px;max-width:1200px;margin:0 auto; }
        .section-badge { display:inline-block;font-size:11px;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:16px; }
        .section-heading { font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,56px);font-weight:700;color:var(--cream);line-height:1.1;margin-bottom:60px; }
        .features-grid { display:grid;grid-template-columns:1fr md:grid-template-columns:repeat(3,1fr);gap:20px md:gap:24px; }
        .feature-card { background:linear-gradient(145deg,#1A3D35,#142E28);border:1px solid var(--border);border-radius:20px;padding:24px sm:28px md:36px;transition:all .6s ease;opacity:0;transform:translateY(30px);position:relative;overflow:hidden; }
        .feature-card.visible { opacity:1;transform:translateY(0); }
        .feature-card:hover { border-color:rgba(212,168,83,.3);transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.3); }
        .feature-icon { width:52px;height:52px;border-radius:14px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.2);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:24px; }
        .feature-title { font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:var(--cream);margin-bottom:12px; }
        .feature-body { font-size:14px;line-height:1.7;color:var(--cream-faint); }
        .how-it-works { padding:80px 24px sm:80px 32px md:80px 48px;max-width:1200px;margin:0 auto;text-align:center; }
        .steps-row { display:flex;flex-direction:column md:flex-row;align-items:flex-start;gap:0;position:relative;margin-top:60px;justify-content:center; }
        .steps-row::before { display:none md:block;content:'';position:absolute;top:40px;left:16%;right:16%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.4; }
        .step-item { flex:1;max-width:280px;padding:0 16px sm:0 24px;text-align:center; }
        .step-number { font-family:'Cormorant Garamond',serif;font-size:72px;font-weight:700;color:transparent;-webkit-text-stroke:1px rgba(212,168,83,.3);line-height:1;margin-bottom:16px; }
        .step-circle { width:56px;height:56px;border-radius:50%;background:var(--bg-card);border:1px solid rgba(212,168,83,.4);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 20px; }
        .step-title { font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:var(--cream);margin-bottom:8px; }
        .step-body { font-size:13px;color:var(--cream-faint);line-height:1.6; }
        .pricing { padding:80px 24px sm:80px 32px md:100px 48px;max-width:1100px;margin:0 auto;text-align:center; }
        .pricing-grid { display:grid;grid-template-columns:1fr md:grid-template-columns:repeat(3,1fr);gap:20px md:gap:24px;margin-top:60px;align-items:start; }
        .pricing-card { background:linear-gradient(145deg,#1A3D35,#142E28);border:1px solid var(--border);border-radius:20px;padding:24px sm:28px md:36px;text-align:left;opacity:0;transform:translateY(30px);transition:all .6s ease;position:relative; }
        .pricing-card.visible { opacity:1;transform:translateY(0); }
        .pricing-card.featured { border-color:rgba(212,168,83,.4);background:linear-gradient(145deg,#1E4438,#162E2A);box-shadow:0 0 0 1px rgba(212,168,83,.2),0 24px 60px rgba(0,0,0,.3);transform:scale(1.03); }
        .pricing-card.featured.visible { transform:scale(1.03) translateY(0); }
        .plan-badge { display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:5px 14px;border-radius:999px;margin-bottom:20px; }
        .plan-badge.free { background:rgba(196,168,130,.1);color:var(--cream-muted);border:1px solid rgba(196,168,130,.2); }
        .plan-badge.popular { background:rgba(212,168,83,.15);color:var(--gold);border:1px solid rgba(212,168,83,.3); }
        .plan-badge.pro { background:rgba(76,175,130,.1);color:var(--green-soft);border:1px solid rgba(76,175,130,.2); }
        .plan-name { font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:var(--cream);margin-bottom:8px; }
        .plan-price { font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:700;color:var(--gold);line-height:1;margin-bottom:6px; }
        .plan-usd { font-size:12px;color:var(--cream-faint);margin-bottom:28px; }
        .plan-divider { height:1px;background:var(--border);margin:24px 0; }
        .plan-features-list { list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px; }
        .plan-feature { display:flex;align-items:center;gap:10px;font-size:14px;color:var(--cream-muted); }
        .plan-feature.disabled { opacity:.4; }
        .btn-plan-gold { width:100%;padding:14px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));border:none;border-radius:10px;color:var(--bg-deep);font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .25s; }
        .btn-plan-gold:hover { filter:brightness(1.1);transform:translateY(-2px); }
        .btn-plan-ghost { width:100%;padding:14px;background:transparent;border:1px solid rgba(196,168,130,.3);border-radius:10px;color:var(--cream-muted);font-size:15px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .25s; }
        .btn-plan-ghost:hover { border-color:var(--cream-muted);color:var(--cream); }
        .payment-note { margin-top:32px;font-size:13px;color:var(--cream-faint);display:flex;align-items:center;justify-content:center;gap:8px; }
        footer { background:var(--bg-deep);border-top:1px solid var(--border);padding:32px 24px sm:48px;display:flex;flex-direction:column md:flex-row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px; }
        .footer-logo { font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:var(--gold);letter-spacing:3px; }
        .footer-tagline { font-size:12px;color:var(--cream-faint);margin-top:4px; }
        .footer-links { display:flex;flex-direction:column sm:flex-row;gap:16px sm:gap:28px; }
        .footer-links a { color:var(--cream-faint);text-decoration:none;font-size:13px;transition:color .2s; }
        .footer-links a:hover { color:var(--gold); }
        .footer-copy { font-size:12px;color:var(--cream-faint); }
        .chat-status { font-size:11px;color:var(--green-soft);display:flex;align-items:center;gap:4px; }
        .status-dot { width:6px;height:6px;border-radius:50%;background:var(--green-soft);animation:pulseDot 2s ease infinite; }
        @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg-deep)}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
        ::selection{background:rgba(212,168,83,.2);color:var(--cream)}
        a{color:inherit;text-decoration:none}
      `}</style>

      {/* Cursor */}
      <div ref={cursorRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />

      {/* Aurora */}
      <div className="aurora">
        <div className="aurora-orb" />
        <div className="aurora-orb" />
        <div className="aurora-orb" />
      </div>

      {/* Particles */}
      <canvas ref={canvasRef} />

      <div className="page">
        {/* NAVBAR */}
        <nav id="navbar">
          <a href="/" style={{ textDecoration: 'none' }}>
            <svg width="160" height="44" viewBox="0 0 160 44" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gc1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F0C96A" />
                  <stop offset="100%" stopColor="#C4983F" />
                </linearGradient>
              </defs>
              <polygon points="18,3 30,3 37,10 37,32 30,39 18,39 11,32 11,10" fill="none" stroke="url(#gc1)" strokeWidth="1.3" />
              <text x="24" y="30" fontFamily="Cormorant Garamond, serif" fontSize="22" fontWeight="700" fill="url(#gc1)" textAnchor="middle">M</text>
              <text x="48" y="26" fontFamily="Cormorant Garamond, serif" fontSize="22" fontWeight="700" fill="#F7E7CE" letterSpacing="3">MUNSHI</text>
              <circle cx="24" cy="35" r="1.5" fill="#D4A853" opacity="0.6" />
            </svg>
          </a>
          
          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/login" className="btn-ghost">Login</Link>
            <Link href="/signup" className="btn-gold">Start Free →</Link>
          </div>
        </nav>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav open">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Login</Link>
            <Link href="/signup">Start Free →</Link>
          </div>
        )}

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span className="badge-dot" />
            Pakistan&apos;s First AI WhatsApp Secretary
          </div>
          <h1 className="hero-headline">
            <span className="line1">Aapka Munshi.</span>
            <span className="line2">Hamesha Haazir.</span>
          </h1>
          <div className="hero-typing-wrap">
            <span className="typing-static">Now handling your</span>
            <span className="typing-dynamic">
              <span ref={typingRef}>WhatsApp queries</span>
              <span className="typing-cursor" />
            </span>
          </div>
          <p className="hero-sub">
            Your AI-powered WhatsApp assistant that handles every customer query —
            in English, Urdu, or Roman Urdu. Train it once with your website,
            and it works 24 hours a day, 7 days a week.
          </p>
          <div className="hero-ctas">
            <Link href="/signup" className="btn-hero-primary">Start For Free — It&apos;s Free</Link>
            <button className="btn-hero-secondary">▶ See How It Works</button>
          </div>
          <div className="hero-trust">
            <span><span className="trust-check">✓</span> No credit card required</span>
            <span><span className="trust-check">✓</span> Setup in 5 minutes</span>
            <span><span className="trust-check">✓</span> Cancel anytime</span>
          </div>
          <div className="hero-visual">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div className="chat-mockup">
                <div className="chat-header">
                  <div className="chat-avatar">M</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F7E7CE' }}>Munshi Bot</div>
                    <div className="chat-status"><span className="status-dot" />Online — Handling your customers</div>
                  </div>
                </div>
                <div className="chat-body">
                  <div className="msg msg-customer">
                    <div className="msg-label">👤 Customer</div>
                    <div className="msg-text">Bhai delivery kab tak hogi? COD available hai?</div>
                    <div className="msg-time">11:47 PM</div>
                  </div>
                  <div className="msg msg-bot">
                    <div className="msg-label">🤖 Munshi</div>
                    <div className="msg-text">Ji haan! COD available hai. Aapka order 2-3 din mein Leopards se deliver ho jaiga. ✅</div>
                    <div className="msg-time">11:47 PM · &lt; 2 sec</div>
                  </div>
                  <div className="msg msg-customer">
                    <div className="msg-label">👤 Customer</div>
                    <div className="msg-text">Exchange policy kya hai?</div>
                    <div className="msg-time">11:48 PM</div>
                  </div>
                  <div className="typing-indicator">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              </div>
              <div className="speed-badge" style={{ position: 'absolute', bottom: '-16px', right: '-16px' }}>
                ⚡ Replied in 1.4 sec
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-bar" id="stats-bar">
          {[
            { target: 500000, suffix: 'K', plus: true, label: 'Pakistani Sellers Face This Problem' },
            { target: 70, suffix: '', plus: true, label: 'Sales Lost Due to Late Replies', extra: '%' },
            { target: 24, suffix: '', plus: false, label: 'Munshi Never Sleeps', extra: '/7' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-number">
                <span className="counter" data-target={s.target} data-suffix={s.suffix}>0</span>
                <span className="stat-suffix">{s.extra || ''}{s.plus ? '+' : ''}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section className="features" id="features">
          <div className="section-badge">✦ What Munshi Does</div>
          <h2 className="section-heading">Why Sellers Choose Munshi</h2>
          <div className="features-grid">
            {[
              { icon: '📚', title: 'Train Once, Answer Forever', body: 'Paste your website link. Munshi reads everything — products, prices, policies — and answers exactly like you would.' },
              { icon: '⚡', title: 'Instant Replies, Any Language', body: 'Roman Urdu, English, or mixed — Munshi understands your customers and replies naturally, instantly.' },
              { icon: '💰', title: 'Sleep While Munshi Works', body: 'Customer texts at 3am? Munshi handles it. Every query answered, every sale captured — even when you are sleeping.' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-it-works" id="how">
          <div className="section-badge">✦ Simple Process</div>
          <h2 className="section-heading">Get Started in 3 Steps</h2>
          <div className="steps-row">
            {[
              { n: '01', icon: '📱', title: 'Connect WhatsApp', body: 'Scan QR code once with your phone. Done in under a minute.' },
              { n: '02', icon: '🧠', title: 'Train Your Munshi', body: 'Share your website URL or type your product info. Munshi learns everything.' },
              { n: '03', icon: '😴', title: 'Sit Back & Earn', body: 'Munshi handles every customer query — day and night. You focus on growth.' },
            ].map((s, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{s.n}</div>
                <div className="step-circle">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing" id="pricing">
          <div className="section-badge">✦ Transparent Pricing</div>
          <h2 className="section-heading">Simple, Honest Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card" style={{ transitionDelay: '0s' }}>
              <div className="plan-badge free">Starter</div>
              <div className="plan-name">Free</div>
              <div className="plan-price">PKR 0<span style={{ fontSize: '16px', color: '#8A7560' }}>/month</span></div>
              <div className="plan-usd">Always free</div>
              <div className="plan-divider" />
              <ul className="plan-features-list">
                {['1 WhatsApp number', '500 messages/month', 'Website training', 'Basic AI bot'].map(f => <li key={f} className="plan-feature"><span>✓</span>{f}</li>)}
                {['Customer support', 'Analytics'].map(f => <li key={f} className="plan-feature disabled"><span>✗</span>{f}</li>)}
              </ul>
              <Link href="/signup"><button className="btn-plan-ghost">Get Started Free</button></Link>
            </div>
            <div className="pricing-card featured" style={{ transitionDelay: '0.15s' }}>
              <div className="plan-badge popular">⭐ Most Popular</div>
              <div className="plan-name">Growth</div>
              <div className="plan-price">PKR 7,000<span style={{ fontSize: '16px', color: '#8A7560' }}>/month</span></div>
              <div className="plan-usd">~ $25 USD</div>
              <div className="plan-divider" />
              <ul className="plan-features-list">
                {['1 WhatsApp number', '5,000 messages/month', 'Website + PDF training', 'Advanced AI (GPT-4o)', 'Analytics dashboard', 'Email support'].map(f => <li key={f} className="plan-feature"><span>✓</span>{f}</li>)}
              </ul>
              <Link href="/signup"><button className="btn-plan-gold">Start Growth Plan →</button></Link>
            </div>
            <div className="pricing-card" style={{ transitionDelay: '0.3s' }}>
              <div className="plan-badge pro">Power Sellers</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">PKR 20,000<span style={{ fontSize: '16px', color: '#8A7560' }}>/month</span></div>
              <div className="plan-usd">~ $70 USD</div>
              <div className="plan-divider" />
              <ul className="plan-features-list">
                {['3 WhatsApp numbers', '50,000 messages/month', 'All training types', 'Human handoff inbox', 'Custom bot personality', '24/7 Priority support'].map(f => <li key={f} className="plan-feature"><span>✓</span>{f}</li>)}
              </ul>
              <Link href="/signup"><button className="btn-plan-ghost">Go Pro</button></Link>
            </div>
          </div>
          <div className="payment-note">💳 Pay with JazzCash, EasyPaisa, or Credit Card</div>
        </section>

        {/* FOOTER */}
        <footer>
          <div>
            <div className="footer-logo">MUNSHI</div>
            <div className="footer-tagline">Reply Fast. Sell More. Sleep Easy.</div>
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-copy">© 2025 Munshi. Made with ❤️ for Pakistani Sellers.</div>
        </footer>
      </div>
    </>
  );
} 
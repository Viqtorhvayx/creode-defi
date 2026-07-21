"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  LockKey, TrendUp, ArrowsLeftRight, UsersThree, ShieldCheck, Lightning,
  ArrowRight, CheckCircle, BookOpen, ArrowSquareOut,
} from '@phosphor-icons/react';
import { Logo } from './Logo';

const BLUE = '#00A8E8';

interface LandingPageProps {
  onLaunch: () => void;
  onDocs: () => void;
}

/* Reveal-on-scroll wrapper — adds `.lp-in` when the element enters the viewport. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-reveal ${shown ? 'lp-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

/* Count-up number that animates once it scrolls into view. */
const CountUp: React.FC<{ to: number; suffix?: string; prefix?: string; dur?: number }> = ({ to, suffix = '', prefix = '', dur = 1400 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref} className="tabular-nums">{prefix}{val}{suffix}</span>;
};

const PRODUCTS = [
  { icon: LockKey, name: 'Vault', tag: 'Fixed APY', desc: 'Time-locked savings that pay a fixed APY by asset tier — up to 22% on ecosystem tokens over 7 / 30 / 60-day locks.' },
  { icon: TrendUp, name: 'Earn', tag: 'Auto-compound', desc: 'Supply one token; the protocol auto-zaps it into a balanced yield position — with hands-off, keeperless auto-compounding via Hedera HIP-1215.' },
  { icon: ArrowsLeftRight, name: 'P2P Trading', tag: 'On-chain order book', desc: 'A trustless spot exchange with escrowed limit orders and live market data. No house, no pool — every trade settles peer-to-peer.' },
  { icon: UsersThree, name: 'Governance', tag: 'CODE-weighted', desc: 'Hold CODE to open proposals and cast weighted votes on emissions, new assets, and upgrades — every tally settles on-chain.' },
];

const SECURITY = [
  { t: 'Native HTS controls', d: 'Token rules are enforced by network consensus — not just application code.' },
  { t: 'Explicit association', d: 'Accounts opt in to tokens, blocking dusting and unsolicited-token attacks by default.' },
  { t: 'aBFT finality', d: "Hedera's hashgraph consensus gives fast, final settlement with no re-org risk." },
  { t: 'Verified on HashScan', d: 'Every Creode contract is source-verified and publicly auditable.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onDocs }) => {
  const heroWords = ['DeFi,', 'settled', 'on', 'Hedera.'];
  return (
    <div className="lp-root min-h-screen w-full overflow-x-hidden text-white antialiased" style={{ background: '#07090d' }}>
      <style>{lpCss}</style>

      {/* Ambient aurora + grid */}
      <div className="lp-bg" aria-hidden>
        <div className="lp-blob lp-blob-a" />
        <div className="lp-blob lp-blob-b" />
        <div className="lp-blob lp-blob-c" />
        <div className="lp-grid" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <div className="scale-90 origin-left"><Logo theme="dark" /></div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#products" className="text-[14px] font-semibold text-white/60 transition-colors hover:text-white">Products</a>
          <a href="#security" className="text-[14px] font-semibold text-white/60 transition-colors hover:text-white">Security</a>
          <button onClick={onDocs} className="text-[14px] font-semibold text-white/60 transition-colors hover:text-white">Docs</button>
        </div>
        <button onClick={onLaunch} className="lp-cta-sm group flex items-center gap-1.5">
          Launch App <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </nav>

      {/* Hero */}
      <header className="relative z-10 mx-auto max-w-[1000px] px-6 pt-16 pb-20 text-center sm:pt-24">
        <div className="lp-fade" style={{ animationDelay: '0ms' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] font-semibold text-white/70 backdrop-blur-xl">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: BLUE }} /><span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: BLUE }} /></span>
            Live on Hedera Testnet
          </span>
        </div>

        <h1 className="mx-auto mt-7 max-w-[14ch] text-[clamp(42px,8vw,80px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          {heroWords.map((w, i) => (
            <span key={i} className="lp-word" style={{ animationDelay: `${120 + i * 110}ms` }}>
              {w === 'Hedera.' ? <span className="lp-grad">{w}</span> : w}{' '}
            </span>
          ))}
        </h1>

        <p className="lp-fade mx-auto mt-6 max-w-[56ch] text-[clamp(16px,2.2vw,20px)] leading-relaxed text-white/60" style={{ animationDelay: '640ms' }}>
          One non-custodial protocol for savings, yield, peer-to-peer trading, and governance —
          settled trustlessly on Hedera and secured at the network layer by HTS.
        </p>

        <div className="lp-fade mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '760ms' }}>
          <button onClick={onLaunch} className="lp-cta group flex items-center gap-2">
            Launch App <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={onDocs} className="lp-ghost flex items-center gap-2">
            <BookOpen size={17} weight="bold" /> Read the Docs
          </button>
        </div>

        {/* Stat chips */}
        <div className="lp-fade mx-auto mt-14 grid max-w-[720px] grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '900ms' }}>
          {[
            { v: <CountUp to={4} />, l: 'Products' },
            { v: <CountUp to={9} />, l: 'Verified contracts' },
            { v: <CountUp to={7} />, l: 'Trading pairs' },
            { v: <><CountUp to={100} />%</>, l: 'On-chain' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-xl">
              <div className="text-[26px] font-extrabold tracking-tight" style={{ color: BLUE }}>{s.v}</div>
              <div className="mt-0.5 text-[12.5px] font-medium text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Products */}
      <section id="products" className="relative z-10 mx-auto max-w-[1120px] px-6 py-20">
        <Reveal className="text-center">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: BLUE }}>The protocol</span>
          <h2 className="mt-3 text-[clamp(28px,4.5vw,42px)] font-bold tracking-[-0.03em]">Four products, one app</h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/55">Everything settles on-chain. Creode never holds your keys or funds.</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.name} delay={i * 90}>
                <div className="lp-card group h-full">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="lp-icon"><Icon size={22} weight="bold" /></div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/60">{p.tag}</span>
                  </div>
                  <h3 className="text-[20px] font-bold tracking-tight">{p.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{p.desc}</p>
                  <button onClick={onLaunch} className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold transition-colors" style={{ color: BLUE }}>
                    Open {p.name} <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Auto-compound highlight */}
      <section className="relative z-10 mx-auto max-w-[1120px] px-6 pb-10">
        <Reveal>
          <div className="lp-feature overflow-hidden">
            <div className="relative z-10 max-w-[62ch]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-bold" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                <Lightning size={14} weight="fill" /> Keeperless · HIP-1215
              </div>
              <h2 className="text-[clamp(24px,3.6vw,34px)] font-bold tracking-[-0.03em]">Auto-compounding that runs itself.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Flip <span className="font-semibold text-white">Auto: On</span> and Creode compounds your position on-chain — no bots, no keepers.
                Powered by Hedera HIP-1215 scheduled contract calls: each tick compounds every enrolled position and schedules the next one itself.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 mx-auto max-w-[1120px] px-6 py-20">
        <Reveal className="text-center">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: BLUE }}>Security</span>
          <h2 className="mt-3 text-[clamp(28px,4.5vw,42px)] font-bold tracking-[-0.03em]">Secured by Hedera HTS</h2>
          <p className="mx-auto mt-3 max-w-[54ch] text-[15px] leading-relaxed text-white/55">Token rules enforced at the network layer, not just in application code.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map((s, i) => (
            <Reveal key={s.t} delay={i * 80}>
              <div className="lp-sec h-full">
                <ShieldCheck size={20} weight="bold" style={{ color: BLUE }} />
                <h3 className="mt-3 text-[15px] font-bold">{s.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-[900px] px-6 pb-24">
        <Reveal>
          <div className="lp-final text-center">
            <h2 className="text-[clamp(28px,5vw,46px)] font-extrabold tracking-[-0.035em]">Start earning on Creode.</h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/60">Connect a wallet on Hedera Testnet, claim test tokens from the faucet, and try every product — with no real funds at risk.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={onLaunch} className="lp-cta group flex items-center gap-2">Launch App <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" /></button>
              <button onClick={onDocs} className="lp-ghost">Read the Docs</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <div className="scale-90 origin-left"><Logo theme="dark" /></div>
            <p className="text-[12px] text-white/40">Non-custodial DeFi on Hedera · Testnet · No real funds at risk.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[13px] font-semibold text-white/50">
            <button onClick={onDocs} className="transition-colors hover:text-white">Docs</button>
            <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-white">HashScan <ArrowSquareOut size={12} weight="bold" /></a>
            <a href="https://docs.hedera.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-white">Hedera <ArrowSquareOut size={12} weight="bold" /></a>
            <span className="inline-flex items-center gap-1.5 text-[#10B981]"><CheckCircle size={14} weight="fill" /> Contracts verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* Scoped landing-page CSS (prefixed keyframes; no global collisions). */
const lpCss = `
.lp-root { position: relative; }
@media (prefers-reduced-motion: reduce) {
  .lp-word, .lp-fade { animation: none !important; opacity: 1 !important; transform: none !important; }
  .lp-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
  .lp-blob { animation: none !important; }
}
.lp-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.lp-blob { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: 0.5; }
.lp-blob-a { width: 620px; height: 620px; top: -180px; left: 50%; margin-left: -520px; background: radial-gradient(circle, rgba(0,168,232,0.55), transparent 62%); animation: lpDriftA 22s ease-in-out infinite; }
.lp-blob-b { width: 560px; height: 560px; top: -60px; right: -120px; background: radial-gradient(circle, rgba(0,114,255,0.42), transparent 62%); animation: lpDriftB 26s ease-in-out infinite; }
.lp-blob-c { width: 520px; height: 520px; top: 420px; left: -140px; background: radial-gradient(circle, rgba(88,101,242,0.30), transparent 62%); animation: lpDriftC 30s ease-in-out infinite; }
.lp-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 46px 46px; mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%); }
@keyframes lpDriftA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,50px) scale(1.08); } }
@keyframes lpDriftB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-70px,40px) scale(1.1); } }
@keyframes lpDriftC { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,-40px) scale(1.06); } }

.lp-grad { background: linear-gradient(100deg, #00A8E8, #0072FF 55%, #58a6ff); -webkit-background-clip: text; background-clip: text; color: transparent; }

.lp-word { display: inline-block; margin-right: 0.26em; opacity: 0; transform: translateY(24px); animation: lpWord 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
@keyframes lpWord { to { opacity: 1; transform: translateY(0); } }
.lp-fade { opacity: 0; transform: translateY(16px); animation: lpFade 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
@keyframes lpFade { to { opacity: 1; transform: translateY(0); } }

.lp-reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.lp-reveal.lp-in { opacity: 1; transform: translateY(0); }

.lp-cta { background: #00A8E8; color: #04121a; font-weight: 800; font-size: 15px; padding: 13px 24px; border-radius: 14px; box-shadow: 0 0 0 1px rgba(0,168,232,0.5), 0 10px 34px rgba(0,168,232,0.35); transition: transform 0.18s, box-shadow 0.25s; }
.lp-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(0,168,232,0.7), 0 14px 44px rgba(0,168,232,0.5); }
.lp-cta:active { transform: translateY(0); }
.lp-cta-sm { background: #00A8E8; color: #04121a; font-weight: 800; font-size: 13.5px; padding: 9px 16px; border-radius: 11px; box-shadow: 0 6px 20px rgba(0,168,232,0.3); transition: transform 0.18s, box-shadow 0.25s; }
.lp-cta-sm:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(0,168,232,0.45); }
.lp-ghost { border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); color: #fff; font-weight: 700; font-size: 15px; padding: 13px 22px; border-radius: 14px; backdrop-filter: blur(12px); transition: background 0.2s, border-color 0.2s; }
.lp-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.25); }

.lp-card { border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.025); border-radius: 20px; padding: 26px; backdrop-filter: blur(14px); transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s, background 0.25s; }
.lp-card:hover { transform: translateY(-4px); border-color: rgba(0,168,232,0.4); background: rgba(0,168,232,0.04); box-shadow: 0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,168,232,0.25); }
.lp-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 13px; color: #00A8E8; background: rgba(0,168,232,0.12); border: 1px solid rgba(0,168,232,0.28); }

.lp-feature { position: relative; border: 1px solid rgba(255,255,255,0.09); border-radius: 24px; padding: 40px; background: linear-gradient(120deg, rgba(0,168,232,0.10), rgba(88,101,242,0.06) 60%, transparent); backdrop-filter: blur(14px); }
.lp-sec { border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); border-radius: 18px; padding: 22px; transition: border-color 0.25s, background 0.25s; }
.lp-sec:hover { border-color: rgba(0,168,232,0.35); background: rgba(0,168,232,0.03); }
.lp-final { border: 1px solid rgba(255,255,255,0.09); border-radius: 28px; padding: 56px 32px; background: radial-gradient(120% 140% at 50% 0%, rgba(0,168,232,0.14), transparent 60%), rgba(255,255,255,0.015); backdrop-filter: blur(14px); }
`;

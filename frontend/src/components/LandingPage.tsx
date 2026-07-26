"use client";

import React, { useEffect, useRef, useState } from 'react';
import { UsersThree, BookOpen, XLogo, DiscordLogo } from '@phosphor-icons/react';
import { Logo } from './Logo';
import { CustomVaultIcon } from './CustomVaultIcon';
import { CustomEarnIcon } from './CustomEarnIcon';
import { CustomP2PIcon } from './CustomP2PIcon';
import { useWallet } from '../context/WalletContext';

const BLUE = '#00A8E8';

interface LandingPageProps {
  onLaunch: () => void;
  onDocs: () => void;
  onNavigate?: (tab: string) => void;
}

/* Reveal-on-scroll wrapper (threshold-triggered, plays once). Used for cards
   and supporting paragraphs — not headings, which use ScrollWords below. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`lp-reveal ${shown ? 'lp-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
};

/* Count-up number that animates once it scrolls into view. */
const CountUp: React.FC<{ to: number; suffix?: string; dur?: number }> = ({ to, suffix = '', dur = 1400 }) => {
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
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref} className="tabular-nums">{val}{suffix}</span>;
};

// Dim -> accent -> white color sweep, driven by a word's own reveal progress
// (0 to 1). Continuously recomputed on scroll, so each word visibly lights up
// blue as the scroll position passes over it, then settles to solid white.
const DIM: [number, number, number] = [110, 122, 138];
const ACCENT: [number, number, number] = [0, 168, 232];
const WHITE: [number, number, number] = [255, 255, 255];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (c1: [number, number, number], c2: [number, number, number], t: number) =>
  `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(lerp(c1[2], c2[2], t))})`;
const sweepColor = (wp: number) => (wp <= 0.5 ? mixRgb(DIM, ACCENT, wp / 0.5) : mixRgb(ACCENT, WHITE, (wp - 0.5) / 0.5));

/* Word-by-word reveal driven directly by scroll position (not a fixed-time
   animation) — each word's opacity, lift and color are all a function of how
   far the heading has scrolled through its reveal window, so the words
   visibly assemble and light up blue as the user scrolls past them. */
const ScrollWords: React.FC<{ text: string; as?: 'h1' | 'h2'; className?: string }> = ({ text, as = 'h2', className = '' }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setProgress(1); return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.92;  // progress 0: heading top just below the fold
        const end = vh * 0.38;    // progress 1: heading has scrolled to ~38% viewport height
        const p = (start - rect.top) / (start - end);
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const Tag = as as any;
  return (
    <Tag ref={ref} className={`lp-scrollwords ${className}`}>
      {words.map((w, i) => {
        const wStart = i / words.length;
        const wEnd = Math.min(1, wStart + (1 / words.length) * 1.6);
        const wp = Math.max(0, Math.min(1, (progress - wStart) / (wEnd - wStart)));
        return (
          <span key={i} className="lp-sword" style={{ opacity: 0.25 + wp * 0.75, transform: `translateY(${(1 - wp) * 16}px)`, color: sweepColor(wp) }}>
            {w}
          </span>
        );
      })}
    </Tag>
  );
};

// The four sections — the only place icons are used. Vault/Earn/Trade reuse
// the exact same custom icon components as the in-app sidebar so the two
// never visually diverge; Community has no sidebar counterpart (it lives
// inside Earn), so it keeps a regular Phosphor icon.
const SECTIONS = [
  { icon: CustomVaultIcon, custom: true, name: 'Vault', tab: 'Vault', desc: 'Time-locked savings that pay a fixed APY by asset tier, up to 28% on ecosystem tokens over 7 / 30 / 60-day locks.' },
  { icon: CustomEarnIcon, custom: true, name: 'Earn', tab: 'Earn', desc: 'Supply one token and the protocol auto-zaps it into a balanced yield position, with hands-off auto-compounding via Hedera HIP-1215.' },
  { icon: CustomP2PIcon, custom: true, name: 'Trade', tab: 'P2P', desc: 'A trustless peer-to-peer order book with escrowed limit orders and live market data. No house, no pool.' },
  { icon: UsersThree, custom: false, name: 'Community', tab: 'Earn', desc: 'Hold CODE to open proposals and cast weighted votes on emissions, new assets and upgrades. Every tally settles on-chain.' },
];

const SECURITY = [
  { t: 'Native HTS controls', d: 'Token rules are enforced by network consensus, not only application code.' },
  { t: 'Explicit association', d: 'Accounts opt in to tokens, blocking dusting and unsolicited-token attacks by default.' },
  { t: 'aBFT finality', d: "Hedera's hashgraph consensus gives fast, final settlement with no re-org risk." },
  { t: 'Verified on HashScan', d: 'Every Creode contract is source-verified and publicly auditable.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const { connect } = useWallet();
  return (
    <div className="lp-root min-h-screen w-full overflow-x-hidden text-white antialiased">
      <style>{lpCss}</style>

      {/* Ambient aurora + grid */}
      <div className="lp-bg" aria-hidden>
        <div className="lp-blob lp-blob-a" />
        <div className="lp-blob lp-blob-b" />
        <div className="lp-blob lp-blob-c" />
        <div className="lp-grid" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex max-w-[1180px] items-center justify-between px-8 py-7">
        <button onClick={onLaunch} className="scale-90 origin-left"><Logo theme="dark" /></button>
        <div className="flex items-center gap-4">
          <a href="/docs/Creode_Documentation.docx" download className="hidden text-[13.5px] font-semibold tracking-wide text-white/55 transition-colors hover:text-white sm:block">Docs</a>
          <button onClick={onLaunch} className="lp-cta">Launch App</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 mx-auto flex min-h-[86vh] max-w-[1180px] flex-col justify-center px-8 pb-20">
        <ScrollWords as="h1" text="The Growth Engine for On-Chain Finance." className="lp-h1" />

        <p className="lp-sub" style={{ animationDelay: '260ms' }}>
          One non-custodial app for saving, earning, trading and governing on Hedera.
          Every action is a transaction you sign yourself, secured at the network layer by HTS.
        </p>

        <div className="lp-actions" style={{ animationDelay: '420ms' }}>
          <button onClick={onLaunch} className="lp-cta lp-cta-lg">Launch App</button>
        </div>

        {/* Stat cards */}
        <div className="lp-stats" style={{ animationDelay: '560ms' }}>
          {[
            { v: <CountUp to={4} />, l: 'Products' },
            { v: <CountUp to={9} />, l: 'Verified contracts' },
            { v: <CountUp to={7} />, l: 'Trading pairs' },
            { v: <><CountUp to={100} />%</>, l: 'On-chain' },
          ].map((s, i) => (
            <div key={i} className="lp-statcard">
              <div className="lp-statnum">{s.v}</div>
              <div className="lp-statlabel">{s.l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Sections — the only icons on the page */}
      <section id="sections" className="relative z-10 mx-auto max-w-[1180px] px-8 py-24">
        <ScrollWords as="h2" text="Four ways to move on-chain." className="lp-h2 max-w-[16ch]" />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.name} delay={i * 80}>
                <button onClick={connect} className="lp-card group h-full">
                  <div className="lp-section-ico">
                    {s.custom ? <Icon className="w-5 h-5" /> : <Icon size={20} weight="regular" />}
                  </div>
                  <h3 className="mt-6 text-[22px] font-bold tracking-tight">{s.name}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-white/50">{s.desc}</p>
                  <span className="lp-section-open">Open {s.name}</span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Auto-compound highlight — no icons */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-8 pb-8">
        <Reveal>
          <div className="lp-feature">
            <span className="lp-tag">Keeperless · HIP-1215</span>
            <ScrollWords as="h2" text="Auto-compounding that runs itself." className="lp-h2 mt-4" />
            <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-white/55">
              Every position compounds itself on-chain by default, with no bots and no keepers.
              Powered by Hedera HIP-1215 scheduled contract calls: each tick compounds every enrolled
              position and schedules the next one itself.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Security — no icons */}
      <section id="security" className="relative z-10 mx-auto max-w-[1180px] px-8 py-24">
        <ScrollWords as="h2" text="Secured by Hedera HTS and HCS." className="lp-h2 max-w-[18ch]" />
        <Reveal className="mt-4">
          <p className="max-w-[54ch] text-[15px] leading-relaxed text-white/55">Token rules enforced at the network layer, not just in application code.</p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map((s, i) => (
            <Reveal key={s.t} delay={i * 70}>
              <div className="lp-sec">
                <span className="lp-sec-idx">0{i + 1}</span>
                <h3 className="mt-4 text-[16px] font-bold">{s.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/45">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA — no icons */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-8 pb-28">
        <Reveal>
          <div className="lp-final text-center">
            <ScrollWords as="h2" text="Start earning on Creode." className="lp-h2 !text-center mx-auto" />
            <p className="mx-auto mt-4 max-w-[48ch] text-center text-[15px] leading-relaxed text-white/55">
              Connect a wallet on Hedera Testnet, claim test tokens from the faucet and try every product, with no real funds at risk.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="/docs/Creode_Documentation.docx" download className="lp-ghost">Read the Docs</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-8 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3 max-w-[360px]">
            <div className="scale-90 origin-left"><Logo theme="dark" muted /></div>
            <p className="text-[12.5px] leading-relaxed text-white/35">Non-custodial DeFi on Hedera. Testnet deployment, no real funds at risk.</p>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex items-center gap-3">
              <a href="/docs/Creode_Documentation.docx" download title="Download Docs" className="lp-social"><BookOpen size={17} weight="bold" /></a>
              <span title="X: coming soon" className="lp-social lp-social-soon"><XLogo size={17} weight="bold" /></span>
              <span title="Discord: coming soon" className="lp-social lp-social-soon"><DiscordLogo size={17} weight="bold" /></span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-6 text-[12.5px] font-semibold text-white/45">
              <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">HashScan</a>
              <a href="https://docs.hedera.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Hedera</a>
              <span className="text-[#10B981]">Contracts verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* Scoped landing CSS. Combines the richer, livelier background/cards of the
   first pass with the scroll-scrubbed word reveal from the second; keeps
   Creode's dark + cyan identity and the app's own font (Inter, font-bold). */
const lpCss = `
.lp-root { position: relative; background: #07090d; font-family: inherit; }
.lp-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.lp-blob { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: 0.5; }
.lp-blob-a { width: 620px; height: 620px; top: -180px; left: 50%; margin-left: -520px; background: radial-gradient(circle, rgba(0,168,232,0.5), transparent 62%); animation: lpDriftA 22s ease-in-out infinite; }
.lp-blob-b { width: 560px; height: 560px; top: -60px; right: -120px; background: radial-gradient(circle, rgba(0,114,255,0.38), transparent 62%); animation: lpDriftB 26s ease-in-out infinite; }
.lp-blob-c { width: 520px; height: 520px; top: 420px; left: -140px; background: radial-gradient(circle, rgba(88,101,242,0.26), transparent 62%); animation: lpDriftC 30s ease-in-out infinite; }
.lp-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%); }
@keyframes lpDriftA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,50px) scale(1.08); } }
@keyframes lpDriftB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-70px,40px) scale(1.1); } }
@keyframes lpDriftC { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,-40px) scale(1.06); } }

@media (prefers-reduced-motion: reduce) {
  .lp-sub, .lp-actions, .lp-stats, .lp-sword { animation: none !important; opacity: 1 !important; transform: none !important; }
  .lp-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
  .lp-blob { animation: none !important; }
}

/* Shared CTA — solid blue, well-rounded, matching the wallet Connect button. */
.lp-cta { background: #00A8E8; color: #ffffff; font-weight: 700; font-size: 13.5px; padding: 10px 18px; border-radius: 12px; transition: background .2s, transform .18s, box-shadow .25s; box-shadow: 0 4px 14px rgba(0,168,232,0.25); }
.lp-cta:hover { background: #0090C7; box-shadow: 0 6px 20px rgba(0,168,232,0.4); }
.lp-cta:active { transform: scale(0.97); }
.lp-cta-lg { font-size: 15px; padding: 14px 28px; border-radius: 12px; }
.lp-ghost { border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); color: #fff; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 12px; transition: background .2s, border-color .2s; }
.lp-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.26); }

/* Hero */
.lp-h1.lp-scrollwords { font-size: clamp(42px, 8vw, 96px); font-weight: 700; line-height: 1.05; letter-spacing: -0.04em; }
.lp-h2.lp-scrollwords { font-size: clamp(28px, 4.4vw, 46px); font-weight: 700; line-height: 1.08; letter-spacing: -0.03em; }
.lp-scrollwords { display: block; }
.lp-sword { display: inline-block; margin-right: 0.26em; will-change: opacity, transform, color; transition: opacity .05s linear, transform .05s linear, color .05s linear; }

.lp-sub { max-width: 54ch; margin-top: 28px; font-size: clamp(16px, 1.9vw, 19px); line-height: 1.6; color: rgba(255,255,255,0.55); opacity: 0; transform: translateY(14px); animation: lpFade .8s cubic-bezier(0.22,1,0.36,1) forwards; }
.lp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; opacity: 0; transform: translateY(14px); animation: lpFade .8s cubic-bezier(0.22,1,0.36,1) forwards; }

.lp-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 56px; max-width: 640px; opacity: 0; transform: translateY(14px); animation: lpFade .9s cubic-bezier(0.22,1,0.36,1) forwards; }
@media (min-width: 640px) { .lp-stats { grid-template-columns: repeat(4, 1fr); } }
.lp-statcard { border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: rgba(255,255,255,0.03); backdrop-filter: blur(14px); padding: 16px; }
.lp-statnum { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: #00A8E8; }
.lp-statlabel { margin-top: 2px; font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,0.45); }

@keyframes lpFade { to { opacity: 1; transform: translateY(0); } }

/* Reveal */
.lp-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(0.22,1,0.36,1), transform .7s cubic-bezier(0.22,1,0.36,1); }
.lp-reveal.lp-in { opacity: 1; transform: translateY(0); }

/* Section / product cards — bordered, glowing on hover (brought back from v1) */
.lp-card { display: block; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.025); border-radius: 20px; padding: 30px; backdrop-filter: blur(14px); transition: transform .25s, border-color .25s, box-shadow .25s, background .25s; cursor: pointer; }
.lp-card:hover { transform: translateY(-4px); border-color: rgba(0,168,232,0.4); background: rgba(0,168,232,0.04); box-shadow: 0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,168,232,0.25); }
.lp-section-ico { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 11px; color: #00A8E8; background: rgba(0,168,232,0.1); border: 1px solid rgba(0,168,232,0.22); }
.lp-section-open { display: inline-block; margin-top: 20px; font-size: 13px; font-weight: 700; color: #00A8E8; opacity: 0; transform: translateX(-4px); transition: opacity .25s, transform .25s; }
.lp-card:hover .lp-section-open { opacity: 1; transform: translateX(0); }

/* Feature */
.lp-feature { position: relative; border: 1px solid rgba(255,255,255,0.09); border-radius: 22px; padding: 44px; background: linear-gradient(120deg, rgba(0,168,232,0.09), transparent 55%); }
.lp-tag { display: inline-block; border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); color: #10B981; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }

/* Security */
.lp-sec { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
.lp-sec-idx { font-size: 12px; font-weight: 700; color: rgba(0,168,232,0.7); letter-spacing: 0.05em; }

/* Final */
.lp-final { border: 1px solid rgba(255,255,255,0.09); border-radius: 26px; padding: 60px 32px; background: radial-gradient(120% 150% at 50% 0%, rgba(0,168,232,0.12), transparent 58%), rgba(255,255,255,0.015); }

/* Footer socials */
.lp-social { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.65); transition: background .2s, color .2s, border-color .2s; cursor: pointer; }
.lp-social:hover { background: rgba(0,168,232,0.1); border-color: rgba(0,168,232,0.3); color: #00A8E8; }
.lp-social-soon { opacity: 0.4; cursor: default; }
.lp-social-soon:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.65); }
`;

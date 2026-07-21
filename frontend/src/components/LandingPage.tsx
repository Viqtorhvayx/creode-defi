"use client";

import React, { useEffect, useRef, useState } from 'react';
import { LockKey, TrendUp, ArrowsLeftRight, UsersThree } from '@phosphor-icons/react';
import { Logo } from './Logo';

const BLUE = '#00A8E8';

interface LandingPageProps {
  onLaunch: () => void;
  onDocs: () => void;
  onNavigate?: (tab: string) => void;
}

/* Reveal-on-scroll wrapper — adds `.lp-in` when the element enters the viewport. */
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

// The four sections — the only place icons are used.
const SECTIONS = [
  { icon: LockKey, name: 'Vault', tab: 'Vault', desc: 'Time-locked savings that pay a fixed APY by asset tier — up to 22% on ecosystem tokens over 7 / 30 / 60-day locks.' },
  { icon: TrendUp, name: 'Earn', tab: 'Earn', desc: 'Supply one token and the protocol auto-zaps it into a balanced yield position, with hands-off auto-compounding via Hedera HIP-1215.' },
  { icon: ArrowsLeftRight, name: 'Trade', tab: 'P2P', desc: 'A trustless peer-to-peer order book with escrowed limit orders and live market data. No house, no pool.' },
  { icon: UsersThree, name: 'Community', tab: 'Earn', desc: 'Hold CODE to open proposals and cast weighted votes on emissions, new assets, and upgrades — every tally settles on-chain.' },
];

const SECURITY = [
  { t: 'Native HTS controls', d: 'Token rules are enforced by network consensus — not just application code.' },
  { t: 'Explicit association', d: 'Accounts opt in to tokens, blocking dusting and unsolicited-token attacks by default.' },
  { t: 'aBFT finality', d: "Hedera's hashgraph consensus gives fast, final settlement with no re-org risk." },
  { t: 'Verified on HashScan', d: 'Every Creode contract is source-verified and publicly auditable.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onDocs, onNavigate }) => {
  const go = (tab: string) => (onNavigate ? onNavigate(tab) : onLaunch());
  return (
    <div className="lp-root min-h-screen w-full overflow-x-hidden text-white antialiased">
      <style>{lpCss}</style>

      {/* Nav — text only */}
      <nav className="relative z-20 mx-auto flex max-w-[1180px] items-center justify-between px-8 py-7">
        <button onClick={onLaunch} className="scale-90 origin-left"><Logo theme="dark" /></button>
        <div className="flex items-center gap-9">
          <button onClick={onDocs} className="hidden text-[13.5px] font-semibold tracking-wide text-white/55 transition-colors hover:text-white sm:block">Docs</button>
          <button onClick={onLaunch} className="lp-navcta">Launch App</button>
        </div>
      </nav>

      {/* Hero — oversized editorial type with a curtain-up mask reveal */}
      <header className="lp-hero relative z-10 mx-auto flex min-h-[86vh] max-w-[1180px] flex-col justify-center px-8 pb-20">
        <div className="lp-eyebrow" style={{ animationDelay: '80ms' }}>
          <span className="lp-dot" /> Non-custodial DeFi protocol · Hedera
        </div>

        <h1 className="lp-h1 mt-7">
          <span className="lp-line"><span style={{ animationDelay: '160ms' }}>Everything DeFi,</span></span>
          <span className="lp-line"><span style={{ animationDelay: '300ms' }}>settled on <em className="lp-accent">Hedera.</em></span></span>
        </h1>

        <p className="lp-sub" style={{ animationDelay: '620ms' }}>
          Save, earn, trade, and govern in one place — every action a plain on-chain transaction
          you sign yourself, secured at the network layer by HTS.
        </p>

        <div className="lp-actions" style={{ animationDelay: '740ms' }}>
          <button onClick={onLaunch} className="lp-btn-primary">Launch App</button>
          <button onClick={onDocs} className="lp-btn-ghost">Read the Docs</button>
        </div>

        {/* Thin meta row — text only */}
        <div className="lp-meta" style={{ animationDelay: '900ms' }}>
          <div><span className="lp-metanum"><CountUp to={4} /></span><span className="lp-metalabel">Products</span></div>
          <span className="lp-metasep" />
          <div><span className="lp-metanum"><CountUp to={9} /></span><span className="lp-metalabel">Verified contracts</span></div>
          <span className="lp-metasep" />
          <div><span className="lp-metanum"><CountUp to={7} /></span><span className="lp-metalabel">Trading pairs</span></div>
          <span className="lp-metasep" />
          <div><span className="lp-metanum"><CountUp to={100} suffix="%" /></span><span className="lp-metalabel">On-chain</span></div>
        </div>
      </header>

      {/* Sections — the only icons on the page */}
      <section id="sections" className="relative z-10 mx-auto max-w-[1180px] px-8 py-24">
        <Reveal>
          <span className="lp-kicker">The protocol</span>
          <h2 className="lp-h2 mt-4 max-w-[16ch]">Four ways to move on-chain.</h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:grid-cols-2">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.name} delay={i * 80}>
                <button onClick={() => go(s.tab)} className="lp-section group">
                  <div className="lp-section-ico"><Icon size={20} weight="regular" /></div>
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
            <h2 className="lp-h2 mt-4">Auto-compounding that runs itself.</h2>
            <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-white/55">
              Turn on auto-compound and Creode compounds your position on-chain — no bots, no keepers.
              Powered by Hedera HIP-1215 scheduled contract calls: each tick compounds every enrolled
              position and schedules the next one itself.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Security — no icons */}
      <section id="security" className="relative z-10 mx-auto max-w-[1180px] px-8 py-24">
        <Reveal>
          <span className="lp-kicker">Security</span>
          <h2 className="lp-h2 mt-4 max-w-[18ch]">Secured by Hedera HTS.</h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-white/55">Token rules enforced at the network layer, not just in application code.</p>
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
          <div className="lp-final">
            <h2 className="lp-h2 text-center">Start earning on Creode.</h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-center text-[15px] leading-relaxed text-white/55">
              Connect a wallet on Hedera Testnet, claim test tokens from the faucet, and try every product — with no real funds at risk.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button onClick={onLaunch} className="lp-btn-primary">Launch App</button>
              <button onClick={onDocs} className="lp-btn-ghost">Read the Docs</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer — text only */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-8 py-10 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <div className="scale-90 origin-left"><Logo theme="dark" /></div>
            <p className="text-[12px] text-white/35">Non-custodial DeFi on Hedera · Testnet · No real funds at risk.</p>
          </div>
          <div className="flex flex-wrap items-center gap-7 text-[13px] font-semibold text-white/45">
            <button onClick={onDocs} className="transition-colors hover:text-white">Docs</button>
            <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">HashScan</a>
            <a href="https://docs.hedera.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Hedera</a>
            <span className="text-[#10B981]">Contracts verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* Scoped landing CSS. Editorial type + curtain-up reveal; keeps Creode's dark + cyan. */
const lpCss = `
.lp-root { position: relative; background: #07090d; }
.lp-root::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(70% 55% at 50% -8%, rgba(0,168,232,0.14), transparent 60%); }
.lp-root::after { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5;
  background-image: linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(ellipse 75% 60% at 50% 0%, #000 25%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 75% 60% at 50% 0%, #000 25%, transparent 78%); }

@media (prefers-reduced-motion: reduce) {
  .lp-eyebrow, .lp-sub, .lp-actions, .lp-meta, .lp-line > span { animation: none !important; opacity: 1 !important; transform: none !important; }
  .lp-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
}

/* Nav */
.lp-navcta { background: #00A8E8; color: #04121a; font-weight: 800; font-size: 13.5px; padding: 9px 18px; border-radius: 10px; transition: transform .18s, box-shadow .25s; box-shadow: 0 6px 20px rgba(0,168,232,0.28); }
.lp-navcta:hover { transform: translateY(-1px); box-shadow: 0 9px 26px rgba(0,168,232,0.42); }

/* Hero */
.lp-eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.55); opacity: 0; transform: translateY(10px); animation: lpFade .7s cubic-bezier(0.22,1,0.36,1) forwards; }
.lp-dot { width: 7px; height: 7px; border-radius: 50%; background: #00A8E8; box-shadow: 0 0 0 0 rgba(0,168,232,0.5); animation: lpPulse 2.4s ease-out infinite; }
@keyframes lpPulse { 0% { box-shadow: 0 0 0 0 rgba(0,168,232,0.5); } 70%,100% { box-shadow: 0 0 0 8px rgba(0,168,232,0); } }

.lp-h1 { font-size: clamp(46px, 9.2vw, 116px); font-weight: 800; line-height: 0.98; letter-spacing: -0.045em; }
.lp-line { display: block; overflow: hidden; padding-bottom: 0.04em; }
.lp-line > span { display: block; transform: translateY(108%); animation: lpRise 1s cubic-bezier(0.16,1,0.3,1) forwards; }
@keyframes lpRise { to { transform: translateY(0); } }
.lp-accent { font-style: normal; background: linear-gradient(100deg, #00A8E8, #0072FF 60%, #58a6ff); -webkit-background-clip: text; background-clip: text; color: transparent; }

.lp-sub { max-width: 54ch; margin-top: 30px; font-size: clamp(16px, 1.9vw, 19px); line-height: 1.6; color: rgba(255,255,255,0.55); opacity: 0; transform: translateY(14px); animation: lpFade .8s cubic-bezier(0.22,1,0.36,1) forwards; }
.lp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; opacity: 0; transform: translateY(14px); animation: lpFade .8s cubic-bezier(0.22,1,0.36,1) forwards; }
.lp-btn-primary { background: #00A8E8; color: #04121a; font-weight: 800; font-size: 15px; padding: 14px 26px; border-radius: 13px; box-shadow: 0 10px 34px rgba(0,168,232,0.32); transition: transform .18s, box-shadow .25s; }
.lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 44px rgba(0,168,232,0.48); }
.lp-btn-ghost { border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); color: #fff; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 13px; transition: background .2s, border-color .2s; }
.lp-btn-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.26); }

.lp-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 22px; margin-top: 64px; opacity: 0; transform: translateY(14px); animation: lpFade .9s cubic-bezier(0.22,1,0.36,1) forwards; }
.lp-meta > div { display: flex; flex-direction: column; gap: 2px; }
.lp-metanum { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
.lp-metalabel { font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,0.4); }
.lp-metasep { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

@keyframes lpFade { to { opacity: 1; transform: translateY(0); } }

/* Reveal */
.lp-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(0.22,1,0.36,1), transform .7s cubic-bezier(0.22,1,0.36,1); }
.lp-reveal.lp-in { opacity: 1; transform: translateY(0); }

/* Headings */
.lp-kicker { font-size: 12.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #00A8E8; }
.lp-h2 { font-size: clamp(28px, 4.4vw, 46px); font-weight: 800; line-height: 1.05; letter-spacing: -0.035em; }

/* Sections grid */
.lp-section { display: block; width: 100%; text-align: left; background: #0b0e13; padding: 34px; transition: background .25s; cursor: pointer; }
.lp-section:hover { background: #0e131a; }
.lp-section-ico { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 11px; color: #00A8E8; background: rgba(0,168,232,0.1); border: 1px solid rgba(0,168,232,0.22); }
.lp-section-open { display: inline-block; margin-top: 20px; font-size: 13px; font-weight: 700; color: #00A8E8; opacity: 0; transform: translateX(-4px); transition: opacity .25s, transform .25s; }
.lp-section:hover .lp-section-open { opacity: 1; transform: translateX(0); }

/* Feature */
.lp-feature { border: 1px solid rgba(255,255,255,0.09); border-radius: 22px; padding: 44px; background: linear-gradient(120deg, rgba(0,168,232,0.09), transparent 55%); }
.lp-tag { display: inline-block; border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); color: #10B981; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }

/* Security */
.lp-sec { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
.lp-sec-idx { font-size: 12px; font-weight: 700; color: rgba(0,168,232,0.7); letter-spacing: 0.05em; }

/* Final */
.lp-final { border: 1px solid rgba(255,255,255,0.09); border-radius: 26px; padding: 60px 32px; background: radial-gradient(120% 150% at 50% 0%, rgba(0,168,232,0.12), transparent 58%), rgba(255,255,255,0.015); }
`;

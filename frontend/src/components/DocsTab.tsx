"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen, Rocket, LockKey, ChartLineUp, ArrowsLeftRight, Sparkle,
  FileCode, ShieldCheck, Lifebuoy, MagnifyingGlass, ArrowSquareOut, Warning,
} from '@phosphor-icons/react';

const PRIMARY = '#00A8E8';
const GREEN = '#10B981';
const RED = '#EF4444';
const HASHSCAN = (addr: string) => `https://hashscan.io/testnet/contract/${addr}`;

const CONTRACTS: { name: string; addr: string }[] = [
  { name: 'CreodeVault (time-locked savings)', addr: '0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139' },
  { name: 'CreodeYieldVaultV2 (Earn / auto-zap)', addr: '0x634173A0B23bf9Bf36dD1545Ed3D95af3F0eDeF3' },
  { name: 'CreodeSwapRouter (constant-product AMM)', addr: '0x34624a10E293039c18724FFCb4e0431dA45DaED3' },
  { name: 'CreodeTreasurySwap', addr: '0x2a873ED611D755e8B73E29a4839E34136e70eC53' },
  { name: 'CreodeP2P (order-book escrow)', addr: '0x87b6de843538E31fc368e13BE232320915a734ef' },
  { name: 'CreodeFaucet (test tokens)', addr: '0x2449135C532f78ed43C9c4a99307aAA987D39A41' },
];

interface Props {
  theme: 'light' | 'dark';
  focus?: 'overview' | 'security' | 'support';
}

export const DocsTab: React.FC<Props> = ({ theme, focus = 'overview' }) => {
  const dark = theme === 'dark';
  const textMain = dark ? 'text-white' : 'text-slate-900';
  const textMuted = dark ? 'text-white/60' : 'text-slate-500';
  const border = dark ? 'border-white/10' : 'border-[#EAECEF]';
  const glass = 'border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl';
  const codeBg = dark ? 'bg-white/5' : 'bg-slate-100';

  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string>(focus);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Reusable content atoms ────────────────────────────────────────────
  const H: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className={`text-[22px] font-bold tracking-tight ${textMain} mb-3`}>{children}</h2>
  );
  const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className={`text-[14px] leading-relaxed ${dark ? 'text-white/75' : 'text-slate-600'} mb-3`}>{children}</p>
  );
  const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className={`text-[14px] leading-relaxed ${dark ? 'text-white/75' : 'text-slate-600'}`}>{children}</li>
  );
  const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className={`font-semibold ${textMain}`}>{children}</span>;
  const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className={`text-[12.5px] font-mono px-1.5 py-0.5 rounded ${codeBg} ${textMain}`}>{children}</code>
  );
  const A: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline inline-flex items-center gap-1" style={{ color: PRIMARY }}>
      {children} <ArrowSquareOut size={12} weight="bold" />
    </a>
  );
  const Callout: React.FC<{ color?: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ color = PRIMARY, icon, children }) => (
    <div className="flex items-start gap-3 rounded-xl p-4 mb-4 border" style={{ background: `${color}14`, borderColor: `${color}33` }}>
      {icon}
      <div className="text-[13px] leading-relaxed" style={{ color }}>{children}</div>
    </div>
  );
  const Pill: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = PRIMARY }) => (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${color}1A`, color }}>{children}</span>
  );

  // ── Sections ──────────────────────────────────────────────────────────
  const sections = useMemo(() => [
    {
      id: 'overview', title: 'Overview', icon: BookOpen, keywords: 'about creode hedera defi intro',
      body: (
        <>
          <H>Overview</H>
          <div className="flex flex-wrap gap-2 mb-4">
            <Pill>Hedera Testnet · chain 296</Pill>
            <Pill color={GREEN}>Non-custodial</Pill>
            <Pill color={RED}>Testnet · no real funds</Pill>
          </div>
          <P><B>Creode</B> is a DeFi protocol on Hedera bundling three products behind one non-custodial app. Everything settles on-chain — the app never holds your keys or funds.</P>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <Li><B>Vault</B> — time-locked savings that pay a fixed APY by asset tier.</Li>
            <Li><B>Earn (Yield Hub)</B> — one-token "auto-zap" into balanced dual-token yield positions.</Li>
            <Li><B>P2P Trading</B> — an on-chain order-book spot exchange with escrowed limit orders.</Li>
          </ul>
          <Callout icon={<Warning size={18} weight="fill" style={{ color: RED }} className="shrink-0 mt-0.5" />} color={RED}>
            This deployment runs on <B>Hedera Testnet</B>. All tokens are test tokens with no monetary value — never send mainnet funds to these contracts.
          </Callout>
        </>
      ),
    },
    {
      id: 'getting-started', title: 'Getting Started', icon: Rocket, keywords: 'wallet connect faucet hashpack metamask setup',
      body: (
        <>
          <H>Getting Started</H>
          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <Li><B>Add a wallet.</B> Use HashPack or MetaMask pointed at <B>Hedera Testnet</B> (chain ID <Code>296</Code> / <Code>0x128</Code>, RPC <Code>https://testnet.hashio.io/api</Code>).</Li>
            <Li><B>Get test HBAR</B> for gas from the <A href="https://portal.hedera.com/faucet">official Hedera faucet</A>.</Li>
            <Li><B>Connect</B> — the button (top-right) then shows your Hedera account ID (<Code>0.0.x</Code>).</Li>
            <Li><B>Claim test tokens</B> — open the wallet dropdown → <B>Daily Test Faucet</B> to receive ~$500 worth of each token (once per 24h).</Li>
            <Li><B>Use the protocol</B> — deposit in Vault, supply in Earn, or trade in P2P. Every action is a normal on-chain transaction you sign in your wallet.</Li>
          </ol>
          <Callout icon={<Sparkle size={18} weight="fill" style={{ color: PRIMARY }} className="shrink-0 mt-0.5" />}>
            Every Vault, Earn, and P2P transaction earns <B>CODE points</B> — see the CODE Points section.
          </Callout>
        </>
      ),
    },
    {
      id: 'vault', title: 'Vault', icon: LockKey, keywords: 'vault lock apy yield penalty deposit withdraw savings',
      body: (
        <>
          <H>Vault — time-locked savings</H>
          <P>Deposit native HBAR or any supported HTS token and lock it for a fixed term to earn a fixed APY. Yield accrues linearly and is paid from the protocol treasury.</P>
          <P><B>Lock terms:</B> 7, 30, or 60 days, or a custom duration. <B>APY depends on the asset tier:</B></P>
          <div className={`overflow-x-auto rounded-xl border ${border} mb-4`}>
            <table className="w-full text-[13px]">
              <thead className={dark ? 'bg-white/5' : 'bg-slate-50'}>
                <tr className={textMuted}>
                  <th className="text-left font-semibold px-4 py-2.5">Tier</th>
                  <th className="text-right font-semibold px-4 py-2.5">7d</th>
                  <th className="text-right font-semibold px-4 py-2.5">30d</th>
                  <th className="text-right font-semibold px-4 py-2.5">60d</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-white/5' : 'divide-slate-100'} ${textMain}`}>
                <tr><td className="px-4 py-2.5">Blue-chip <span className={textMuted}>(HBAR, WETH, WBTC)</span></td><td className="px-4 py-2.5 text-right tabular-nums">3.50%</td><td className="px-4 py-2.5 text-right tabular-nums">5.50%</td><td className="px-4 py-2.5 text-right tabular-nums">8.00%</td></tr>
                <tr><td className="px-4 py-2.5">Stablecoins <span className={textMuted}>(USDC, USDT)</span></td><td className="px-4 py-2.5 text-right tabular-nums">4.00%</td><td className="px-4 py-2.5 text-right tabular-nums">6.50%</td><td className="px-4 py-2.5 text-right tabular-nums">9.00%</td></tr>
                <tr><td className="px-4 py-2.5">Ecosystem <span className={textMuted}>(SAUCE, PACK, JAM, BONZO)</span></td><td className="px-4 py-2.5 text-right tabular-nums">8.00%</td><td className="px-4 py-2.5 text-right tabular-nums">14.00%</td><td className="px-4 py-2.5 text-right tabular-nums">22.00%</td></tr>
              </tbody>
            </table>
          </div>
          <P>At or after maturity you withdraw your <B>full principal plus accrued yield</B>. Custom terms interpolate between the tier rates.</P>
          <Callout icon={<Warning size={18} weight="fill" style={{ color: RED }} className="shrink-0 mt-0.5" />} color={RED}>
            <B>Early withdrawal</B> incurs a time-decay penalty of up to <B>2% on principal</B> (largest right after deposit, shrinking to 0 at maturity). Accrued yield is always paid out in full.
          </Callout>
        </>
      ),
    },
    {
      id: 'earn', title: 'Earn / Yield Hub', icon: ChartLineUp, keywords: 'earn yield zap liquidity pool compound apy strategy',
      body: (
        <>
          <H>Earn — Yield Hub</H>
          <P>The Yield Hub runs balanced <B>dual-token liquidity positions</B> without you having to hold both tokens. Supply a single asset and the protocol <B>auto-zaps</B> it:</P>
          <ol className="list-decimal pl-5 space-y-1.5 mb-4">
            <Li>You deposit one token (e.g. HBAR).</Li>
            <Li>The <B>SwapRouter</B> (a constant-product AMM) swaps ~50% into the pair token to build a ~50/50 position.</Li>
            <Li>The balanced position is deposited into <B>CreodeYieldVaultV2</B>, which accrues yield.</Li>
          </ol>
          <P>You can <B>Compound</B> accrued rewards back into your position at any time, <B>Supply More</B>, or <B>Withdraw</B> the full position on demand. Live APY and TVL on each strategy are derived from real on-chain vault custody and prices.</P>
        </>
      ),
    },
    {
      id: 'p2p', title: 'P2P Trading', icon: ArrowsLeftRight, keywords: 'p2p order book trade limit market long short escrow fee slippage',
      body: (
        <>
          <H>P2P Trading — on-chain order book</H>
          <P>P2P is a peer-to-peer spot exchange. There is <B>no house or pool</B> — every trade matches one user's order against another's, settled trustlessly by the <B>CreodeP2P</B> escrow contract.</P>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <Li><B>Limit order</B> — you post a price; your sell side is <B>escrowed</B> in the contract until it's filled, cancelled, or expires.</Li>
            <Li><B>Market order</B> — fills the best-priced resting order immediately. <B>Partial fills</B> are supported.</Li>
            <Li><B>Long</B> = buy the base token with the quote; <B>Short</B> = sell the base token for the quote.</Li>
            <Li>On each fill the taker pays the maker directly; the escrow is released to the taker minus a <B>0.20% protocol fee</B>.</Li>
          </ul>
          <P>Because each order has a <B>fixed price</B>, there is no AMM-style slippage — a 0.5% floor simply guards each fill against dust rounding. Tradeable pairs: <Code>HBAR-USDC</Code>, <Code>USDT-USDC</Code>, <Code>WBTC-USDC</Code>, <Code>WETH-USDC</Code>, <Code>SAUCE-USDC</Code>, <Code>DOVU-USDC</Code>, <Code>HBAR-SAUCE</Code>.</P>
          <Callout icon={<ChartLineUp size={18} weight="fill" style={{ color: PRIMARY }} className="shrink-0 mt-0.5" />}>
            Charts use real market data — <B>Pyth Network</B> for majors and <B>SaucerSwap / GeckoTerminal</B> for Hedera small-caps. Prices are live, not simulated.
          </Callout>
        </>
      ),
    },
    {
      id: 'code-points', title: 'CODE Points', icon: Sparkle, keywords: 'code points rewards activity incentive',
      body: (
        <>
          <H>CODE Points</H>
          <P>CODE points reward real protocol usage. Every <B>successful</B> transaction that moves value through Vault, Earn, or P2P earns CODE, <B>weighted by the USD value moved</B>:</P>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <Li>Minimum <B>5 CODE</B> per protocol action.</Li>
            <Li>Roughly <B>1 CODE per $10</B> of value — so a $1,000 action earns ~100, a $5,000 action ~500.</Li>
            <Li>Faucet claims, approvals, and plain transfers earn nothing.</Li>
          </ul>
          <P>Your running total and per-transaction rewards are shown in the <B>Activity</B> tab, computed from your real on-chain history.</P>
        </>
      ),
    },
    {
      id: 'contracts', title: 'Contracts & Addresses', icon: FileCode, keywords: 'contracts addresses hashscan network rpc chain',
      body: (
        <>
          <H>Contracts &amp; Addresses</H>
          <P>Network: <B>Hedera Testnet</B> · chain <Code>296</Code> (<Code>0x128</Code>) · JSON-RPC <Code>https://testnet.hashio.io/api</Code>. Tokens are HTS test tokens exposing the ERC-20 interface at their EVM address.</P>
          <div className={`overflow-x-auto rounded-xl border ${border} mb-2`}>
            <table className="w-full text-[13px]">
              <thead className={dark ? 'bg-white/5' : 'bg-slate-50'}>
                <tr className={textMuted}><th className="text-left font-semibold px-4 py-2.5">Contract</th><th className="text-left font-semibold px-4 py-2.5">Address</th></tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-white/5' : 'divide-slate-100'} ${textMain}`}>
                {CONTRACTS.map((c) => (
                  <tr key={c.addr}>
                    <td className="px-4 py-2.5">{c.name}</td>
                    <td className="px-4 py-2.5"><A href={HASHSCAN(c.addr)}><span className="font-mono text-[12px]">{c.addr.slice(0, 10)}…{c.addr.slice(-6)}</span></A></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'security', title: 'Audits & Security', icon: ShieldCheck, keywords: 'audit security safe openzeppelin risk',
      body: (
        <>
          <H>Audits &amp; Security</H>
          <Callout icon={<Warning size={18} weight="fill" style={{ color: RED }} className="shrink-0 mt-0.5" />} color={RED}>
            These contracts are <B>testnet, unaudited</B> software. There is no third-party audit and no real value at risk. Do not deploy this code to mainnet or use it with real funds until it has been professionally audited.
          </Callout>
          <P>That said, the contracts are built on battle-tested primitives:</P>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <Li>OpenZeppelin <B>AccessControl</B>, <B>ReentrancyGuard</B>, <B>Pausable</B>, and <B>SafeERC20</B>.</Li>
            <Li><B>Non-custodial escrow</B> — the P2P contract only holds a maker's funds until their own order fills or is cancelled; makers can always cancel to reclaim escrow.</Li>
            <Li>Admin functions (pause, fee, treasury) are role-gated; the protocol fee is hard-capped in-contract.</Li>
          </ul>
          <P>All source and deployments are verifiable on <A href="https://hashscan.io/testnet">HashScan</A>.</P>
        </>
      ),
    },
    {
      id: 'support', title: 'Support & Links', icon: Lifebuoy, keywords: 'support help contact links explorer',
      body: (
        <>
          <H>Support &amp; Links</H>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <Li><A href="https://hashscan.io/testnet">HashScan (Testnet explorer)</A> — look up any transaction, account, or contract.</Li>
            <Li><A href="https://portal.hedera.com/faucet">Hedera Testnet faucet</A> — get test HBAR for gas.</Li>
            <Li><A href="https://docs.hedera.com">Hedera developer docs</A> — network, HTS, and JSON-RPC reference.</Li>
          </ul>
          <P>Hit a snag? The most common issues are (1) wallet not on Hedera Testnet, (2) no test HBAR for gas, or (3) a token you haven't claimed from the faucet yet. Work through the Getting Started checklist first.</P>
        </>
      ),
    },
  ], [dark]);

  // Scroll to the focused section when the tab (Docs/Audits/Support) mounts.
  useEffect(() => {
    const el = document.getElementById(`doc-${focus}`);
    if (el && contentRef.current) contentRef.current.scrollTo({ top: el.offsetTop - 12, behavior: 'auto' });
    setActive(focus);
  }, [focus]);

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id.replace('doc-', ''));
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );
    root.querySelectorAll('[data-doc-section]').forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [sections]);

  const q = query.trim().toLowerCase();
  const visible = q ? sections.filter((s) => (s.title + ' ' + s.keywords).toLowerCase().includes(q)) : sections;

  const go = (id: string) => {
    const el = document.getElementById(`doc-${id}`);
    if (el && contentRef.current) contentRef.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
    setActive(id);
  };

  return (
    <div className={`w-full max-w-[1200px] mx-auto px-4 ${textMain}`}>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-tight leading-none">Documentation</h1>
        <span className={`text-[13px] font-medium ${textMuted} mt-1.5 inline-block`}>How Creode works — Vault, Earn, P2P, and the contracts behind them.</span>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left nav (glassmorphism) */}
        <aside className={`hidden lg:block w-[240px] shrink-0 ${glass} rounded-2xl p-3 sticky top-4`}>
          <div className={`flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg border ${border} ${dark ? 'bg-black/20' : 'bg-slate-50'}`}>
            <MagnifyingGlass size={15} className={textMuted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs…"
              className={`bg-transparent outline-none border-none text-[13px] w-full ${textMain} placeholder:text-slate-400`}
            />
          </div>
          <nav className="flex flex-col gap-0.5">
            {visible.map((s) => {
              const Icon = s.icon;
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-left transition-colors ${on ? '' : (dark ? 'text-white/60 hover:bg-white/5' : 'text-slate-500 hover:bg-black/5')}`}
                  style={on ? { background: `${PRIMARY}18`, color: PRIMARY } : undefined}
                >
                  <Icon size={16} weight={on ? 'fill' : 'regular'} /> {s.title}
                </button>
              );
            })}
            {visible.length === 0 && <span className={`px-2.5 py-2 text-[13px] ${textMuted}`}>No matches</span>}
          </nav>
        </aside>

        {/* Content */}
        <main
          ref={contentRef}
          className={`flex-1 min-w-0 ${glass} rounded-2xl p-6 sm:p-8 overflow-y-auto`}
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          {/* Mobile search */}
          <div className={`lg:hidden flex items-center gap-2 px-3 py-2 mb-5 rounded-lg border ${border} ${dark ? 'bg-black/20' : 'bg-slate-50'}`}>
            <MagnifyingGlass size={15} className={textMuted} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search docs…" className={`bg-transparent outline-none border-none text-[13px] w-full ${textMain} placeholder:text-slate-400`} />
          </div>

          {visible.map((s, i) => (
            <section key={s.id} id={`doc-${s.id}`} data-doc-section className={i > 0 ? `mt-10 pt-10 border-t ${border}` : ''}>
              {s.body}
            </section>
          ))}
          {visible.length === 0 && <div className={`text-[14px] ${textMuted} py-10 text-center`}>No sections match “{query}”.</div>}
        </main>
      </div>
    </div>
  );
};

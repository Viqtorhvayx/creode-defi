import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Database, ShieldCheck, Info, ArrowUpRight, Lightning, CircleNotch } from '@phosphor-icons/react';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { STRATEGIES, depositToStrategy } from '../lib/yieldVault';

export interface StrategyToken {
  sym: string;
  logo: string | null;
  fallback: string;
  bg: string;
}

export interface Strategy {
  pair: string;
  token1: StrategyToken;
  token2: StrategyToken;
  riskLevel: string;
  riskBgClass: string;
  riskTextClass: string;
  apy: string;
  tvl: string;
  token1Amount: string;
  token1Usd: string;
  token2Amount: string;
  token2Usd: string;
  dailyEarnings: string;
}

interface EarnStrategyDetailProps {
  theme: 'light' | 'dark';
  strategy: Strategy;
  onBack: () => void;
}

// Brand accent — keep in sync with the rest of the dapp.
const BLUE = '#00A8E8';

const TokenBadge: React.FC<{ token: StrategyToken; size: number; border: string }> = ({ token, size, border }) => (
  token.logo ? (
    <img src={token.logo} alt={token.sym} className={`rounded-full border-2 ${border}`} style={{ width: size, height: size }} />
  ) : (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold border-2 ${border} ${token.bg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {token.fallback}
    </div>
  )
);

export const EarnStrategyDetail: React.FC<EarnStrategyDetailProps> = ({ theme, strategy, onBack }) => {
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-[#111827]';
  const textMuted = isDark ? 'text-white/60' : 'text-slate-500';
  const cardBg = isDark ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const logoBorder = isDark ? 'border-[#0F141A]' : 'border-white';
  const pillBg = isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200';

  const { token1, token2 } = strategy;
  const apyNum = strategy.apy.replace('%', '');

  // Implied per-token USD prices, derived from the strategy's default
  // amount/USD so the split preview and USD value stay self-consistent.
  const parseNum = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
  const fmtUsd = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtTok = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n >= 1 ? 2 : 6 });
  const price1 = parseNum(strategy.token1Amount) > 0 ? parseNum(strategy.token1Usd) / parseNum(strategy.token1Amount) : 0;
  const price2 = parseNum(strategy.token2Amount) > 0 ? parseNum(strategy.token2Usd) / parseNum(strategy.token2Amount) : 0;

  // On-chain strategy metadata (id + accepted deposit tokens).
  const meta = STRATEGIES[strategy.pair];
  const acceptedSyms = new Set((meta?.tokens || []).map((t) => t.sym));

  // Single-sided "zap": the user supplies ONE token; the contract swaps
  // ~half into the other side to build a balanced LP position. Only tokens
  // the vault actually accepts on-chain are offered.
  const zapTokens: StrategyToken[] = (meta ? [token1, token2].filter((t) => acceptedSyms.has(t.sym)) : [token1, token2]);
  const [zapIdx, setZapIdx] = useState(0);
  const [amt, setAmt] = useState(strategy.token1Amount);
  useEffect(() => {
    setZapIdx(0);
    setAmt(strategy.token1Amount);
  }, [strategy.pair]);

  const zapToken = zapTokens[Math.min(zapIdx, zapTokens.length - 1)] || token1;
  const zapPrice = zapToken.sym === token1.sym ? price1 : price2;
  const amtNum = parseNum(amt);
  const hasAmt = amtNum > 0;
  const totalUsd = amtNum * zapPrice;         // full value being supplied
  const halfUsd = totalUsd / 2;               // each side of the balanced position
  const out1 = price1 > 0 ? halfUsd / price1 : 0;
  const out2 = price2 > 0 ? halfUsd / price2 : 0;

  const selectZap = (i: number) => {
    setZapIdx(i);
    const sym = zapTokens[i]?.sym;
    setAmt(sym === token2.sym ? strategy.token2Amount : strategy.token1Amount);
  };

  // Wallet + on-chain deposit wiring.
  const { isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const [zapState, setZapState] = useState<'idle' | 'pending' | 'done'>('idle');

  const metaTok = meta?.tokens.find((t) => t.sym === zapToken.sym);

  const handleZap = async () => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    if (!meta || !metaTok) { alert('This strategy is not available on-chain yet.'); return; }
    if (!hasAmt) return;
    setZapState('pending');
    try {
      await depositToStrategy(walletClient, meta.id, metaTok, amt.replace(/,/g, ''));
      setZapState('done');
      setTimeout(() => setZapState('idle'), 4000);
    } catch (e) {
      const err = e as any;
      console.error('[Zap] failed:', err);
      alert('Zap failed: ' + (err?.reason || err?.shortMessage || err?.message || 'Unknown error'));
      setZapState('idle');
    }
  };

  const TokenPill: React.FC<{ token: StrategyToken }> = ({ token }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 ${pillBg}`}>
      {token.logo ? (
        <img src={token.logo} alt={token.sym} className="w-[18px] h-[18px] rounded-full" />
      ) : (
        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${token.bg}`}>
          <span className="text-white text-[10px] font-bold">{token.fallback}</span>
        </div>
      )}
      <span className="text-[13px] font-bold">{token.sym}</span>
    </div>
  );

  return (
    <div className={`w-full max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20 ${textMain}`}>
      {/* Top Navigation & Title */}
      <div className="flex flex-col gap-5 mb-8">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 w-fit text-[14px] font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Discover
        </button>

        <div className="flex items-center gap-4">
          {/* Overlapping pair logo comes first */}
          <div className="flex -space-x-3">
            <div className="relative z-10"><TokenBadge token={token1} size={44} border={logoBorder} /></div>
            <TokenBadge token={token2} size={44} border={logoBorder} />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight">{strategy.pair}</h1>
          <div className={`px-3 py-1 rounded-md text-[12px] font-bold ${strategy.riskBgClass} ${strategy.riskTextClass}`}>
            {strategy.riskLevel} Profile
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">

        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-6 w-full">

          {/* Metrics Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
            {/* APY */}
            <div className={`flex-1 border-r ${borderColor} pr-8 flex flex-col justify-center`}>
              <div className="flex items-baseline mb-2">
                <span className="text-[48px] font-bold leading-none" style={{ color: BLUE }}>{apyNum}</span>
                <span className="text-[24px] font-bold" style={{ color: BLUE }}>%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Current Net APY</span>
                <Info size={14} className={textMuted} />
              </div>
            </div>

            {/* TVL */}
            <div className="flex-1 pl-8 flex flex-col justify-center">
              <div className="flex items-baseline mb-2">
                <span className="text-[48px] font-bold leading-none tracking-tight">{strategy.tvl}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Total Value Locked (TVL)</span>
                <Info size={14} className={textMuted} />
              </div>
            </div>
          </div>

          {/* How it Works Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} style={{ color: BLUE }} weight="fill" />
              <h2 className="text-[16px] font-bold tracking-tight">How it Works</h2>
            </div>
            <p className={`text-[14px] leading-[1.6] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              This strategy automatically provisions concentrated liquidity for the {token1.sym} / {token2.sym} pair into high-volume bands on SaucerSwap V2. Creode's smart contracts actively manage and dynamically re-range the price boundaries to prevent out-of-range yield pauses, maximizing your trading fee collection automatically.
            </p>
          </div>

          {/* Protocol & Rewards Ledger Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
            <div className="flex items-center gap-2 mb-6">
              <Database size={20} style={{ color: BLUE }} weight="fill" />
              <h2 className="text-[16px] font-bold tracking-tight">Protocol & Rewards Ledger</h2>
            </div>

            <div className="flex flex-col w-full">
              {/* Row 1 */}
              <div className={`flex justify-between items-center py-5 border-b ${borderColor}`}>
                <span className={`text-[13px] font-semibold ${textMuted}`}>Underlying Venue</span>
                <span className="text-[13px] font-bold">SaucerSwap V2 (100% Allocation)</span>
              </div>
              {/* Row 2 */}
              <div className={`flex justify-between items-center py-5 border-b ${borderColor}`}>
                <span className={`text-[13px] font-semibold ${textMuted}`}>Compounding Type</span>
                <span className="text-[13px] font-bold text-right max-w-[250px] leading-snug">
                  Automated via Hedera Scheduled<br/>Transactions (HIP-1215)
                </span>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center pt-5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Incentives Earned</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold" style={{ backgroundColor: 'rgba(0,168,232,0.1)', color: BLUE }}>{token1.sym} Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">{token2.sym} Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">+CODE Points ✦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 px-2">
            <CheckCircle size={16} style={{ color: BLUE }} weight="fill" />
            <span className={`text-[12px] font-medium ${textMuted}`}>
              Creode automatically manages your position to optimize returns. Impermanent loss may occur. <a href="#" className="inline-flex items-center gap-0.5 hover:underline align-baseline" style={{ color: BLUE }}>Learn more <ArrowUpRight size={12} weight="bold" /></a>
            </span>
          </div>

        </div>

        {/* === RIGHT COLUMN: Supply Liquidity Panel === */}
        <div className="flex flex-col w-full h-full">
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-6 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>

            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[16px] font-bold tracking-tight">Zap In</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(0,168,232,0.1)', color: BLUE }}>
                <Lightning size={11} weight="fill" /> Single-sided
              </span>
            </div>
            <p className={`text-[12px] font-medium mb-5 ${textMuted}`}>
              Supply just one token — we auto-swap ~50% to build the balanced position.
            </p>

            {/* Zap token selector */}
            <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Supply with</span>
            <div className="flex items-center gap-2 mb-4">
              {zapTokens.map((t, i) => {
                const active = zapIdx === i;
                return (
                  <button
                    key={t.sym}
                    onClick={() => selectZap(i)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] border text-[13px] font-bold transition-colors ${
                      active
                        ? 'border-[#00A8E8] text-[#00A8E8] bg-[#00A8E8]/10'
                        : `${borderColor} ${textMuted} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`
                    }`}
                  >
                    {t.logo ? (
                      <img src={t.logo} alt={t.sym} className="w-[18px] h-[18px] rounded-full" />
                    ) : (
                      <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px] font-bold ${t.bg}`}>{t.fallback}</span>
                    )}
                    {t.sym}
                  </button>
                );
              })}
            </div>

            {/* Single amount input */}
            <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</span>
            <div className={`w-full ${isDark ? 'bg-[#0b0e14]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-[#EAECEF]'} rounded-[12px] p-4 flex flex-col focus-within:border-[#00A8E8] transition-colors mb-5`}>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  placeholder="0.00"
                  className={`bg-transparent border-none outline-none text-[32px] font-bold tracking-tight w-full p-0 m-0 leading-none placeholder-slate-300 dark:placeholder-white/20 ${textMain}`}
                />
                <TokenPill token={zapToken} />
              </div>
              <span className={`text-[12px] mt-1 font-bold transition-colors ${hasAmt ? 'text-[#00A8E8]' : textMuted}`}>{fmtUsd(totalUsd)}</span>
            </div>

            {/* Auto-Zap breakdown */}
            <div className={`rounded-[12px] border ${borderColor} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} p-4 mb-6`}>
              <div className="flex items-center gap-1.5 mb-3">
                <Lightning size={13} weight="fill" style={{ color: BLUE }} />
                <span className={`text-[12px] font-bold ${textMain}`}>Auto-Zap breakdown</span>
                <div className="flex-1" />
                <span className={`text-[11px] font-medium ${textMuted}`}>~50 / 50</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {[{ t: token1, out: out1 }, { t: token2, out: out2 }].map(({ t, out }) => (
                  <div key={t.sym} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.logo ? (
                        <img src={t.logo} alt={t.sym} className="w-[20px] h-[20px] rounded-full" />
                      ) : (
                        <span className={`w-[20px] h-[20px] rounded-full flex items-center justify-center text-white text-[10px] font-bold ${t.bg}`}>{t.fallback}</span>
                      )}
                      <span className={`text-[13px] font-semibold ${textMain}`}>{t.sym}</span>
                    </div>
                    <span className={`text-[13px] font-bold ${hasAmt ? textMain : textMuted}`}>~{fmtTok(out)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Row */}
            <div className={`flex flex-col border-y ${borderColor} py-4 mb-6 gap-3`}>
              <div className="flex justify-between items-center">
                <span className={`text-[13px] font-medium ${textMuted}`}>Slippage Tolerance</span>
                <span className="text-[13px] font-bold">0.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[13px] font-medium ${textMuted}`}>Estimated Daily Earnings</span>
                <span className="text-[13px] font-bold text-[#00c076]">{strategy.dailyEarnings}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleZap}
              disabled={zapState === 'pending' || !hasAmt || !isConnected}
              className={`w-full py-4 rounded-[12px] text-[15px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                zapState === 'done'
                  ? 'bg-emerald-500 text-white'
                  : (!isConnected || !hasAmt)
                    ? `${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'} cursor-not-allowed`
                    : zapState === 'pending'
                      ? 'bg-[#00A8E8]/80 text-white cursor-wait'
                      : 'bg-gradient-to-r from-[#00A8E8] to-[#0090C7] hover:from-[#0090C7] hover:to-[#007ba8] text-white'
              }`}
            >
              {zapState === 'done' ? (
                <><CheckCircle size={16} weight="fill" /> Zapped in!</>
              ) : zapState === 'pending' ? (
                <><CircleNotch size={16} weight="bold" className="animate-spin" /> Confirming…</>
              ) : !isConnected ? (
                'Connect wallet to zap in'
              ) : (
                <><Lightning size={16} weight="fill" /> Confirm &amp; Zap In</>
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

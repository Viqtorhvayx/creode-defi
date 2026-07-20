"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlass,
  CopySimple,
  ArrowSquareOut,
  Check,
  X,
  CircleNotch,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowsClockwise,
  Receipt,
  CaretDown,
} from '@phosphor-icons/react';
import { useAccount } from 'wagmi';
import { useWallet } from '../context/WalletContext';

interface ActivityTabProps {
  theme: 'light' | 'dark';
}

interface Tx {
  txId: string;
  type: string;
  detail: string;
  amount: { value: number; display: string; sym: string } | null;
  fee: number;
  timestamp: number;
  status: 'success' | 'failed';
  result: string;
  hashscanUrl: string;
}

// Semantic palette: green = inflow/profit, red = outflow/failed, primary = brand.
const GREEN = '#16C784';
const RED = '#EA3943';
const PRIMARY = '#00A8E8';

const isProtocol = (type: string) => /p2p|vault|swap|faucet|router|contract/i.test(type);

const fmtTime = (secs: number): string =>
  new Date(secs * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

type Dir = 'in' | 'out' | 'failed' | 'neutral';
const dirOf = (t: Tx): Dir =>
  t.status === 'failed' ? 'failed' : !t.amount ? 'neutral' : t.amount.value >= 0 ? 'in' : 'out';

export const ActivityTab: React.FC<ActivityTabProps> = ({ theme }) => {
  const dark = theme === 'dark';
  const textMain = dark ? 'text-white' : 'text-slate-900';
  const textMuted = dark ? 'text-white/55' : 'text-slate-500';
  const borderColor = dark ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = dark ? 'bg-[#0F141A]' : 'bg-white';
  const rowHover = dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50';

  const { isConnected } = useWallet();
  const { address } = useAccount();

  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) { setTxs([]); setAccountId(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/activity/${address}`);
      const data = await res.json();
      setTxs(data.transactions || []);
      setNext(data.next || null);
      setAccountId(data.accountId || null);
    } catch (e) {
      console.error('[Activity] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!address || !next) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/activity/${address}?before=${encodeURIComponent(next)}`);
      const data = await res.json();
      setTxs((prev) => [...prev, ...(data.transactions || [])]);
      setNext(data.next || null);
    } catch (e) {
      console.error('[Activity] load more failed:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? txs.filter((t) => t.txId.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q) || (t.amount?.sym.toLowerCase().includes(q)))
    : txs;

  // Leading direction icon — communicates profit (green) vs loss/failed (red) at a glance.
  const DirIcon: React.FC<{ dir: Dir }> = ({ dir }) => {
    const map = {
      in: { bg: `${GREEN}1A`, color: GREEN, Icon: ArrowDownLeft },
      out: { bg: `${RED}1A`, color: RED, Icon: ArrowUpRight },
      failed: { bg: `${RED}1A`, color: RED, Icon: X },
      neutral: { bg: `${PRIMARY}1A`, color: PRIMARY, Icon: Receipt },
    }[dir];
    const Ic = map.Icon;
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: map.bg }}>
        <Ic size={17} weight="bold" style={{ color: map.color }} />
      </div>
    );
  };

  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-6 ${textMain} px-4 font-['Inter']`}>
      {/* Header */}
      <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">Activity</h1>
          {accountId ? (
            <span className={`text-[13px] font-medium ${textMuted} mt-1.5 inline-block`}>
              On-chain history for <span className="font-semibold" style={{ color: PRIMARY }}>{accountId}</span>
            </span>
          ) : (
            <span className={`text-[13px] font-medium ${textMuted} mt-1.5 inline-block`}>Your on-chain transactions, straight from Hedera.</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <div className={`relative flex items-center ${cardBg} border ${borderColor} rounded-lg px-3 py-2.5 w-[220px] sm:w-[260px] focus-within:border-[#00A8E8]/50 transition-colors`}>
              <MagnifyingGlass className={`${textMuted} mr-2 shrink-0`} size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Tx ID, type, token…"
                className={`bg-transparent outline-none border-none w-full text-[13px] placeholder:text-slate-400 ${textMain}`}
              />
            </div>
          )}
          {isConnected && (
            <button
              onClick={load}
              disabled={loading}
              className={`flex items-center justify-center w-[42px] h-[42px] rounded-lg border ${borderColor} ${cardBg} ${rowHover} transition-colors disabled:opacity-60`}
              title="Refresh"
              style={{ color: PRIMARY }}
            >
              <ArrowsClockwise size={17} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] shadow-sm overflow-hidden mb-8`}>
        {/* Column header */}
        {isConnected && filtered.length > 0 && (
          <div className={`hidden md:grid grid-cols-[2.4fr_1.1fr_1.2fr_1fr_28px] gap-4 px-5 py-3.5 border-b ${borderColor} text-[12px] font-semibold uppercase tracking-wide ${textMuted}`}>
            <div>Transaction</div>
            <div>Date</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Status</div>
            <div />
          </div>
        )}

        {/* States */}
        {!isConnected ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-20 ${textMuted}`}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}14` }}>
              <Wallet size={26} weight="regular" style={{ color: PRIMARY }} />
            </div>
            <span className="text-[14px] font-medium">Connect your wallet to see your transaction history.</span>
          </div>
        ) : loading ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-20 ${textMuted}`}>
            <CircleNotch size={26} weight="bold" className="animate-spin" style={{ color: PRIMARY }} />
            <span className="text-[14px] font-medium">Loading on-chain activity…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-20 ${textMuted}`}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}14` }}>
              <Receipt size={26} weight="regular" style={{ color: PRIMARY }} />
            </div>
            <span className="text-[14px] font-medium">{txs.length === 0 ? 'No transactions found for this wallet yet.' : 'No transactions match your search.'}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => {
              const open = expanded === t.txId;
              const dir = dirOf(t);
              const amtColor = !t.amount ? textMuted : t.amount.value >= 0 ? GREEN : RED;
              const protocol = isProtocol(t.type);
              return (
                <div key={t.txId} className={`border-b ${borderColor} last:border-b-0`}>
                  <div
                    className={`grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.1fr_1.2fr_1fr_28px] gap-3 md:gap-4 px-5 py-3.5 items-center ${rowHover} transition-colors text-[14px] cursor-pointer`}
                    onClick={() => setExpanded(open ? null : t.txId)}
                  >
                    {/* Transaction: icon + type + detail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <DirIcon dir={dir} />
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-[13px] font-bold w-fit px-2 py-0.5 rounded-md leading-tight"
                          style={protocol
                            ? { background: `${PRIMARY}18`, color: PRIMARY }
                            : { background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)', color: dark ? 'rgba(255,255,255,0.75)' : '#475569' }}
                        >
                          {t.type}
                        </span>
                        <span className={`text-[12px] font-medium ${textMuted} truncate mt-1`}>{t.detail}</span>
                      </div>
                    </div>

                    {/* Date (desktop) */}
                    <div className={`hidden md:block ${textMuted} text-[13px]`}>{fmtTime(t.timestamp)}</div>

                    {/* Amount */}
                    <div className="text-right font-bold tabular-nums text-[14px]" style={{ color: amtColor }}>
                      {t.amount ? <>{t.amount.display} <span className="font-semibold">{t.amount.sym}</span></> : <span className={textMuted}>—</span>}
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex justify-end">
                      {t.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold" style={{ background: `${GREEN}1A`, color: GREEN }}>Success <Check size={12} weight="bold" /></span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold" style={{ background: `${RED}1A`, color: RED }}>Failed <X size={12} weight="bold" /></span>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="hidden md:flex justify-end">
                      <CaretDown size={15} className={`${textMuted} transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {open && (
                    <div className={`mx-3 md:mx-5 mb-4 p-4 rounded-xl border ${borderColor} ${dark ? 'bg-[#0b0e14]' : 'bg-[#F8FAFC]'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-2.5 text-[13px] min-w-0">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className={`${textMuted} shrink-0 w-[100px]`}>Transaction ID</span>
                            <div className="flex items-center gap-2 font-medium min-w-0">
                              <span className="truncate">{t.txId}</span>
                              <button onClick={(e) => { e.stopPropagation(); copy(t.txId); }} className="shrink-0">
                                {copied === t.txId ? <Check size={14} style={{ color: GREEN }} /> : <CopySimple size={14} className={`${textMuted} cursor-pointer hover:text-[#00A8E8]`} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`${textMuted} shrink-0 w-[100px]`}>Network Fee</span>
                            <span className="font-medium tabular-nums">{t.fee > 0 ? `${t.fee.toFixed(6)} HBAR` : '—'}</span>
                          </div>
                          <div className="flex items-center gap-4 md:hidden">
                            <span className={`${textMuted} shrink-0 w-[100px]`}>Date</span>
                            <span className="font-medium">{fmtTime(t.timestamp)}</span>
                          </div>
                          {t.result !== 'SUCCESS' && (
                            <div className="flex items-center gap-4">
                              <span className={`${textMuted} shrink-0 w-[100px]`}>Result</span>
                              <span className="font-medium" style={{ color: RED }}>{t.result}</span>
                            </div>
                          )}
                        </div>
                        <a
                          href={t.hashscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                          style={{ background: PRIMARY }}
                        >
                          View on HashScan <ArrowSquareOut size={16} weight="bold" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load more */}
      {isConnected && next && !loading && (
        <div className="w-full flex items-center justify-center pb-8 -mt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`flex items-center gap-2 ${cardBg} border ${borderColor} rounded-lg px-6 py-2.5 text-[13px] font-semibold ${rowHover} transition-colors disabled:opacity-60`}
            style={{ color: PRIMARY }}
          >
            {loadingMore ? <><CircleNotch size={14} weight="bold" className="animate-spin" /> Loading…</> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

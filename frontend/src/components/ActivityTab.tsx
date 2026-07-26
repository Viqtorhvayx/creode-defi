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
  ArrowsClockwise,
  Receipt,
  CaretDown,
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
  Broadcast,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { useAccount } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { CTA_BLUE } from '../lib/ui';

interface ActivityTabProps {
  theme: 'light' | 'dark';
}

interface Tx {
  txId: string;
  type: string;
  detail: string;
  amount: { value: number; display: string; sym: string } | null;
  reward: number;
  fee: number;
  timestamp: number;
  status: 'success' | 'failed';
  result: string;
  hashscanUrl: string;
}

// Semantic palette: green = inflow/profit, red = outflow/failed, primary = brand.
const GREEN = '#10B981';
const RED = '#EF4444';
const PRIMARY = '#00A8E8';

interface HcsEvent {
  type: string;
  detail: string;
  account: string;
  txHash?: string;
  sequenceNumber: number;
  consensusTimestamp: string;
  ts: number;
}

const isProtocol = (type: string) => /p2p|vault|swap|faucet|router|contract/i.test(type);

const fmtTime = (secs: number): string =>
  new Date(secs * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ActivityTab: React.FC<ActivityTabProps> = ({ theme }) => {
  const dark = theme === 'dark';
  const textMain = dark ? 'text-white' : 'text-slate-900';
  const textMuted = dark ? 'text-white/55' : 'text-slate-500';
  const borderColor = dark ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = dark ? 'bg-[#0F141A]' : 'bg-white';
  const rowHover = dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50';
  const neutralChip = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';

  const { isConnected } = useWallet();
  const { address } = useAccount();

  // Paged history: each entry in `pages` is one fetched batch (25 txs) from
  // the Mirror Node's cursor-based pagination. Pages already fetched are kept
  // in memory, so paging Back is instant; paging past the last cached page
  // fetches the next batch using the cursor the API returned alongside it.
  const [pages, setPages] = useState<Tx[][]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) { setPages([]); setPageIndex(0); setNextCursor(null); setAccountId(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/activity/${address}`);
      const data = await res.json();
      setPages([data.transactions || []]);
      setPageIndex(0);
      setNextCursor(data.next || null);
      setAccountId(data.accountId || null);
    } catch (e) {
      console.error('[Activity] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  // Protocol event log — real HCS (Hedera Consensus Service) topic messages,
  // written whenever a Vault/P2P/Governance transaction confirms. Read back
  // through the Mirror Node, independent of any single API being up.
  const [hcsEvents, setHcsEvents] = useState<HcsEvent[]>([]);
  const [hcsTopicId, setHcsTopicId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const loadHcs = () => fetch('/api/hcs/log?limit=15')
      .then((r) => r.json())
      .then((d) => { if (alive) { setHcsEvents(d.events || []); setHcsTopicId(d.topicId || null); } })
      .catch(() => {});
    loadHcs();
    const t = setInterval(loadHcs, 20_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const isLastCachedPage = pageIndex === pages.length - 1;
  const canGoNext = !isLastCachedPage || !!nextCursor;
  const canGoPrev = pageIndex > 0;

  const goNext = async () => {
    if (!address || !canGoNext) return;
    if (!isLastCachedPage) { setPageIndex((i) => i + 1); return; }
    setPageLoading(true);
    try {
      const res = await fetch(`/api/activity/${address}?before=${encodeURIComponent(nextCursor!)}`);
      const data = await res.json();
      setPages((prev) => [...prev, data.transactions || []]);
      setNextCursor(data.next || null);
      setPageIndex((i) => i + 1);
    } catch (e) {
      console.error('[Activity] next page failed:', e);
    } finally {
      setPageLoading(false);
    }
  };

  const goPrev = () => { if (canGoPrev) setPageIndex((i) => i - 1); };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const txs = pages[pageIndex] || [];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? txs.filter((t) => t.txId.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q) || (t.amount?.sym.toLowerCase().includes(q)))
    : txs;
  const totalCode = pages.flat().reduce((s, t) => s + (t.reward || 0), 0);
  const totalLoadedTxs = pages.reduce((s, p) => s + p.length, 0);

  const cols = 'grid-cols-1 md:grid-cols-[1.2fr_1fr_1.3fr_1.1fr_0.9fr_1.1fr]';

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

      {/* CODE points banner (real, from Vault / Earn / P2P activity) */}
      {isConnected && (
        <div
          className="w-full rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
          style={{ background: `${PRIMARY}0F`, borderColor: `${PRIMARY}33` }}
        >
          <div className="flex items-center gap-3">
            <Sparkle weight="fill" size={20} style={{ color: PRIMARY }} className="shrink-0" />
            <span className="text-[13px] font-medium" style={{ color: PRIMARY }}>
              Earn CODE points for Vault, Earn & P2P activity — the more value you move, the more you earn (min 5 per action).
            </span>
          </div>
          <div className={`text-[14px] font-medium shrink-0 ${textMain}`}>
            CODE Earned: <span className="font-bold text-[16px]" style={{ color: PRIMARY }}>{totalCode.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] shadow-sm overflow-hidden mb-8`}>
        {/* Column header */}
        {isConnected && filtered.length > 0 && (
          <div className={`hidden md:grid ${cols} gap-4 px-6 py-3.5 border-b ${borderColor} text-[12px] font-semibold uppercase tracking-wide ${textMuted}`}>
            <div>Date / Time</div>
            <div>Type</div>
            <div>Asset / Strategy</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Reward</div>
            <div className="text-right">Status</div>
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
            <span className="text-[14px] font-medium">{totalLoadedTxs === 0 ? 'No transactions found for this wallet yet.' : 'No transactions match your search.'}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => {
              const open = expanded === t.txId;
              const inflow = !!t.amount && t.amount.value >= 0;
              const amtColor = !t.amount ? textMuted : inflow ? GREEN : RED;
              const Arrow = inflow ? ArrowDownLeft : ArrowUpRight;
              const protocol = isProtocol(t.type);
              return (
                <div key={t.txId} className={`border-b ${borderColor} last:border-b-0`}>
                  <div
                    className={`grid ${cols} gap-2 md:gap-4 px-6 py-4 items-center ${rowHover} transition-colors text-[14px] cursor-pointer`}
                    onClick={() => setExpanded(open ? null : t.txId)}
                  >
                    {/* Date / Time */}
                    <div className={`${textMuted} text-[13px] order-1`}>{fmtTime(t.timestamp)}</div>

                    {/* Type */}
                    <div className="order-2">
                      <span
                        className="inline-flex text-[12px] font-bold px-2.5 py-1 rounded-md leading-tight"
                        style={protocol ? { background: `${PRIMARY}18`, color: PRIMARY } : { background: neutralChip, color: dark ? 'rgba(255,255,255,0.75)' : '#475569' }}
                      >
                        {t.type}
                      </span>
                    </div>

                    {/* Asset / Strategy */}
                    <div className="order-3 font-medium truncate">{t.detail}</div>

                    {/* Amount */}
                    <div className="order-4 md:justify-end font-bold tabular-nums flex items-center gap-1" style={{ color: amtColor }}>
                      {t.amount ? (
                        <>
                          <Arrow size={13} weight="bold" className="shrink-0" />
                          <span>{t.amount.display} <span className="font-semibold">{t.amount.sym}</span></span>
                        </>
                      ) : <span className={textMuted}>—</span>}
                    </div>

                    {/* Reward */}
                    <div className="order-5 md:text-right font-bold tabular-nums">
                      {t.reward > 0 ? <span style={{ color: PRIMARY }}>+{t.reward} CODE</span> : <span className={textMuted}>—</span>}
                    </div>

                    {/* Status */}
                    <div className="order-6 flex items-center justify-between md:justify-end gap-2">
                      {t.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold" style={{ background: `${GREEN}1A`, color: GREEN }}>Success <Check size={12} weight="bold" /></span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold" style={{ background: `${RED}1A`, color: RED }}>Failed <X size={12} weight="bold" /></span>
                      )}
                      <CaretDown size={15} className={`hidden md:block ${textMuted} transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {open && (
                    <div className={`mx-3 md:mx-6 mb-4 p-4 rounded-xl border ${borderColor} ${dark ? 'bg-[#0b0e14]' : 'bg-[#F8FAFC]'}`}>
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
                          {t.reward > 0 && (
                            <div className="flex items-center gap-4">
                              <span className={`${textMuted} shrink-0 w-[100px]`}>CODE Earned</span>
                              <span className="font-bold" style={{ color: PRIMARY }}>+{t.reward} CODE</span>
                            </div>
                          )}
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
                          className={`${CTA_BLUE} shrink-0 flex items-center gap-2 px-4 py-2.5 text-[13px]`}
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

      {/* Pagination */}
      {isConnected && !loading && totalLoadedTxs > 0 && (canGoPrev || canGoNext) && (
        <div className="w-full flex items-center justify-center gap-3 pb-8 -mt-2">
          <button
            onClick={goPrev}
            disabled={!canGoPrev || pageLoading}
            title="Previous page"
            className={`flex items-center justify-center w-9 h-9 rounded-lg border ${borderColor} ${cardBg} ${rowHover} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{ color: PRIMARY }}
          >
            <CaretLeft size={15} weight="bold" />
          </button>
          <span className={`text-[13px] font-semibold tabular-nums ${textMuted} min-w-[64px] text-center`}>
            {pageLoading ? <CircleNotch size={14} weight="bold" className="animate-spin inline" /> : `${pageIndex + 1} / ${pages.length}${nextCursor ? '+' : ''}`}
          </span>
          <button
            onClick={goNext}
            disabled={!canGoNext || pageLoading}
            title="Next page"
            className={`flex items-center justify-center w-9 h-9 rounded-lg border ${borderColor} ${cardBg} ${rowHover} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{ color: PRIMARY }}
          >
            <CaretRight size={15} weight="bold" />
          </button>
        </div>
      )}

      {/* Protocol Event Log — real Hedera Consensus Service (HCS) messages */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] shadow-sm overflow-hidden mb-8`}>
        <div className="px-6 py-4 border-b border-transparent flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Broadcast size={18} weight="fill" style={{ color: PRIMARY }} />
            <div>
              <h2 className={`text-[15px] font-bold ${textMain}`}>Protocol Event Log</h2>
              <p className={`text-[12px] ${textMuted}`}>Real HCS topic messages — Vault, P2P & governance actions, independently verifiable on Mirror Node.</p>
            </div>
          </div>
          {hcsTopicId && (
            <a
              href={`https://hashscan.io/testnet/topic/${hcsTopicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[12px] font-semibold ${rowHover} border ${borderColor} rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors`}
              style={{ color: PRIMARY }}
            >
              Topic {hcsTopicId} <ArrowSquareOut size={13} weight="bold" />
            </a>
          )}
        </div>

        {!hcsTopicId ? (
          <div className={`px-6 py-8 text-center text-[13px] ${textMuted}`}>HCS topic not yet configured.</div>
        ) : hcsEvents.length === 0 ? (
          <div className={`px-6 py-8 text-center text-[13px] ${textMuted}`}>No protocol events logged yet — they'll appear here the moment a Vault, P2P, or governance transaction confirms.</div>
        ) : (
          <div className="flex flex-col">
            {hcsEvents.map((e) => (
              <div key={e.sequenceNumber} className={`flex items-center justify-between gap-4 px-6 py-3.5 border-b ${borderColor} last:border-b-0 ${rowHover} transition-colors text-[13px]`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex shrink-0 text-[11px] font-bold px-2 py-1 rounded-md" style={{ background: `${PRIMARY}18`, color: PRIMARY }}>{e.type}</span>
                  <span className={`truncate ${textMain}`}>{e.detail}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[12px] ${textMuted}`}>{fmtTime(Math.floor(Number(e.consensusTimestamp)))}</span>
                  {e.txHash && (
                    <a
                      href={`https://hashscan.io/testnet/transaction/${e.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      style={{ color: PRIMARY }}
                      title="View transaction"
                    >
                      <ArrowSquareOut size={14} weight="bold" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

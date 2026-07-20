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

const typeColor = (type: string, dark: boolean): string => {
  const t = type.toLowerCase();
  if (t.includes('p2p')) return dark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600';
  if (t.includes('vault') || t.includes('yield')) return dark ? 'bg-[#00A8E8]/10 text-[#00A8E8]' : 'bg-[#e0f4fc] text-[#00A8E8]';
  if (t.includes('swap') || t.includes('router')) return dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600';
  if (t.includes('faucet') || t.includes('mint')) return dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700';
  if (t.includes('approve') || t.includes('associate')) return dark ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-100 text-slate-600';
  return dark ? 'bg-white/5 text-white/70' : 'bg-slate-100 text-slate-600';
};

const fmtTime = (secs: number): string =>
  new Date(secs * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ActivityTab: React.FC<ActivityTabProps> = ({ theme }) => {
  const dark = theme === 'dark';
  const textMain = dark ? 'text-white' : 'text-slate-900';
  const textMuted = dark ? 'text-white/60' : 'text-slate-500';
  const borderColor = dark ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = dark ? 'bg-[#0F141A]' : 'bg-white';

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

  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-6 ${textMain} px-4 font-['Inter']`}>
      {/* Header */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">Activity</h1>
          {accountId && (
            <span className={`text-[13px] font-medium ${textMuted} mt-1 inline-block`}>
              On-chain history for <span className="text-[#00A8E8] font-semibold">{accountId}</span>
            </span>
          )}
        </div>
        {isConnected && (
          <button onClick={load} disabled={loading} className={`self-start sm:self-auto flex items-center gap-2 ${cardBg} border ${borderColor} rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60`}>
            {loading ? <CircleNotch size={14} weight="bold" className="animate-spin" /> : null} Refresh
          </button>
        )}
      </div>

      {/* Search */}
      {isConnected && (
        <div className="w-full flex flex-wrap items-center justify-end gap-3 text-[13px] font-medium">
          <div className={`relative flex items-center ${cardBg} border ${borderColor} rounded-lg px-3 py-2.5 w-full sm:w-[280px]`}>
            <MagnifyingGlass className={`${textMuted} mr-2 shrink-0`} size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Tx ID, type, or token…"
              className={`bg-transparent outline-none border-none w-full placeholder:text-slate-400 ${textMain}`}
            />
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm overflow-hidden mb-8`}>
        {/* Table Header */}
        <div className={`hidden md:grid grid-cols-[1.4fr_1.2fr_1.4fr_1.2fr_1.2fr] gap-4 px-6 py-4 border-b ${borderColor} text-[13px] font-semibold ${textMuted}`}>
          <div>Date / Time</div>
          <div>Type</div>
          <div>Detail</div>
          <div>Amount</div>
          <div>Status</div>
        </div>

        {/* States */}
        {!isConnected ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-16 ${textMuted}`}>
            <Wallet size={30} weight="light" />
            <span className="text-[14px] font-medium">Connect your wallet to see your transaction history.</span>
          </div>
        ) : loading ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-16 ${textMuted}`}>
            <CircleNotch size={26} weight="bold" className="animate-spin" />
            <span className="text-[14px] font-medium">Loading on-chain activity…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center gap-2 py-16 ${textMuted}`}>
            <span className="text-[14px] font-medium">{txs.length === 0 ? 'No transactions found for this wallet yet.' : 'No transactions match your search.'}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => {
              const open = expanded === t.txId;
              const amtColor = !t.amount ? textMuted : t.amount.value >= 0 ? 'text-[#16C784]' : textMain;
              return (
                <div key={t.txId} className={`border-b ${borderColor} last:border-b-0`}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-[1.4fr_1.2fr_1.4fr_1.2fr_1.2fr] gap-2 md:gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[14px] cursor-pointer"
                    onClick={() => setExpanded(open ? null : t.txId)}
                  >
                    <div className={textMuted}>{fmtTime(t.timestamp)}</div>
                    <div>
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${typeColor(t.type, dark)}`}>{t.type}</span>
                    </div>
                    <div className="font-medium truncate">{t.detail}</div>
                    <div className={`font-semibold tabular-nums ${amtColor}`}>{t.amount ? `${t.amount.display} ${t.amount.sym}` : '—'}</div>
                    <div className="flex items-center justify-between">
                      {t.status === 'success' ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${dark ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>Success <Check size={12} weight="bold" /></span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${dark ? 'bg-[#EA3943]/10 text-[#EA3943]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>Failed <X size={12} weight="bold" /></span>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div className={`mx-3 md:mx-6 mb-4 p-4 rounded-xl border ${borderColor} ${dark ? 'bg-[#0b0e14]' : 'bg-[#F8FAFC]'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-3 text-[13px] min-w-0">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className={`${textMuted} shrink-0`}>Transaction ID:</span>
                            <div className="flex items-center gap-2 font-medium min-w-0">
                              <span className="truncate">{t.txId}</span>
                              <button onClick={(e) => { e.stopPropagation(); copy(t.txId); }} className="shrink-0">
                                {copied === t.txId ? <Check size={14} className="text-[#16C784]" /> : <CopySimple size={14} className={`${textMuted} cursor-pointer hover:text-[#00A8E8]`} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`${textMuted} shrink-0`}>Network Fee:</span>
                            <span className="font-medium tabular-nums">{t.fee > 0 ? `${t.fee.toFixed(6)} HBAR` : '—'}</span>
                          </div>
                          {t.result !== 'SUCCESS' && (
                            <div className="flex items-center gap-4">
                              <span className={`${textMuted} shrink-0`}>Result:</span>
                              <span className="font-medium text-[#EA3943]">{t.result}</span>
                            </div>
                          )}
                        </div>
                        <a
                          href={t.hashscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-2 px-4 py-2 border border-[#00A8E8] rounded-lg text-[#00A8E8] text-[13px] font-bold hover:bg-[#00A8E8]/5 transition-colors"
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
        <div className="w-full flex items-center justify-center pb-8">
          <button onClick={loadMore} disabled={loadingMore} className={`flex items-center gap-2 ${cardBg} border ${borderColor} rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60`}>
            {loadingMore ? <><CircleNotch size={14} weight="bold" className="animate-spin" /> Loading…</> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

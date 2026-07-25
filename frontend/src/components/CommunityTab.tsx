"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import { friendlyTxError } from '../lib/txErrors';
import { CircleNotch, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { CTA_BLUE, CTA_GREEN, CTA_RED } from '../lib/ui';
import {
  fetchGovernance, fetchVoter, claimCode, proposeGov, castVoteGov, type Proposal,
} from '../lib/governance';
import { logHcsEvent } from '../lib/hcsClient';

interface CommunityTabProps {
  theme: 'light' | 'dark';
}

const fmtCode = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtLeft = (deadline: number) => {
  const s = deadline - Math.floor(Date.now() / 1000);
  if (s <= 0) return 'Voting ended';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `Ends in ${d}d ${h}h`;
  if (h > 0) return `Ends in ${h}h ${m}m`;
  return `Ends in ${m}m`;
};

export function CommunityTab({ theme }: CommunityTabProps) {
  const { isConnected, address, connect, closeModal } = useWallet();
  const { showToast } = useToast();
  const { data: walletClient } = useWalletClient();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [quorum, setQuorum] = useState(0);
  const [threshold, setThreshold] = useState(1000);
  const [loading, setLoading] = useState(true);

  const [power, setPower] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  const [busy, setBusy] = useState<string | null>(null); // e.g. 'claim' | 'vote-2-true' | 'propose'
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const cardBg = theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-[#EAECEF]';

  const load = useCallback(async () => {
    try {
      const g = await fetchGovernance();
      setProposals(g.proposals || []);
      setQuorum(g.quorumVotes || 0);
      setThreshold(g.proposalThreshold || 1000);
    } catch { /* keep last */ } finally { setLoading(false); }
  }, []);

  const loadVoter = useCallback(async () => {
    if (!isConnected || !address) { setPower(0); setClaimed(false); setVoted({}); return; }
    try {
      const v = await fetchVoter(address);
      setPower(v.power || 0); setClaimed(!!v.claimed); setVoted(v.voted || {});
    } catch { /* ignore */ }
  }, [isConnected, address]);

  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  useEffect(() => { loadVoter(); }, [loadVoter]);

  const active = proposals.filter((p) => p.state === 'Active');
  const decided = proposals.filter((p) => p.state !== 'Active');

  const doClaim = async () => {
    if (!isConnected || !walletClient) { connect(); return; }
    setBusy('claim');
    try {
      const txHash = await claimCode(walletClient);
      if (address) logHcsEvent({ type: 'Governance Claim', detail: 'Claimed CODE voting power', account: address, txHash });
      await Promise.all([load(), loadVoter()]);
    }
    catch (e: any) { showToast('Claim failed: ' + friendlyTxError(e), { type: 'error' }); }
    finally { setBusy(null); closeModal(); }
  };

  const doVote = async (id: number, support: boolean) => {
    if (!isConnected || !walletClient) { connect(); return; }
    if (power <= 0) { showToast('Claim CODE first to get voting power.', { type: 'warning' }); return; }
    setBusy(`vote-${id}-${support}`);
    try {
      const txHash = await castVoteGov(walletClient, id, support);
      if (address) logHcsEvent({ type: 'Governance Vote', detail: `Voted ${support ? 'For' : 'Against'} proposal #${id}`, account: address, txHash });
      await Promise.all([load(), loadVoter()]);
    }
    catch (e: any) { showToast('Vote failed: ' + friendlyTxError(e), { type: 'error' }); }
    finally { setBusy(null); closeModal(); }
  };

  const doPropose = async () => {
    if (!isConnected || !walletClient) { connect(); return; }
    if (!title.trim()) { showToast('Enter a proposal title.', { type: 'warning' }); return; }
    if (power < threshold) { showToast(`You need at least ${fmtCode(threshold)} CODE to propose.`, { type: 'warning' }); return; }
    setBusy('propose');
    try {
      const txHash = await proposeGov(walletClient, title.trim(), desc.trim());
      if (address) logHcsEvent({ type: 'Governance Proposal', detail: `Proposed: ${title.trim()}`, account: address, txHash });
      setTitle(''); setDesc(''); await load();
    }
    catch (e: any) { showToast('Proposal failed: ' + friendlyTxError(e), { type: 'error' }); }
    finally { setBusy(null); closeModal(); }
  };

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* 1. TOP HERO */}
      <div className={`w-full flex flex-col md:flex-row rounded-[16px] border mb-6 overflow-hidden ${cardBg}`}>
        <div className={`flex-1 p-8 relative flex flex-col justify-center ${theme === 'dark' ? 'bg-gradient-to-r from-[#00A8E8]/10 to-transparent' : 'bg-gradient-to-r from-[#00A8E8]/[0.05] to-transparent'}`}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, #00A8E8 0%, transparent 40%), radial-gradient(circle at 100% 100%, #00A8E8 0%, transparent 40%)' }} />
          <div className="relative z-10 flex flex-col items-start">
            <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">Community Governance</h2>
            <p className="text-[14px] text-slate-600 dark:text-white/70 max-w-[440px] leading-relaxed">
              Shape the protocol. Hold <span className="font-bold text-[#00A8E8]">CODE</span> to open proposals and cast weighted votes on yield emissions, new vault assets, and platform upgrades — every tally settles on-chain.
            </p>
          </div>
        </div>

        <div className={`w-px hidden md:block ${theme === 'dark' ? 'bg-white/5' : 'bg-[#EAECEF]'}`} />

        <div className={`w-full md:w-[340px] p-8 flex flex-col justify-center items-start relative ${theme === 'dark' ? 'bg-gradient-to-l from-[#00A8E8]/5 to-transparent' : 'bg-gradient-to-l from-[#00A8E8]/[0.02] to-transparent'}`}>
          <div className="text-[14px] font-semibold text-slate-600 dark:text-white/60 mb-1">Your Voting Power</div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-[40px] font-bold text-[#00A8E8] leading-none tracking-tight tabular-nums">{isConnected ? fmtCode(power) : '—'}</span>
            <span className="text-[20px] font-bold text-[#00A8E8]">CODE</span>
          </div>
          {!isConnected ? (
            <button onClick={() => connect()} className={`${CTA_BLUE} px-6 py-2.5 text-[14px] shadow-sm`}>Connect wallet</button>
          ) : power <= 0 && !claimed ? (
            <button onClick={doClaim} disabled={busy === 'claim'} className={`${CTA_BLUE} px-6 py-2.5 text-[14px] shadow-sm flex items-center gap-2`}>
              {busy === 'claim' ? <CircleNotch size={15} weight="bold" className="animate-spin" /> : <Sparkle size={15} weight="fill" />}
              Claim CODE to vote
            </button>
          ) : (
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">
              {power >= threshold ? 'You can open proposals & vote.' : `Hold ≥ ${fmtCode(threshold)} CODE to propose.`}
            </span>
          )}
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

        {/* LEFT: Active proposals */}
        <div className="flex flex-col gap-6">
          <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mt-2">Active Governance Proposals</h3>

          {loading && (
            <div className={`flex items-center justify-center gap-2 py-16 rounded-[16px] border ${cardBg} text-slate-500 dark:text-white/50 text-[14px]`}>
              <CircleNotch size={18} weight="bold" className="animate-spin" /> Loading proposals…
            </div>
          )}

          {!loading && active.length === 0 && (
            <div className={`py-16 text-center rounded-[16px] border ${cardBg} text-slate-500 dark:text-white/50 text-[14px]`}>
              No active proposals right now. Be the first to submit one.
            </div>
          )}

          {active.map((p) => {
            const total = p.forVotes + p.againstVotes;
            const yesPct = total > 0 ? (p.forVotes / total) * 100 : 0;
            const noPct = total > 0 ? 100 - yesPct : 0;
            const quorumPct = quorum > 0 ? Math.min(100, (total / quorum) * 100) : 0;
            const didVote = voted[p.id];
            return (
              <div key={p.id} className={`flex flex-col p-6 rounded-[16px] border shadow-sm ${cardBg}`}>
                <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">{p.title}</h4>
                {p.description && <p className="text-[13px] text-slate-600 dark:text-white/60 mb-3 leading-relaxed">{p.description}</p>}
                <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-white/50 mb-5">
                  <span>{fmtLeft(p.deadline)}</span><span>•</span>
                  <span>Quorum {quorumPct.toFixed(0)}% of {fmtCode(quorum)} CODE</span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-[14px] mb-3">
                  <span className="text-[#10B981]">{yesPct.toFixed(0)}% Yes</span>
                  <span className="text-slate-300 dark:text-white/20">/</span>
                  <span className="text-[#EF4444]">{noPct.toFixed(0)}% No</span>
                  <span className="text-slate-400 dark:text-white/30 font-medium ml-2">{fmtCode(total)} CODE voted</span>
                </div>
                <div className="flex gap-1 h-2 w-full mb-5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-[#10B981]" style={{ width: `${yesPct}%` }} />
                  <div className="bg-[#EF4444]" style={{ width: `${noPct}%` }} />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {didVote ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#10B981]"><CheckCircle size={16} weight="fill" /> You voted</span>
                  ) : (
                    <>
                      <button onClick={() => doVote(p.id, false)} disabled={!!busy} className={`${CTA_RED} px-5 py-2.5 text-[13px] shadow-sm flex items-center gap-1.5`}>
                        {busy === `vote-${p.id}-false` ? <CircleNotch size={14} weight="bold" className="animate-spin" /> : null} Vote No
                      </button>
                      <button onClick={() => doVote(p.id, true)} disabled={!!busy} className={`${CTA_GREEN} px-5 py-2.5 text-[13px] shadow-sm flex items-center gap-1.5`}>
                        {busy === `vote-${p.id}-true` ? <CircleNotch size={14} weight="bold" className="animate-spin" /> : null} Vote Yes
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Submit + Recent */}
        <div className="flex flex-col gap-6 mt-2">
          <div className={`flex flex-col p-6 rounded-[16px] border shadow-sm ${cardBg}`}>
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-5">Submit a Proposal</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600 dark:text-white/70">Proposal Title</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                  placeholder="Enter a short, clear title"
                  className={`w-full px-4 py-2.5 rounded-[8px] border text-[13px] outline-none transition-colors ${theme === 'dark' ? 'bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-[#00A8E8]' : 'bg-transparent border-[#EAECEF] text-slate-900 placeholder:text-slate-400 focus:border-[#00A8E8]'}`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600 dark:text-white/70">Describe your Proposal</label>
                <textarea
                  rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={4000}
                  placeholder="Provide details, rationale, and the expected impact of your proposal…"
                  className={`w-full px-4 py-3 rounded-[8px] border text-[13px] outline-none transition-colors resize-none ${theme === 'dark' ? 'bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-[#00A8E8]' : 'bg-transparent border-[#EAECEF] text-slate-900 placeholder:text-slate-400 focus:border-[#00A8E8]'}`}
                />
              </div>
              <button onClick={doPropose} disabled={busy === 'propose'} className={`${CTA_BLUE} w-full py-3 mt-1 text-[14px] shadow-sm flex items-center justify-center gap-2`}>
                {busy === 'propose' ? <><CircleNotch size={15} weight="bold" className="animate-spin" /> Submitting…</> : 'Submit Proposal'}
              </button>
              <span className="text-[11px] font-medium text-slate-400 dark:text-white/40 text-center">
                Requires ≥ {fmtCode(threshold)} CODE. Opens a 3-day on-chain vote.
              </span>
            </div>
          </div>

          <div className={`flex flex-col p-6 rounded-[16px] border shadow-sm ${cardBg}`}>
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-5">Recent Decisions</h3>
            <div className="flex flex-col gap-0">
              {decided.length === 0 && (
                <span className="text-[13px] text-slate-500 dark:text-white/50 py-4">No finalized decisions yet.</span>
              )}
              {decided.slice(0, 6).map((p) => (
                <div key={p.id} className={`flex justify-between items-center py-4 border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80 pr-4 leading-tight">{p.title}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${p.passed ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                    {p.passed ? 'Passed' : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

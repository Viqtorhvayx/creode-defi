"use client";

// Paper Carry — log an intended funding-carry position, then score it against
// live rates and watch where each leg would be liquidated.
//
// Two jobs, and the second is the more important one:
//
//   1. PAPER LOG. The 30-day study in research/funding-spreads/ says what the
//      carry was. It cannot say what you would have captured. This records an
//      intended position with your own cost assumptions and accrues the real
//      spread against it, so after a month there is a record of what the idea
//      earned rather than what the backtest promised.
//
//   2. LIQUIDATION DISTANCE. Delta is hedged; margin is not. When price moves,
//      one leg is always losing, and the winning leg's profit sits on a
//      different venue where it cannot help. Most delta-neutral blowups are
//      margin management, not trade selection.
//
// Nothing here places an order. It is a notebook with arithmetic attached.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Warning, Trash, Plus } from '@phosphor-icons/react';
import {
  VENUES, VENUE_BY_ID, ANNUALISE, fetchFunding, type LiveFunding,
} from '../lib/fundingSpread';
import {
  loadPositions, savePositions, newPosition, accrue, pnl, legRisk, fetchMargin,
  MAX_ACCRUAL_GAP_MS, type CarryPosition, type Asset, type MarginResponse,
} from '../lib/paperCarry';

interface PaperCarryTabProps { theme?: 'light' | 'dark'; }

const ASSETS: Asset[] = ['BTC', 'ETH', 'SOL'];
const POLL_MS = 20000;

const fmtUsd = (v: number): string =>
  `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtPct = (v: number, dp = 2): string => `${v >= 0 ? '' : '−'}${Math.abs(v).toFixed(dp)}%`;

/** Accrual over a few minutes is a tiny fraction of a basis point, and fixing
 *  the display at 2dp makes a working accrual look frozen at 0.00. Scale the
 *  precision to the magnitude so early progress is visible. */
const fmtBp = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 10) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  if (a >= 0.01) return v.toFixed(3);
  return v.toFixed(5);
};

/** Held time in whatever unit is actually legible. */
const fmtHeld = (days: number): string => {
  if (days >= 1) return `${days.toFixed(2)}d`;
  const h = days * 24;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.max(0, h * 60).toFixed(0)}m`;
};

export const PaperCarryTab: React.FC<PaperCarryTabProps> = ({ theme = 'light' }) => {
  const [positions, setPositions] = useState<CarryPosition[]>([]);
  const [live, setLive] = useState<Record<Asset, LiveFunding | null>>({ BTC: null, ETH: null, SOL: null });
  const [margin, setMargin] = useState<Record<Asset, MarginResponse | null>>({ BTC: null, ETH: null, SOL: null });
  const [showForm, setShowForm] = useState(false);
  const [storageOk, setStorageOk] = useState(true);

  // form state
  const [fAsset, setFAsset] = useState<Asset>('BTC');
  const [fShort, setFShort] = useState('hyperliquid');
  const [fLong, setFLong] = useState('dydx');
  const [fNotional, setFNotional] = useState('10000');
  const [fCollateral, setFCollateral] = useState('2000');
  const [fEntryBp, setFEntryBp] = useState('10');
  const [fExitBp, setFExitBp] = useState('10');

  const loadedRef = useRef(false);

  useEffect(() => {
    const ps = loadPositions();
    setPositions(ps);
    loadedRef.current = true;
    try {
      localStorage.setItem('creode.storagecheck', '1');
      localStorage.removeItem('creode.storagecheck');
    } catch { setStorageOk(false); }
  }, []);

  // live funding + margin for every asset we hold a position in, plus the one
  // selected in the form so the preview is real
  const neededAssets = useMemo(() => {
    const s = new Set<Asset>([fAsset]);
    for (const p of positions) if (!p.closedAt) s.add(p.asset);
    return [...s];
  }, [positions, fAsset]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      for (const a of neededAssets) {
        const [f, m] = await Promise.all([fetchFunding(a), fetchMargin(a)]);
        if (!alive) return;
        if (f) setLive((prev) => ({ ...prev, [a]: f }));
        if (m) setMargin((prev) => ({ ...prev, [a]: m }));
      }
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [neededAssets.join(',')]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** The live spread for a position, as an hourly fraction. */
  const spreadOf = useCallback((p: CarryPosition): number | null => {
    const f = live[p.asset];
    if (!f) return null;
    const s = f.venues[p.shortVenue], l = f.venues[p.longVenue];
    if (s == null || l == null) return null;
    return s - l;
  }, [live]);

  // accrue on every poll
  useEffect(() => {
    if (!loadedRef.current) return;
    setPositions((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const a = accrue(p, spreadOf(p));
        if (a !== p) changed = true;
        return a;
      });
      if (changed) savePositions(next);
      return changed ? next : prev;
    });
  }, [live, spreadOf]);

  const addPosition = () => {
    const n = Number(fNotional), c = Number(fCollateral);
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(c) || c <= 0) return;
    if (fShort === fLong) return;
    const p = newPosition({
      asset: fAsset, shortVenue: fShort, longVenue: fLong,
      notionalUsd: n, collateralUsd: c,
      openedAt: Date.now(),
      entryCostBp: Number(fEntryBp) || 0,
      exitCostBp: Number(fExitBp) || 0,
      entryPrice: null,
    });
    const next = [p, ...positions];
    setPositions(next); savePositions(next);
    setShowForm(false);
  };

  const closePosition = (id: string) => {
    const next = positions.map((p) => (p.id === id ? { ...p, closedAt: Date.now() } : p));
    setPositions(next); savePositions(next);
  };
  const removePosition = (id: string) => {
    const next = positions.filter((p) => p.id !== id);
    setPositions(next); savePositions(next);
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtle = isDark ? 'text-white/50' : 'text-slate-500';
  const line = isDark ? 'border-white/5' : 'border-black/5';
  const input = `px-3 py-2 rounded-[10px] text-[13px] border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-black/10'} text-foreground w-full`;

  const open = positions.filter((p) => !p.closedAt);
  const closed = positions.filter((p) => p.closedAt);

  // live preview of the pair chosen in the form
  const previewSpread = useMemo(() => {
    const f = live[fAsset];
    if (!f) return null;
    const s = f.venues[fShort], l = f.venues[fLong];
    if (s == null || l == null) return null;
    return (s - l) * ANNUALISE;
  }, [live, fAsset, fShort, fLong]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-foreground">Paper Carry</h2>
          <p className={`text-[13px] mt-1 ${subtle}`}>
            Log an intended funding-carry position, accrue the real spread against it, and watch where each leg
            would be liquidated. Nothing here places an order.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] font-bold text-[13px] bg-[#00A8E8] text-white"
        >
          <Plus size={14} weight="bold" /> New paper position
        </button>
      </div>

      {!storageOk && (
        <div className={`rounded-[12px] border p-3 text-[12px] ${cardBg} text-[#F0B90B]`}>
          Browser storage is unavailable here, so positions will vanish on reload. A private window or blocked site
          data will do this.
        </div>
      )}

      {showForm && (
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>asset</span>
              <select className={input} value={fAsset} onChange={(e) => setFAsset(e.target.value as Asset)}>
                {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>short (receive)</span>
              <select className={input} value={fShort} onChange={(e) => setFShort(e.target.value)}>
                {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>long (pay)</span>
              <select className={input} value={fLong} onChange={(e) => setFLong(e.target.value)}>
                {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>notional per leg $</span>
              <input className={input} value={fNotional} onChange={(e) => setFNotional(e.target.value)} inputMode="decimal" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>collateral per leg $</span>
              <input className={input} value={fCollateral} onChange={(e) => setFCollateral(e.target.value)} inputMode="decimal" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>entry cost bp</span>
              <input className={input} value={fEntryBp} onChange={(e) => setFEntryBp(e.target.value)} inputMode="decimal" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase ${subtle}`}>exit cost bp</span>
              <input className={input} value={fExitBp} onChange={(e) => setFExitBp(e.target.value)} inputMode="decimal" />
            </label>
            <div className="flex flex-col gap-1 justify-end">
              <button onClick={addPosition} className="px-4 py-2 rounded-[10px] font-bold text-[13px] bg-[#00A8E8] text-white">
                Log it
              </button>
            </div>
          </div>
          <div className={`text-[12px] mt-3 ${subtle}`}>
            {fShort === fLong ? (
              <span className="text-[#F6465D]">Both legs are the same venue — that is not a carry, it is nothing.</span>
            ) : previewSpread != null ? (
              <>carry on this pair right now: <span className={`font-bold ${previewSpread >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>{fmtPct(previewSpread)}/yr</span>
                {previewSpread < 0 && <span className="text-[#F6465D]"> — this pair is the wrong way round at the moment</span>}</>
            ) : 'fetching live rates…'}
          </div>
        </div>
      )}

      {/* open positions */}
      {open.length === 0 && !showForm && (
        <div className={`rounded-[16px] border p-8 text-center ${cardBg} ${subtle} text-[13px]`}>
          No paper positions yet. Log one from a pair in the Funding tab and leave it running for a few weeks.
        </div>
      )}

      {open.map((p) => {
        const P = pnl(p);
        const f = live[p.asset];
        const mg = margin[p.asset];
        const spread = spreadOf(p);
        const risks = legRisk(
          p, null,
          mg?.venues?.[p.shortVenue]?.mmf ?? null,
          mg?.venues?.[p.longVenue]?.mmf ?? null,
        );
        const nearer = risks.reduce((a, b) => (a.moveToLiq <= b.moveToLiq ? a : b));
        const liqDanger = nearer.moveToLiq < 0.03;
        return (
          <div key={p.id} className={`rounded-[16px] border p-5 ${cardBg}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-[15px] font-bold text-foreground">
                  {p.asset} · short {VENUE_BY_ID[p.shortVenue]?.name ?? p.shortVenue} / long {VENUE_BY_ID[p.longVenue]?.name ?? p.longVenue}
                </div>
                <div className={`text-[11px] mt-1 ${subtle}`}>
                  {fmtUsd(p.notionalUsd)} per leg · {fmtUsd(p.collateralUsd)} collateral each ·
                  held {fmtHeld(P.daysHeld)}
                  {p.unobservedMs > 0 && (
                    <span className="text-[#F0B90B]"> · {(p.unobservedMs / 3_600_000).toFixed(1)}h unobserved</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => closePosition(p.id)} className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold border ${line} text-foreground`}>Close</button>
                <button onClick={() => removePosition(p.id)} className={`px-2 py-1.5 rounded-[8px] text-[12px] border ${line} ${subtle}`} aria-label="delete"><Trash size={14} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <div className={`text-[11px] font-bold uppercase ${subtle}`}>carry now</div>
                <div className={`text-[18px] font-bold tabular-nums ${spread != null && spread >= 0 ? 'text-foreground' : 'text-[#F6465D]'}`}>
                  {spread != null ? fmtPct(spread * ANNUALISE) + '/yr' : '—'}
                </div>
              </div>
              <div>
                <div className={`text-[11px] font-bold uppercase ${subtle}`}>accrued</div>
                <div className="text-[18px] font-bold text-foreground tabular-nums">{fmtBp(P.accruedBp)}bp</div>
                <div className={`text-[11px] ${subtle}`}>{fmtUsd((P.accruedBp / 1e4) * p.notionalUsd)}</div>
              </div>
              <div>
                <div className={`text-[11px] font-bold uppercase ${subtle}`}>net of costs</div>
                <div className={`text-[18px] font-bold tabular-nums ${P.netBp >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {fmtUsd(P.netUsd)}
                </div>
                <div className={`text-[11px] ${subtle}`}>{P.costBp.toFixed(0)}bp round trip</div>
              </div>
              <div>
                <div className={`text-[11px] font-bold uppercase ${subtle}`}>break-even</div>
                <div className="text-[18px] font-bold text-foreground tabular-nums">{(Math.min(P.breakevenPct, 1) * 100).toFixed(0)}%</div>
                <div className={`text-[11px] ${subtle}`}>
                  {P.netBp >= 0 ? 'covered' : P.daysToBreakeven != null ? `~${P.daysToBreakeven.toFixed(1)}d to go` : 'not accruing'}
                </div>
              </div>
            </div>

            <div className={`mt-4 pt-4 border-t ${line}`}>
              <div className={`text-[11px] font-bold uppercase ${subtle} mb-2`}>Liquidation distance</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {risks.map((r) => (
                  <div key={r.venue} className={`rounded-[10px] px-3 py-2 border ${r === nearer && liqDanger ? 'border-[#F6465D]' : line}`}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] font-bold text-foreground">
                        {VENUE_BY_ID[r.venue]?.name ?? r.venue} <span className={`font-normal ${subtle}`}>{r.side}</span>
                      </span>
                      <span className={`text-[13px] font-bold tabular-nums ${r === nearer && liqDanger ? 'text-[#F6465D]' : 'text-foreground'}`}>
                        {r.moveToLiq > 0 ? `${(r.moveToLiq * 100).toFixed(2)}%` : 'under water'}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${subtle}`}>
                      liquidates on a {r.side === 'short' ? 'rise' : 'fall'} of that much · maintenance margin{' '}
                      {(r.mmf * 100).toFixed(2)}%{' '}
                      {r.mmfKnown ? <span className="text-[#0ECB81]">published</span> : <span className="text-[#F0B90B]">assumed</span>}
                    </div>
                  </div>
                ))}
              </div>
              {liqDanger && (
                <div className="text-[11px] mt-2 text-[#F6465D]">
                  The {nearer.side} leg has under 3% of room. A move that size is an ordinary week in crypto.
                </div>
              )}
            </div>

            {f?.missing?.includes(p.shortVenue) || f?.missing?.includes(p.longVenue) ? (
              <div className={`text-[11px] mt-3 ${subtle}`}>
                A leg&apos;s funding feed is unreachable right now, so accrual has paused rather than guessed.
              </div>
            ) : null}
          </div>
        );
      })}

      {/* closed */}
      {closed.length > 0 && (
        <div className={`rounded-[16px] border overflow-hidden ${cardBg}`}>
          <div className={`px-5 py-3 border-b ${line}`}>
            <span className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Closed</span>
          </div>
          <div className="px-5 py-2">
            {closed.map((p) => {
              const P = pnl(p);
              return (
                <div key={p.id} className={`grid grid-cols-12 gap-2 py-2.5 border-t ${line} items-center text-[12px]`}>
                  <div className="col-span-5 text-foreground">
                    {p.asset} · {VENUE_BY_ID[p.shortVenue]?.name ?? p.shortVenue} / {VENUE_BY_ID[p.longVenue]?.name ?? p.longVenue}
                  </div>
                  <div className={`col-span-2 text-right tabular-nums ${subtle}`}>{fmtHeld(P.daysHeld)}</div>
                  <div className={`col-span-2 text-right tabular-nums ${subtle}`}>{fmtBp(P.accruedBp)}bp</div>
                  <div className={`col-span-2 text-right tabular-nums font-bold ${P.netBp >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>{fmtUsd(P.netUsd)}</div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removePosition(p.id)} className={subtle} aria-label="delete"><Trash size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* honesty */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        <div className="flex gap-2 items-start mb-3">
          <Warning size={16} className="text-[#F0B90B] shrink-0 mt-0.5" />
          <span>
            <span className="font-bold text-foreground">Accrual only advances while this tab is open.</span>{' '}
            A gap longer than {(MAX_ACCRUAL_GAP_MS / 60000).toFixed(0)} minutes is recorded as unobserved time rather
            than integrated at a rate nobody watched — so a position left closed overnight will under-report its
            carry, and says so. That is the honest direction to err for a log whose purpose is to check a backtest.
          </span>
        </div>
        <span className="font-bold text-foreground">What the numbers mean.</span>{' '}
        <span className="font-bold text-foreground">Accrued</span>{' '}is the funding spread integrated over the time
        actually observed, in basis points of one leg&apos;s notional.{' '}
        <span className="font-bold text-foreground">Net of costs</span> subtracts the entry and exit costs you
        entered — they are your assumptions, not measured fills, and the measured round trip on the
        Hyperliquid/dYdX pair ran 5.6bp at $10k and 27.3bp at $500k in slippage alone before fees.{' '}
        <span className="font-bold text-foreground">Liquidation distance</span> is
        (collateral − maintenance margin × notional) ÷ notional: the adverse move one leg can absorb before it is
        closed out.
        <br /><br />
        <span className="font-bold text-foreground">Maintenance margin is published for dYdX and Hyperliquid only.</span>{' '}
        dYdX states it outright; Hyperliquid&apos;s is half its initial margin at max leverage. Every other venue
        needs an account or a tier table we cannot read, so those legs fall back to an assumed 0.50% and are
        labelled <span className="text-[#F0B90B]">assumed</span>. Treat an assumed liquidation price as a rough
        guide, not a level to lean on.
        <br /><br />
        <span className="font-bold text-foreground">The winning leg cannot save the losing one.</span> Your profit
        on one venue does nothing for your margin on the other. Both legs need collateral independently, and that
        is the mechanism that ends most delta-neutral positions.
      </div>
    </div>
  );
};

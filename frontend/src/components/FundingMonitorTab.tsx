"use client";

// Funding Monitor — live funding across 13 perp venues, the carry available on
// every pair right now, and how that compares to the 30-day baseline measured
// in research/funding-spreads/.
//
// The trade this watches: short the venue paying high funding, long the one
// paying low, same asset and size. Price risk cancels, and you collect the
// difference for as long as you hold. It is the one edge in this codebase that
// survived scrutiny — see lib/fundingSpread.ts for why it exists and the
// disclaimer at the bottom of this tab for why it is still not free money.
//
// Two things this UI refuses to do, both learned the hard way:
//   - Quote a rate without its settlement interval. Hourly and 8-hourly venues
//     sit side by side here, and mixing them overstates a spread eightfold.
//     Normalisation happens once, server-side, in /api/market/funding.
//   - Show a carry without its break-even. A 12%/yr spread that needs a
//     two-week hold is a different proposition from one that clears in a day,
//     and the number alone hides that completely.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Warning } from '@phosphor-icons/react';
import {
  VENUES, VENUE_BY_ID, BASELINE, ANNUALISE,
  fetchFunding, buildPairs, pairDepth,
  type Asset, type LiveFunding, type Pair,
} from '../lib/fundingSpread';

interface FundingMonitorTabProps {
  theme?: 'light' | 'dark';
}

const ASSETS: Asset[] = ['BTC', 'ETH', 'SOL'];
const POLL_MS = 20000;          // funding moves on the hour; polling harder is noise
const COST_CHOICES = [10, 20, 30, 50];

const pct = (v: number | null | undefined, dp = 2): string =>
  v == null || !Number.isFinite(v) ? '—' : `${v >= 0 ? '' : '−'}${Math.abs(v).toFixed(dp)}%`;

const usd = (v: number): string =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${Math.round(v)}`;

export const FundingMonitorTab: React.FC<FundingMonitorTabProps> = ({ theme = 'light' }) => {
  const [asset, setAsset] = useState<Asset>('BTC');
  const [costBp, setCostBp] = useState(20);
  const [live, setLive] = useState<LiveFunding | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback(async (a: Asset) => {
    const r = await fetchFunding(a);
    if (r) { setLive(r); setUpdatedAt(Date.now()); }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    setLive(null);
    load(asset);
    const t = setInterval(() => load(asset), POLL_MS);
    return () => clearInterval(t);
  }, [asset, load]);

  const pairs = useMemo(() => (live ? buildPairs(live, asset, costBp) : []), [live, asset, costBp]);

  // Venues sorted by what they are paying right now, richest first — the top of
  // this list is the short leg, the bottom is the long leg.
  const rows = useMemo(() => {
    if (!live) return [];
    return Object.keys(live.venues)
      .map((id) => ({
        id,
        venue: VENUE_BY_ID[id],
        annual: live.venues[id] * ANNUALISE,
        base: BASELINE[asset]?.[id] ?? null,
      }))
      .sort((a, b) => b.annual - a.annual);
  }, [live, asset]);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtle = isDark ? 'text-white/50' : 'text-slate-500';
  const rowLine = isDark ? 'border-white/5' : 'border-black/5';

  // The widest carry is often the least trustworthy one: a venue with two days
  // of history and no known baseline will happily top the list on noise. Lead
  // with the widest pair whose BOTH legs have a real baseline behind them, and
  // mention the raw widest separately rather than promoting it.
  const solidLeg = (id: string) => (BASELINE[asset]?.[id]?.days ?? 0) >= 7;
  const best = pairs.find((p) => solidLeg(p.short) && solidLeg(p.long)) ?? null;
  const rawWidest = pairs[0] ?? null;
  const thinnerIsWider = rawWidest && best && rawWidest !== best;

  // One venue with an extreme rate pairs against everything and fills the whole
  // table with near-duplicate rows that say the same thing. Cap how often any
  // single venue can appear so the list shows distinct opportunities.
  const shown = useMemo(() => {
    const count: Record<string, number> = {};
    const out: Pair[] = [];
    for (const p of pairs) {
      const a = (count[p.short] ?? 0), b = (count[p.long] ?? 0);
      if (a >= 2 || b >= 2) continue;
      count[p.short] = a + 1; count[p.long] = b + 1;
      out.push(p);
      if (out.length >= 10) break;
    }
    return out;
  }, [pairs]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Funding Monitor</h2>
        <p className={`text-[13px] mt-1 ${subtle}`}>
          Live funding across 13 perp venues, normalised to a common rate, with the delta-neutral carry available on
          every pair and what it costs to hold.
        </p>
      </div>

      {/* controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {ASSETS.map((a) => (
            <button
              key={a}
              onClick={() => setAsset(a)}
              className={`px-3 py-2 rounded-[10px] text-[13px] font-bold border ${
                a === asset ? 'border-[#00A8E8] text-[#00A8E8]' : `${cardBg} text-foreground`
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] ${subtle}`}>round-trip cost</span>
          {COST_CHOICES.map((c) => (
            <button
              key={c}
              onClick={() => setCostBp(c)}
              className={`px-2.5 py-1.5 rounded-[8px] text-[12px] font-bold border ${
                c === costBp ? 'border-[#00A8E8] text-[#00A8E8]' : `${cardBg} text-foreground`
              }`}
            >
              {c}bp
            </button>
          ))}
        </div>
        <span className={`text-[11px] ${subtle}`}>
          {loading ? 'loading…' : updatedAt ? `updated ${Math.round((Date.now() - updatedAt) / 1000)}s ago` : ''}
        </span>
      </div>

      {/* headline */}
      {best && (
        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Widest carry right now</div>
          <div className="flex items-baseline gap-3 mt-2 flex-wrap">
            <span className="text-[32px] font-bold text-foreground tabular-nums">{pct(best.annual)}<span className={`text-[16px] font-normal ${subtle}`}>/yr</span></span>
            <span className="text-[14px] text-foreground">
              short <span className="font-bold">{VENUE_BY_ID[best.short]?.name ?? best.short}</span>
              {' · '}long <span className="font-bold">{VENUE_BY_ID[best.long]?.name ?? best.long}</span>
            </span>
          </div>
          <div className={`text-[12px] mt-2 ${subtle}`}>
            break-even after <span className="font-bold text-foreground">{best.breakevenDays.toFixed(1)} days</span> at {costBp}bp
            {best.baselineAnnual != null && (
              <> · 30-day baseline for this pair was <span className="font-bold text-foreground">{pct(best.baselineAnnual)}</span></>
            )}
            {pairDepth(best) != null && (
              <> · thinner leg holds <span className="font-bold text-foreground">{usd(pairDepth(best) as number)}</span> within 10bp</>
            )}
          </div>
          {thinnerIsWider && rawWidest && (
            <div className={`text-[11px] mt-2 ${subtle}`}>
              {pct(rawWidest.annual)}/yr is technically available short{' '}
              {VENUE_BY_ID[rawWidest.short]?.name ?? rawWidest.short} / long{' '}
              {VENUE_BY_ID[rawWidest.long]?.name ?? rawWidest.long}, but one of those legs has under a week of
              history here, so it is not shown as the headline.
            </div>
          )}
        </div>
      )}

      {/* per-venue */}
      <div className={`rounded-[16px] border overflow-hidden ${cardBg}`}>
        <div className={`px-5 py-3 border-b ${rowLine}`}>
          <span className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Funding by venue · {asset}</span>{' '}
          <span className={`text-[11px] ml-2 ${subtle}`}>annualised from each venue&apos;s own settlement period</span>
        </div>
        <div className="px-5 py-2">
          <div className={`grid grid-cols-12 gap-2 py-2 text-[11px] font-bold uppercase tracking-wide ${subtle}`}>
            <div className="col-span-4">venue</div>
            <div className="col-span-2 text-right">now %/yr</div>
            <div className="col-span-2 text-right">30d mean</div>
            <div className="col-span-1 text-center">settles</div>
            <div className="col-span-3">baseline component</div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className={`grid grid-cols-12 gap-2 py-2.5 border-t ${rowLine} items-center`}>
              <div className="col-span-4 text-[13px] font-bold text-foreground">
                {r.venue?.name ?? r.id}
                {r.base && r.base.days < 7 && (
                  <span className={`ml-2 text-[10px] font-normal ${subtle}`}>({r.base.days}d history only)</span>
                )}
              </div>
              <div className={`col-span-2 text-right text-[13px] tabular-nums font-bold ${r.annual >= 0 ? 'text-foreground' : 'text-[#F6465D]'}`}>
                {pct(r.annual)}
              </div>
              <div className={`col-span-2 text-right text-[13px] tabular-nums ${subtle}`}>
                {r.base ? pct(r.base.annual) : '—'}
              </div>
              <div className={`col-span-1 text-center text-[11px] ${subtle}`}>{r.venue?.intervalH ?? '?'}h</div>
              <div className="col-span-3 text-[11px]">
                {r.venue?.baseline === 'no' ? (
                  <span className="text-[#00A8E8] font-bold">premium only, no baseline</span>
                ) : r.venue?.baseline === 'yes' ? (
                  <span className={subtle}>carries 0.01%/8h</span>
                ) : (
                  <span className={subtle}>unknown</span>
                )}
              </div>
            </div>
          ))}
          {live?.missing && live.missing.length > 0 && (
            <div className={`text-[11px] py-3 border-t ${rowLine} ${subtle}`}>
              unreachable right now: {live.missing.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* pairs */}
      <div className={`rounded-[16px] border overflow-hidden ${cardBg}`}>
        <div className={`px-5 py-3 border-b ${rowLine}`}>
          <span className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Best pairs right now</span>{' '}
          <span className={`text-[11px] ml-2 ${subtle}`}>short the first, long the second, equal size · each venue capped at two rows</span>
        </div>
        <div className="px-5 py-2">
          <div className={`grid grid-cols-12 gap-2 py-2 text-[11px] font-bold uppercase tracking-wide ${subtle}`}>
            <div className="col-span-4">pair</div>
            <div className="col-span-2 text-right">carry %/yr</div>
            <div className="col-span-2 text-right">vs baseline</div>
            <div className="col-span-2 text-right">break-even</div>
            <div className="col-span-2 text-right">measured</div>
          </div>
          {shown.map((p: Pair) => {
            const wide = p.widenedBy != null && p.widenedBy >= 1.25;
            const thin = p.measured != null && p.measured.sameSign < 0.75;
            const thinHistory = !solidLeg(p.short) || !solidLeg(p.long);
            return (
              <div key={`${p.short}|${p.long}`} className={`grid grid-cols-12 gap-2 py-2.5 border-t ${rowLine} items-center`}>
                <div className="col-span-4 text-[13px] text-foreground flex items-center gap-1.5">
                  <ArrowDown size={12} className="text-[#F6465D] shrink-0" />
                  <span className="font-bold">{VENUE_BY_ID[p.short]?.name ?? p.short}</span>
                  <ArrowUp size={12} className="text-[#0ECB81] shrink-0 ml-1" />
                  <span className="font-bold">{VENUE_BY_ID[p.long]?.name ?? p.long}</span>
                  {thinHistory && (
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wide text-[#F0B90B] shrink-0">thin history</span>
                  )}
                </div>
                <div className="col-span-2 text-right text-[13px] tabular-nums font-bold text-foreground">{pct(p.annual)}</div>
                <div className={`col-span-2 text-right text-[12px] tabular-nums ${wide ? 'text-[#0ECB81] font-bold' : subtle}`}>
                  {p.baselineAnnual != null ? (
                    <>{pct(p.baselineAnnual)}{p.widenedBy != null && <>{' '}<span>({p.widenedBy.toFixed(1)}×)</span></>}</>
                  ) : '—'}
                </div>
                <div className={`col-span-2 text-right text-[12px] tabular-nums ${subtle}`}>
                  {Number.isFinite(p.breakevenDays) ? `${p.breakevenDays.toFixed(1)}d` : '—'}
                </div>
                <div className="col-span-2 text-right text-[11px]">
                  {p.measured ? (
                    <span className={thin ? 'text-[#F0B90B]' : subtle}>
                      {(100 * p.measured.sameSign).toFixed(0)}% · {p.measured.obs} obs
                    </span>
                  ) : (
                    <span className={subtle}>not studied</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* legend + honesty */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        <div className="flex gap-2 items-start mb-3">
          <Warning size={16} className="text-[#F0B90B] shrink-0 mt-0.5" />
          <span>
            <span className="font-bold text-foreground">This is a position, not a trade, and it is not risk-free.</span>{' '}
            Delta is hedged; the funding regime is not. A violent move needs collateral on the losing leg immediately —
            that is how delta-neutral carry actually blows up, not through directional error. Both venues must stay
            solvent and withdrawable for the whole hold, and the depth figures here were measured in a calm market, not
            the one you will want to exit into.
          </span>
        </div>
        <span className="font-bold text-foreground">Reading this page.</span>{' '}
        <span className="font-bold text-foreground">carry %/yr</span> is the annualised funding difference at this
        instant. <span className="font-bold text-foreground">vs baseline</span> compares it to the 30-day mean for that
        pair — a multiple above 1.25× is highlighted, meaning the spread is unusually wide right now.{' '}
        <span className="font-bold text-foreground">break-even</span> is how long you must hold before the carry covers
        getting in and out at the cost you selected; fees are paid once, carry accrues hourly, so a spread that looks
        rich can still lose money on a short hold. <span className="font-bold text-foreground">measured</span> is how
        often that pair pointed the same way across the 30-day study, counted on independent settlements — anything
        under 75% is flagged amber, because a mean that comes from flipping is not a position you can sit in.
        <br /><br />
        <span className="font-bold text-foreground">Where the spread comes from.</span> Most venues add an interest-rate
        baseline of 0.01% per 8 hours to their funding, worth 10.95%/yr. dYdX v4 and ApeX do not — their funding is
        premium-only. That formula difference, not a dislocation, is the bulk of what you see here: the measured
        Hyperliquid–dYdX carry on BTC was 10.54%/yr against 10.95% predicted. Arbitrage moves the premium around; it
        cannot delete a constant from someone&apos;s equation.
        <br /><br />
        <span className="font-bold text-foreground">Size is capped by the thinner book.</span> dYdX holds about $30k of
        bids within 10bp against Hyperliquid&apos;s $3.5M. Entering is easy; exiting is where it bites. Walking the real
        books, the full round trip on BTC ran 5.6bp at $10k and 27.3bp at $500k. Full workings in{' '}
        <span className="font-mono text-[11px]">research/funding-spreads/</span>.
      </div>
    </div>
  );
};

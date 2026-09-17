// Paper-trading a funding carry, and watching where it gets liquidated.
//
// The trade: short the venue paying high funding, long the venue paying low,
// same asset, same size. Price risk cancels; you collect the difference for as
// long as you hold. Measured at ~10%/yr on BTC and ~13% on ETH in
// research/funding-spreads/, with a two-week minimum hold once fees are paid.
//
// WHY PAPER FIRST. The 30-day study says what the carry *was*. It cannot say
// what you would have captured, because it does not know your fills, your
// slippage, or whether you were awake when the spread inverted. This logs an
// intended position and then scores it against live rates, so after a month
// there is a record of what the idea actually earned rather than what the
// backtest said it should have.
//
// WHY THE LIQUIDATION TRACKER MATTERS MORE. Delta is hedged; the funding regime
// is not, and neither is your margin. When price moves, one leg is always
// losing, and that leg needs collateral before the winning leg's profit is
// available to it. Most delta-neutral blowups are margin management, not bad
// trade selection.

export type Asset = 'BTC' | 'ETH' | 'SOL';

export interface CarryPosition {
  id: string;
  asset: Asset;
  shortVenue: string;      // the leg paying high funding — you receive
  longVenue: string;       // the leg paying low funding — you pay
  notionalUsd: number;     // per leg
  collateralUsd: number;   // per leg
  openedAt: number;
  entryCostBp: number;     // your assumption for slippage + fees, both legs, in
  exitCostBp: number;      // your assumption for getting back out
  /** Running integral of the funding spread, in basis points of notional. */
  accruedBp: number;
  /** When accruedBp was last advanced. Accrual only moves while the tab is open. */
  lastAccrualAt: number;
  /** Total wall-clock time the tab was closed and accrual could not be observed. */
  unobservedMs: number;
  entryPrice: number | null;
  closedAt?: number;
  closeNote?: string;
}

const KEY = 'creode.paperCarry.v1';
/** Accrual gaps longer than this are recorded as unobserved rather than
 *  integrated. Ten minutes of drift at a stale rate is tolerable; ten hours
 *  would be a fabricated number. */
export const MAX_ACCRUAL_GAP_MS = 10 * 60 * 1000;

export function loadPositions(): CarryPosition[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // private window, blocked storage, or corrupt payload — start empty rather
    // than breaking the page
    return [];
  }
}

export function savePositions(ps: CarryPosition[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(ps)); } catch { /* storage unavailable */ }
}

export function newPosition(p: Omit<CarryPosition, 'id' | 'accruedBp' | 'lastAccrualAt' | 'unobservedMs'>): CarryPosition {
  return {
    ...p,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    accruedBp: 0,
    lastAccrualAt: Date.now(),
    unobservedMs: 0,
  };
}

/** Advance a position's accrued carry to now, given the spread observed right
 *  now as an hourly fraction (short leg funding minus long leg funding).
 *
 *  Returns a NEW position rather than mutating, and records time it could not
 *  observe separately so the log never quietly claims carry it did not watch. */
export function accrue(p: CarryPosition, spreadHourly: number | null, now = Date.now()): CarryPosition {
  if (p.closedAt || spreadHourly == null || !Number.isFinite(spreadHourly)) return p;
  const gap = now - p.lastAccrualAt;
  if (gap <= 0) return p;
  if (gap > MAX_ACCRUAL_GAP_MS) {
    // The tab was closed. Do not integrate a rate we never saw.
    return { ...p, lastAccrualAt: now, unobservedMs: p.unobservedMs + gap };
  }
  const hours = gap / 3_600_000;
  return { ...p, accruedBp: p.accruedBp + spreadHourly * hours * 1e4, lastAccrualAt: now };
}

export interface Pnl {
  accruedBp: number;
  costBp: number;
  netBp: number;
  netUsd: number;
  breakevenPct: number;   // progress toward covering the round trip, 0..1+
  daysHeld: number;
  /** Days until the carry covers the round trip, at the rate seen so far. */
  daysToBreakeven: number | null;
}

export function pnl(p: CarryPosition, now = Date.now()): Pnl {
  const costBp = p.entryCostBp + p.exitCostBp;
  const netBp = p.accruedBp - costBp;
  const daysHeld = ((p.closedAt ?? now) - p.openedAt) / 86_400_000;
  const bpPerDay = daysHeld > 0 ? p.accruedBp / daysHeld : 0;
  return {
    accruedBp: p.accruedBp,
    costBp,
    netBp,
    netUsd: (netBp / 1e4) * p.notionalUsd,
    breakevenPct: costBp > 0 ? p.accruedBp / costBp : 1,
    daysHeld,
    daysToBreakeven: bpPerDay > 0 && netBp < 0 ? -netBp / bpPerDay : null,
  };
}

export interface LegRisk {
  venue: string;
  side: 'long' | 'short';
  mmf: number;
  mmfKnown: boolean;
  /** Fractional adverse price move that liquidates this leg. */
  moveToLiq: number;
  liqPrice: number | null;
}

/** Where each leg gets liquidated.
 *
 *  A leg is liquidated when its loss eats the collateral down to the
 *  maintenance requirement:
 *      loss = collateral − mmf × notional
 *  so the adverse move it can absorb is (collateral − mmf × notional) / notional.
 *
 *  The short leg dies on the way up, the long leg on the way down. Because the
 *  legs are equal and opposite, only one can be in trouble at a time — but the
 *  winning leg's profit sits on the *other* venue and does nothing to save it. */
export function legRisk(
  p: CarryPosition,
  price: number | null,
  mmfShort: number | null,
  mmfLong: number | null,
  fallbackMmf = 0.005,
): LegRisk[] {
  const build = (venue: string, side: 'long' | 'short', mmf: number | null): LegRisk => {
    const m = mmf ?? fallbackMmf;
    const move = p.notionalUsd > 0 ? (p.collateralUsd - m * p.notionalUsd) / p.notionalUsd : 0;
    const liq = price != null && move > 0 ? (side === 'short' ? price * (1 + move) : price * (1 - move)) : null;
    return { venue, side, mmf: m, mmfKnown: mmf != null, moveToLiq: move, liqPrice: liq };
  };
  return [build(p.shortVenue, 'short', mmfShort), build(p.longVenue, 'long', mmfLong)];
}

export interface MarginResponse {
  symbol: string;
  venues: Record<string, { mmf: number | null; imf: number | null; source: string } | null>;
  time: number;
}

export async function fetchMargin(symbol: Asset): Promise<MarginResponse | null> {
  try {
    const r = await fetch(`/api/market/margin?symbol=${symbol}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as MarginResponse;
  } catch {
    return null;
  }
}

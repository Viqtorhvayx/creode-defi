// GMX v2's execution price, and reading it before GMX does.
//
// THIS IS THE ONE PLACE IN THIS PROJECT WHERE "SECONDS EARLIER" IS TRUE.
// Gains' oracle trails the market by 150-300ms, Avantis by 200-400ms, Ostium by
// 650-900ms. GMX's execution feed trails by 3.2 SECONDS — an order of magnitude
// more than anything else measured, and it is the price your order actually
// fills at, not a display number. See research/oracle-execution-venues/.
//
// THE TRAP, and it nearly produced a false finding. GMX publishes two feeds:
//
//   /prices/tickers         the UI display feed. Polled. On BTC its min/max
//                           band is collapsed to zero, and it reads +2900ms.
//   /signed_prices/latest   what KEEPERS EXECUTE AGAINST. oracleType
//                           "realtimeFeed2" (Chainlink Data Streams), and it
//                           carries a real band. Reads +3200ms.
//
// Measuring the ticker and calling it the fill price would have reported a
// zero-spread venue with a 2.9s lag — a better trade than exists. This module
// reads the signed feed, which is the one a fill is priced from.
//
// AND IT STILL DOES NOT PAY, which the tab says on its face. GMX orders are
// executed by a keeper a block or two after you submit, at whatever the oracle
// says THEN — you cannot lock in the stale price you can see. Against a 10.4bp
// round trip ($79 on BTC), the largest move BTC made in ANY 3.2-second window
// across a 10-minute capture was $69.90. Hit rate 0.00%, at zero reaction time,
// on the cheaper fee assumption. The fee is the wall, not the lag.

/** Chainlink Data Streams, as GMX's keepers fetch it. Sends
 *  `access-control-allow-origin: *`, so the browser reads it directly rather
 *  than through our own origin — which matters, because routing their side
 *  through an extra hop would add delay to THEIR leg and flatter us. */
export const GMX_SIGNED_PRICES = 'https://arbitrum-api.gmxinfra.io/signed_prices/latest';

/** Their observed publish cadence is ~336ms; polling faster only burns their
 *  rate limit, and polling slower would add our own delay to their side. */
export const GMX_POLL_MS = 300;

/** GMX scales prices to (30 − tokenDecimals). BTC has 8 decimals, so 1e22. */
const SCALE: Record<string, number> = { BTC: 1e22, ETH: 1e12, SOL: 1e21, LINK: 1e12, ARB: 1e12, DOGE: 1e22, XRP: 1e24, AVAX: 1e12, UNI: 1e12, LTC: 1e22, NEAR: 1e6, ATOM: 1e24, AAVE: 1e12, BNB: 1e12 };

export interface GmxMarket { sym: string; name: string; }

/* Only markets with a deep, readable CEX spot book, for the same reason as the
 * Gains tab: we race the oracle with a median of exchange books, so a market we
 * cannot independently price is a market we have nothing to race with. */
export const GMX_MARKETS: GmxMarket[] = [
  { sym: 'BTC', name: 'Bitcoin' },
  { sym: 'ETH', name: 'Ethereum' },
  { sym: 'SOL', name: 'Solana' },
  { sym: 'LINK', name: 'Chainlink' },
  { sym: 'ARB', name: 'Arbitrum' },
  { sym: 'DOGE', name: 'Dogecoin' },
  { sym: 'AVAX', name: 'Avalanche' },
  { sym: 'UNI', name: 'Uniswap' },
  { sym: 'LTC', name: 'Litecoin' },
  { sym: 'NEAR', name: 'NEAR Protocol' },
  { sym: 'AAVE', name: 'Aave' },
  { sym: 'BNB', name: 'BNB' },
];

export interface GmxSignedPrice {
  /** Midpoint of the signed min/max band — the level a fill prices from. */
  mid: number;
  min: number;
  max: number;
  /** The band itself, in dollars. GMX's quoted cost before fees. */
  band: number;
  /** GMX's own timestamp for the signed report. */
  createdAt: number;
  oracleType: string | null;
  at: number;
}

interface RawSigned {
  tokenSymbol?: string;
  minPriceFull?: string;
  maxPriceFull?: string;
  createdAt?: string;
  oracleType?: string;
}

/** One read of the signed feed. Returns null rather than throwing, so a dropped
 *  poll leaves the last value on screen with its age visible instead of
 *  blanking the card. */
export async function fetchGmxSigned(sym: string): Promise<GmxSignedPrice | null> {
  try {
    const res = await fetch(GMX_SIGNED_PRICES, { cache: 'no-store' });
    if (!res.ok) return null;
    const d = await res.json();
    const list: RawSigned[] = d?.signedPrices ?? [];
    const row = list.find((x) => x.tokenSymbol === sym);
    if (!row?.minPriceFull || !row?.maxPriceFull) return null;
    const scale = SCALE[sym];
    if (!scale) return null;
    const min = Number(row.minPriceFull) / scale;
    const max = Number(row.maxPriceFull) / scale;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0) return null;
    return {
      mid: (min + max) / 2,
      min,
      max,
      band: max - min,
      createdAt: row.createdAt ? Date.parse(row.createdAt) : NaN,
      oracleType: row.oracleType ?? null,
      at: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Polls the signed feed and calls back only when the value actually changes.
 *  Counting unchanged re-reads as publishes would understate their cadence and
 *  therefore overstate our lead. */
export function subscribeGmxSigned(
  sym: string,
  onChange: (p: GmxSignedPrice) => void,
  onAnyRead?: (p: GmxSignedPrice) => void,
): () => void {
  let alive = true;
  let last: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const tick = async () => {
    const t0 = Date.now();
    const p = await fetchGmxSigned(sym);
    if (!alive) return;
    if (p) {
      onAnyRead?.(p);
      if (last === null || p.mid !== last) { last = p.mid; onChange(p); }
    }
    if (alive) timer = setTimeout(tick, Math.max(0, GMX_POLL_MS - (Date.now() - t0)));
  };
  tick();

  return () => { alive = false; if (timer) clearTimeout(timer); };
}

/** Measured round-trip cost on GMX BTC: the 0.40bp signed band plus GMX's
 *  published 5-7bp open/close fee per side. The fee is not exposed on their
 *  public API — /markets/info carries funding and borrowing rates but no fee
 *  factors — so it comes from their published schedule rather than measurement,
 *  and price impact is excluded entirely. Both omissions make the answer better
 *  than reality, not worse. */
export const GMX_BAND_BP = 0.40;
export const GMX_FEE_BP_PER_SIDE = 5;
export const GMX_ROUND_TRIP_BP = GMX_BAND_BP + 2 * GMX_FEE_BP_PER_SIDE;

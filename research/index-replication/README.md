# Replicating perp DEX index prices, and getting there first

**Result: yes.** Hyperliquid's BTC oracle trails a live replication of its own
published formula by **2.25–2.45 seconds**, and the replicated value lands
within **$0.01–$0.05** of the number they eventually print. Eight other perp
DEXes were measured the same way; the lead ranges from 4.8 seconds down to zero.

This is a different question from `research/lead-lag/`, and it is worth keeping
the two apart. That study asked whether any venue's price *arrives* before
Binance's. The answer was no, across twenty venues, and it was never going to be
yes. This study asks whether a venue's *published index* trails the inputs it is
computed from. That answer is yes almost everywhere, and it is not alpha — it is
arithmetic. A DEX index is a fixed function of CEX spot prices recomputed on a
fixed drumbeat. Between publishes it is frozen while the inputs keep moving.

## Which perp DEXes publish an index, and where they pull it from

Sixteen of twenty-two probed expose an index or oracle field. Grouped by where
the number comes from:

**Computed in-house from CEX spot books** — the replicable kind:

| venue | sources | aggregation | publishes |
|---|---|---|---|
| **Hyperliquid** | Binance, OKX, Bybit, Kraken, KuCoin, Gate, MEXC (+ own spot for assets that trade primarily on it) | weighted median, weights 3/2/2/1/1/1/1, then stake-weighted median across validators | **3.0s** |
| **Orderly** | major spot venues | volume-weighted average, weights refreshed every 5 min from trailing 4h volume, sources capped at ±5% from median, median fallback if several breach | 1.0s |
| **Hotstuff** | nine venues incl. Binance, Bybit, Gate, Hyperliquid, Kraken, KuCoin, MEXC, OKX, Pyth | weighted median with MAD outlier filtering | 2.0s |
| Aevo, Backpack, Extended, ApeX, Aster, GRVT, Hibachi, edgeX | not documented | not documented | 1.0–2.1s |

**Sourced from an external oracle network** — not replicable from CEX feeds
alone, because the number is whatever the network signs:

| venue | oracle |
|---|---|
| Lighter | Chainlink + Stork + Pyth combined |
| dYdX v4 | Slinky/Connect sidecar, median of CEX prices, per block |
| Ostium | Stork |
| Drift, Jupiter, Zeta | Pyth / Doves |
| Aark | Pyth |
| Avantis, Gains/gTrade | Pyth / Chainlink |

Hyperliquid is the one venue that publishes its recipe precisely enough to
replicate exactly rather than approximate. Everything else in the first table is
raced against a reference composite, which is honest but weaker — a bad fit
there could mean their formula differs, not that they are slow.

## Does the market price actually follow the index?

Yes, on the venue tested in depth. Over 12.6 minutes of Hyperliquid BTC:

- The order book mid sat a median **−4.8bp** from the oracle and stayed inside a
  **9.6bp band** while the oracle itself ranged **33bp**. The book tracks the
  oracle closely, at a small persistent discount rather than drifting away.
- Mark − oracle ran **−4.5bp**, which is expected: Hyperliquid builds mark as the
  median of (oracle + 150s EMA of the book's deviation), (median of bid/ask/last),
  and a weighted external perp mid. Mark is a function of the oracle by
  construction.
- Book and oracle returns co-moved at **corr 0.42** over matched intervals.

So the premise holds: index leads, mark is derived from it, and the book is held
near it by funding.

## The measurements

Two captures, 10.4 and 9.0 minutes, BTC. Our index is rebuilt continuously from
the seven spot books; each venue's published index is read over WebSocket where
they push it (Hyperliquid, Hotstuff, Backpack, dYdX) and polled at 250ms
otherwise. Lead is the level test from `research/lead-lag/`: for each index value
a venue publishes, which past value of ours best reproduces it.

| venue | run 1 | run 2 | fit | basis | notes |
|---|---|---|---|---|---|
| **Hyperliquid oracle** | **+2450ms** | **+2250ms** | $2.35 / $1.20 | −$0.05 / −$0.01 | exact formula replicated |
| Hotstuff | +4050ms | +4800ms | $2.38 | −$5 | matches the ~4.9s found independently in the earlier study |
| ApeX | +3900ms | +2350ms | $2.83 | −$3.6 | |
| Backpack | +1700ms | +2050ms | $2.30 | −$70 | USDC-quoted, hence the basis |
| Extended | +750ms | +450ms | $1.85 | −$78 | |
| Aevo | +300ms | +350ms | $2.44 | −$67 | |
| Hibachi | +300ms | +250ms | $2.07 | −$38 | |
| **Orderly** | **+0ms** | **+150ms** | $1.51 | −$66 | **not beatable** |
| Aster | +2600ms | +3850ms | $6.68 | — | not identified, well-depth 9% |

Guards, same as the earlier study: a self-control (our index against itself)
reads exactly **0ms** with 100% well-depth, and a +90s placebo finds nothing
(well-depth 3–9%, versus 21–71% for the real results).

**Orderly is the honest counter-example.** Their index is recomputed and
republished fast enough that a composite built the way we build ours does not get
there first. Not every venue is beatable, and the ones that are are beatable by
exactly as much as their publish interval allows — no more.

## Does the formula matter, or just the cadence?

Both, but for different things. Racing four constructions against Hyperliquid's
oracle from the same captured inputs:

| construction | lead | fit | basis |
|---|---|---|---|
| **weighted median** (their formula) | 2550ms | $2.15 | **−$0.01** |
| plain median | 2550ms | $2.04 | −$0.01 |
| mean | 2300ms | $1.95 | +$0.55 |
| Binance spot alone | 2450ms | $2.58 | **−$3.01** |

The **lead** is theirs to give — it comes from the 3-second cadence, and reading
Binance alone lands just as early. What the formula buys is being **right**:
Binance alone carries a $3.01 systematic offset against their oracle, where the
weighted median carries a penny. Early and wrong is worth nothing, so the
replication matters — just not for the reason it first appears to.

## What this is not

The index is not the fill price. On every venue here it governs funding, margin
and liquidation while you trade against the order book, and the book does not
wait for the oracle — Hyperliquid's own book tracks these same exchanges within
about half a second. `research/lead-lag/` measured what a lag like this is worth
when it *is* the fill price (Ostium, the one such venue reachable): the gap beats
the spread plus 2bp about 3% of the time, is worth ~1.2bp when it does, and
closes entirely once your reaction time reaches 750ms.

What the lead is genuinely good for is seeing the number move before the venue
admits it — funding drift, liquidation levels and mark price all follow it.

## Reproducing

```
node dexprobe.js      # who publishes an index, and which spot feeds are reachable
node replicate.js     # capture: our live replication + every venue's published index
node repanalyze.js    # lead, fit and basis per venue, with control and placebo
node verify.js        # does the formula matter, and does the market follow the index
```

The shipped version is `frontend/src/lib/creodeIndex.ts` (formula and venue
specs), `frontend/src/app/api/market/index-sources/route.ts` (reads the seven
spot books in parallel) and `frontend/src/components/IndexRaceTab.tsx`, which
re-measures the lead live in the browser instead of quoting these numbers.

## Caveats

- Two windows totalling ~19 minutes on one day, BTC only, on a fairly quiet tape.
- Bybit's REST is geo-blocked from some regions, including this sandbox, so the
  median there runs on six of seven sources (weight 9 of 11) and says so in the
  UI. Dropping an unreachable source is what the venues do themselves.
- The in-browser figure reads slightly lower than the offline one, because the
  browser timestamps our index when the API response arrives rather than when
  the exchange published — which backdates our own series and understates our
  lead. That is the conservative direction, so it is left alone.
- The eight venues raced against a reference composite rather than their own
  formula are measured, not replicated. A poor fit there is ambiguous between
  "they are slow" and "their formula differs from our stand-in".

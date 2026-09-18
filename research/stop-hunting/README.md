# Where your stop gets hunted

A stop loss and a liquidation do not fire against the market. They fire against
whatever price the **venue** uses to decide — and on several perp DEXes that
price is a laggy oracle. A lagging oracle keeps printing an old level after the
market has moved, so it can reach a stop at a moment the real market never did.
That is a phantom stop-out: closed at a loss on a wick that existed nowhere you
could have traded.

`research/trader-outcomes/` is why this is worth measuring. Comparing the top
and bottom groups of traders on Gains, the separation was mechanical rather than
predictive: **0.2% vs 13.0%** of trades ended in liquidation, **1.0% vs 22.2%**
on a stop loss. How trades end mattered more than what was traded.

**Result: the direct measurement came back empty, because the tape was quiet.
The derived answer is that exposure is the venue's lag multiplied by how fast
the market moves — and by that measure Katana and Hotstuff are 20x more exposed
than Gains, Avantis or Hyperliquid.**

## What was captured

Nine trigger-price feeds against a reference built from three deep books
(Binance perp, Binance spot, Bybit), 23 minutes, BTC. Each venue's feed is the
one its own documentation says governs stops, margin and liquidation.

Deviation from the reference, after removing each venue's persistent basis —
because a constant offset is a unit difference, not a stop hunt, and leaving it
in would convict whichever venue happens to quote lowest:

| venue | feed | p0.1 | p1 | p99 | p99.9 | worst |
|---|---|---|---|---|---|---|
| Katana | index price | −5.1 | −2.7 | 4.2 | 5.4 | −5.1 |
| Hyperliquid | oracle | −5.0 | −2.2 | 2.5 | 5.5 | −5.0 |
| GMX v2 | signed feed | −4.8 | −2.0 | 1.3 | 5.4 | −4.9 |
| Hyperliquid | mark | −4.7 | −2.1 | 2.3 | 5.4 | −4.7 |
| Hotstuff | oracle | −4.5 | −2.4 | 2.6 | 5.4 | −4.5 |
| Ostium | oracle | −3.6 | −0.8 | 0.9 | 3.5 | −4.9 |
| Gains | published feed | −1.6 | −0.7 | 0.9 | 1.4 | −3.6 |
| Avantis | Pyth Lazer | −1.0 | −0.9 | 0.8 | 2.0 | −3.7 |

Everything is inside 6bp. Simulating 1,078 entries held up to 300 seconds, the
phantom stop-out rate was **0.00% at every stop distance of 25bp or wider, on
every venue**.

## Why that is not "stops are safe"

The giveaway is in the same table. At a 10bp stop the highest phantom rate,
1.95%, belongs to **Hotstuff's book mid — the one series here that does not lag
at all**, above every laggy oracle. If lag were driving the result, the
4.9-second oracle would be worst and the non-lagging mid would be best. It is
the other way round, so at that distance the simulation is measuring jitter,
not stop hunting.

The mechanism needs volatility and there was none. BTC's largest move inside
Katana's entire 5.5-second lag window, across the whole capture, was **6.21bp**.
A stale oracle can only reach a stop the market never reached if the market
travels far and fast and then comes back. Nothing moved.

## The derived answer

The mechanism is exact, so it does not need a violent day to be stated. A venue
whose trigger price lags by L seconds is showing the market as it was L seconds
ago, so its deviation *is* the distance the market travelled in that window. A
stop d basis points away is reachable by the venue and not by the market when:

> the market moves **d bp within L seconds**, and then recovers

Which makes exposure a property of the lag, and nothing else about the venue:

| venue | lag | market speed needed to hunt a 50bp stop |
|---|---|---|
| **Katana** | 5500ms | **5.45%/min sustained** |
| **Hotstuff** | 4900ms | **6.12%/min** |
| **GMX v2** | 3200ms | **9.38%/min** |
| Ostium | 800ms | 37.50%/min |
| Hyperliquid | 425ms | 70.59%/min |
| Avantis | 300ms | 100.00%/min |
| Gains | 225ms | 133.33%/min |

Lower is more dangerous. Katana needs a 24th of the violence Gains needs before
the venue itself can take you out.

### Worked against a real candle

A 1% move in 10 seconds — an ordinary reaction to a CPI print or a large
liquidation cascade:

| venue | lag | deviation it would print | hunts a 50bp stop? |
|---|---|---|---|
| **Katana** | 5500ms | **55.0bp** | **YES** |
| Hotstuff | 4900ms | 49.0bp | marginal |
| GMX v2 | 3200ms | 32.0bp | no |
| Ostium | 800ms | 8.0bp | no |
| Hyperliquid | 425ms | 4.3bp | no |
| Avantis | 300ms | 3.0bp | no |
| Gains | 225ms | 2.3bp | no |

**This is arithmetic from the measured lags, not an observation.** The capture
contained no such move. It is labelled as derivation throughout because the
lags are measured and the multiplication is not in doubt, but the event was not
witnessed here.

## What to take from it

- On a normal tape, none of these venues will hunt a sanely-placed stop. The
  worst deviation seen anywhere in 23 minutes was 5.1bp, so a stop at 25bp or
  wider was never at risk on any of them.
- The exposure is **entirely concentrated in fast moves**, and it scales
  linearly with the venue's lag. Katana, Hotstuff and GMX carry 3.2 to 5.5
  seconds of it; Gains, Avantis and Hyperliquid carry a quarter of a second.
- That ordering is the useful output. If you hold through scheduled volatility —
  CPI, FOMC, a large unwind — a 50bp stop is reachable on Katana by a move that
  is merely brisk, and unreachable on Gains by anything short of a 133%/min
  collapse.
- The same lag also decides your **liquidation** price, which is the more
  expensive version of the same defect: on Gains the bottom group of traders
  lost 13.0% of their trades to it.

## Caveats

- **23 minutes on a dead tape.** This is the central limitation and it is not
  fixable by analysis. The direct phantom-stop measurement should be re-run
  across a genuinely volatile window before any of its zeros are quoted as a
  property of a venue.
- The derived table assumes deviation equals the market's travel over the lag
  window, which is exactly true only for a pure delay. Real oracles also median
  across sources and filter outliers, both of which reduce deviation, so the
  derived figures are an upper bound on exposure rather than a forecast.
- Lags come from the studies elsewhere in this repo and were measured on their
  own days; Katana's is the 5000–6100ms range rounded to 5500ms.
- Gains documents an index price for liquidations separate from the mark used
  for TP/SL, but the v4 endpoint that would expose them separately serves the
  v3 format in practice, so only the single published series could be measured.
- Only BTC. Thinner markets will deviate further on the same lag.

## Reproducing

```
node stopcap.js                            # 25-min capture, 9 trigger feeds + reference
node --max-old-space-size=3000 stopfit.js  # deviation tails + phantom stop-out simulation
node stoprisk.js                           # lag x volatility, and what a hunt requires
```

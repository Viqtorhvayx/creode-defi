# Funding spreads across perp DEXes

**This is the first thing in this line of work that survives scrutiny.** Unlike
the latency hunt in `research/lead-lag/`, the spread here is structural,
explainable, persistent across 30 days, and does not evaporate when you try to
reach it. It is also not free money, and the reasons why are at the bottom.

Thirteen venues, 30 days of settled funding, BTC / ETH / SOL.

## The mechanism

Most perp venues compute funding as **premium + an interest-rate baseline**,
where the baseline is a constant — conventionally 0.01% per 8 hours. That
constant is worth

    0.01% × 3 settlements/day × 365 = 10.95% per year

**dYdX v4 and ApeX do not use it.** Their funding is premium-only, so they sit
roughly 11%/yr below venues that carry the baseline. That is not a market
dislocation that arbitrage can close — it is a difference in formula. Arbitrage
can push the premium components around; it cannot delete a constant from
someone's funding equation.

The measured BTC spread between Hyperliquid and dYdX is **10.54%/yr**. The
baseline difference predicts 10.95%. That is the whole effect, and the fact that
the number lands on the mechanism is the main reason to believe it.

You can see it in the raw rates: the median hourly funding on Hyperliquid,
Backpack, Extended and Lighter is pinned at exactly **12.5e-6/hr** — which is
0.01%/8h expressed hourly — while dYdX's median is **0.00**.

## BTC — 30 days

| venue | mean %/yr | median %/yr | hours positive | settles |
|---|---|---|---|---|
| hibachi | 24.21 | 22.34 | 100% | 1h *(only 2 days of history)* |
| hyperliquid | 10.19 | 10.95 | 95% | 1h |
| orderly | 9.83 | 10.92 | 100% | 8h |
| extended | 9.48 | 11.39 | 94% | 1h |
| lighter | 9.28 | 10.51 | 95% | 1h |
| backpack | 9.23 | 10.95 | 95% | 1h |
| binance | 7.30 | 7.16 | 99% | 8h |
| grvt | 6.97 | 8.54 | 90% | 8h |
| aster | 6.41 | 6.60 | 93% | 8h |
| okx | 6.31 | 6.37 | 94% | 8h |
| **apex** | **3.61** | 4.95 | 68% | 1h |
| **dydx** | **−0.09** | 0.00 | 32% | 1h |

## Best pairs — short the high venue, long the low one, same size

`obs` is **independent** settlement observations, not expanded hours. Prefer the
rows with high `obs`; a 100% agreement rate on 60 observations is much weaker
than 89% on 500.

**BTC**

| short | long | obs | carry %/yr | same-sign | worst 7d | breakeven @30bp |
|---|---|---|---|---|---|---|
| hyperliquid | dydx | 500 | **10.54** | 89% | +0.180% | 10.4d |
| extended | dydx | 720 | 9.57 | 90% | +0.123% | 11.4d |
| lighter | dydx | 720 | 9.37 | 91% | +0.126% | 11.7d |
| backpack | dydx | 720 | 9.33 | 89% | +0.098% | 11.7d |
| orderly | dydx | 60 | 9.67 | 100% | +0.151% | 11.3d |

**ETH**

| short | long | obs | carry %/yr | same-sign | worst 7d |
|---|---|---|---|---|---|
| hyperliquid | apex | 500 | **13.43** | 89% | +0.157% |
| backpack | apex | 720 | 11.63 | 89% | +0.111% |
| orderly | apex | 60 | 18.56 | 100% | +0.265% |
| orderly | grvt | 60 | 14.45 | 98% | +0.123% |

**SOL**

| short | long | obs | carry %/yr | same-sign | worst 7d |
|---|---|---|---|---|---|
| lighter | apex | 720 | **13.31** | 71% | +0.167% |
| hyperliquid | apex | 500 | 13.37 | 68% | +0.093% |
| grvt | orderly | 60 | 12.28 | 98% | +0.134% |

Note SOL's same-sign rates are much lower (68–72%) than BTC's and ETH's. The SOL
spreads are larger but far less reliable — they average out to a good number by
flipping, which is exactly the thing that makes a mean unharvestable.

**Worst 7d is positive on every pair listed.** Across 30 days there was no
rolling week in which the carry on these pairs lost money. That is the single
most encouraging statistic here, and also the one most limited by a 30-day
window.

## What it costs to actually capture it

The dYdX book is the binding constraint. Depth within 10bp of mid: Hyperliquid
$3.5M bid / $7.1M ask, Backpack $2.5M / $2.7M, **dYdX $30k / $835k**. Entering
is easy; exiting is where it bites.

Full round trip for short-Hyperliquid / long-dYdX on BTC, walking the real books:

| notional | HL sell | dYdX buy | HL buy | dYdX sell | slippage | +20bp fees | breakeven |
|---|---|---|---|---|---|---|---|
| $10k | 0.1 | 3.8 | 0.1 | 1.7 | 5.6bp | 25.6bp | **8.9 days** |
| $50k | 0.1 | 10.4 | 0.1 | 7.1 | 17.6bp | 37.6bp | 13.0 days |
| $100k | 0.1 | 13.2 | 0.1 | 8.2 | 21.5bp | 41.5bp | 14.4 days |
| $500k | 0.1 | 15.7 | 0.1 | 11.5 | 27.3bp | 47.3bp | 16.4 days |

So: hold two weeks or more and the carry clears the cost of getting in and out.
Hold two days and you have paid to lose money. This is a position, not a trade.

## Why this is not "sure profit"

- **You are short volatility in disguise.** Delta is hedged; funding regime is
  not. A violent move flips premium components hard, and the leg that loses
  needs collateral *now*. Most delta-neutral carry blowups are margin
  management, not directional error.
- **Two venues, two counterparties.** Both legs must stay solvent and withdrawable
  for the whole hold. A venue freeze turns a hedged position into a naked one.
- **Thirty days, one regime.** Funding was positive nearly everywhere over this
  window — 99% of Binance settlements. The *baseline* component is constant and
  should survive a bearish regime, but the premium component can swamp it, and
  this data cannot tell you what that looks like.
- **Size is capped by the thin leg**, and the slippage table above is calm-market
  depth. In the stress event where you most want out, the dYdX bid side will not
  be $30k deep.
- **It is already being farmed.** The spread persists because of capital costs,
  venue risk and margin fragmentation — not because nobody noticed.

Net: the honest characterisation is a **~10%/yr carry on BTC with two weeks'
minimum hold, capped around a few hundred thousand dollars of notional by the
dYdX book, and real tail risk on both legs.** That is a genuine trade. It is not
a sure thing, and anyone selling it as one is not counting the tail.

## Measurement traps found on the way

Three would each have produced a spectacular fake spread:

1. **Interval.** Hyperliquid, dYdX, Backpack, Extended, Lighter, ApeX and Hibachi
   settle **hourly**; Binance, Aster, OKX, Orderly, Paradex and GRVT settle
   **8-hourly**. Comparing the two directly overstates by 8x. Every interval here
   was confirmed from the spacing of the venue's own settlement timestamps, not
   from documentation.
2. **Units.** Lighter and GRVT quote funding in **percent**; everyone else quotes a
   fraction. That is a 100x error. Lighter's own `value` field settles it — a rate
   of 0.0010 on a ~$76k position pays $0.77, so the rate is 0.001%, not 0.1%.
   GRVT reports `funding_interval_hours` inline, which confirms both traps at once.
3. **Sign.** Lighter publishes a magnitude plus a `direction` field rather than a
   signed rate.

And one statistical trap: expanding an 8-hourly venue onto an hourly grid turns
60 independent observations into 480 and makes agreement look eight times more
convincing. Persistence here is counted on the coarser of each pair's two
settlement periods.

## Reproducing

```
node fundprobe.js               # who exposes funding, in what field and interval
node histprobe.js               # who exposes settled history
SYM=BTC node fundhist.js        # 30 days, normalised to hourly -> funding_BTC.json
SYM=BTC node spread.js          # per-venue table, pairwise carry, persistence
node sizing.js                  # real book depth and the full round-trip cost
```

## Caveats

- 30 days ending 2026-09-16. Aevo's history endpoint rejected every pagination
  shape tried and is missing. Hibachi returns only ~2 days. Paradex republishes
  every ~5s rather than settling, so only a short recent window is available and
  it is excluded from pair statistics.
- Fees are modelled at a flat 20bp round trip across both legs. Actual taker
  fees vary by venue and tier; the breakeven column is given at 10bp and 30bp so
  the assumption can be replaced.
- Slippage is single-snapshot book depth taken during calm conditions.

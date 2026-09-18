# Does skill persist in perp trading?

Every other study in this repo asked whether a *mechanism* could be exploited —
a lagging oracle, a funding spread, a thin book. This one asks the question
underneath all of them: **do the people who make money trading perps keep making
money, or is the record indistinguishable from variance?**

It matters because it decides whether "trade smart" is a plan or a hope. If past
performance does not predict future performance, then choosing a strategy
because it worked recently is choosing noise, and no amount of venue research
fixes that.

**Result: on a risk-adjusted basis, past performance predicts essentially
nothing. Spearman rank correlation between a trader's PnL before the last month
and their ROI during it is −0.03. The hundred most profitable accounts going in
finished the month 54% profitable; the hundred *worst* finished 51% profitable.**

## The data

Hyperliquid publishes a leaderboard of **45,530 accounts** with PnL, ROI and
volume over day / week / month / all-time windows — the largest public record of
perp trader outcomes anywhere. Gains publishes every settled trade with the
trader's address, leverage, size, close reason and realized PnL, capped at a
72-hour window.

Two venues, different mechanisms, same shape of answer.

## The persistence test

The windows nest — all-time contains month — so they cannot be compared directly
without counting the same PnL twice. Subtracting gives disjoint periods:

```
earlier = allTime − month     (everything before the last month)
recent  = month               (the last month)
```

Rank on `earlier`, then look at `recent`. The two periods share no trades, so
any relationship is real persistence rather than an artifact.

16,557 accounts traded meaningfully in both.

| decile by PAST PnL | median past PnL | median month PnL | % up in month | mean month ROI |
|---|---|---|---|---|
| top 10% | $952,698 | $97,038 | 73.1% | 79.08% |
| 40–50% | $5,427 | $2,215 | 65.6% | 36.66% |
| 50–60% | −$2,331 | $0 | 49.4% | 13.50% |
| bottom 10% | −$274,118 | $1,178 | 54.5% | 29.78% |

That table looks like persistence, and it is the trap. It is denominated in
**dollars**, and dollar PnL is mostly account size: a large account prints large
numbers in both periods whether or not anyone is skilled.

Remove size by using ROI and the effect disappears:

| | Spearman |
|---|---|
| past PnL vs month PnL (dollars) | **0.228** |
| past ROI vs month ROI | **−0.033** |

And the cleanest check of all — take the extremes and follow them forward:

| group, ranked before the month | stayed profitable during | combined PnL during |
|---|---|---|
| the **100 best** beforehand | **54 / 100** | $40.7M |
| the **100 worst** beforehand | **51 / 100** | **$79.2M** |

54 against 51 is a coin flip. The worst hundred made nearly twice as much money
during the month as the best hundred.

## Concentration, on both venues

| | Hyperliquid | Gains (72h) |
|---|---|---|
| accounts | 45,530 | 423 |
| finished profitable | 50.4% all-time | 34.8% |
| share holding 80% of all profit | **4.17%** | **2.6%** (11 addresses) |

Two venues with completely different architectures — a central limit order book
and a peer-to-pool vault — produce the same distribution. A small handful take
almost everything.

## Turnover is the strongest thing that correlates with losing

| all-time volume | accounts | % profitable | median ROI |
|---|---|---|---|
| <$100k | 805 | 95.3% | +130.18% |
| $100k–1M | 2,247 | 87.5% | +59.89% |
| $1M–10M | 3,554 | 82.5% | +43.75% |
| **$10M–100M** | **29,094** | **39.7%** | **−25.88%** |
| $100M–1B | 6,023 | 43.1% | −21.08% |
| >$1B | 860 | 49.9% | 0.00% |

**Read this carefully — it is not "trade less and win."** The low-volume rows
are contaminated by survivorship: an account with tiny volume and a 130% ROI is
usually one that got lucky once and stopped. What the table supports is the
weaker and more useful claim that **turnover is expensive**, because every round
trip pays fees, spread and price impact, and the 29,094 accounts in the busiest
band sit at a −25.88% median ROI.

The same caveat kills the account-size table even harder — account value is an
*outcome*, not an input, so "big accounts win more" is close to circular. It is
recorded in the script and deliberately not used to conclude anything.

## What the Gains trade-level data adds

Hyperliquid gives outcomes; Gains gives the actual trades behind them. 14,160
round trips matched open-to-close over 72 hours.

**Holding time is a U-curve.** Unconditional across all matched trades:

| held | trades | win rate | total PnL |
|---|---|---|---|
| under 1 min | 8,463 | 46.1% | +$4,496 |
| 1–5 min | 719 | 22.1% | −$15,896 |
| 5–30 min | 1,487 | 35.3% | −$23,855 |
| 30 min–2h | 1,351 | 44.6% | −$20,793 |
| **2–24h** | 1,411 | 47.4% | **+$87,220** |
| over 24h | 114 | 38.6% | +$28,160 |

Money is made under a minute or over two hours. The band between is where it
dies — long enough to pay the costs, too short for a view to play out.

**How trades end separates the groups more than what they traded.** Comparing
the top and bottom 20% of traders with 8+ round trips:

| | top | bottom |
|---|---|---|
| ended in liquidation | **0.2%** | **13.0%** |
| ended on a stop loss | 1.0% | 22.2% |
| closed manually | 98.8% | 64.2% |
| median hold | 0.1 min | 23.5 min |
| win/loss size ratio | 1.61 | 0.69 |

**This comparison is selected on the outcome and cannot prove causation** — the
top group was chosen *because* it made money, so of course its stats look good.
What survives that objection is the size of the gaps: a 65x difference in
liquidation rate and a 22x difference in stop-outs are not the kind of thing
selection alone produces, and both are mechanical rather than predictive.

## What this means, stated plainly

1. **There is no evidence here that recent trading success identifies future
   trading success.** Any strategy chosen because it performed well lately is
   being chosen on noise.
2. **Costs are the term you actually control.** Turnover correlates with losing
   across 45,530 accounts, and cost is the mechanism.
3. **The mechanical failures are the expensive ones.** Liquidations and
   stop-outs, not bad market calls, are what separated the bottom group on
   Gains.

That points work toward venue selection, execution cost and liquidation
mechanics — things that are measurable and stable — and away from strategy
selection based on backtested or recent performance.

## Caveats

- Hyperliquid's leaderboard is a leaderboard: inclusion criteria are not
  published, so the population is not guaranteed to be every trader.
- The month/all-time split gives exactly one out-of-sample period. One period is
  not a study of persistence, it is a single observation of it — a stronger test
  would track the same accounts across many disjoint windows.
- Gains' 72-hour cap is short. The holding-time and close-reason results are
  from a single three-day window and one of those days had a $134k swing.
- Nothing here measures *why* the concentrated winners win. They may be market
  makers, they may be informed, they may be running the incentive programmes.
  The data distinguishes outcomes, not mechanisms.

## Reproducing

```
node winners.js                             # Gains: who wins, and what they do
node gainspnl.js                            # Gains: trader PnL, fees, impact
node --max-old-space-size=3000 hlskill.js   # Hyperliquid: the persistence test
```

`winners.js` and `gainspnl.js` read the 24h/72h trading-history pulls from
`backend-global.gains.trade/api/trading-history/{24h,48h,72h}?chainId={42161,8453}`
— 72h is the maximum window the API allows. `hlskill.js` reads
`stats-data.hyperliquid.xyz/Mainnet/leaderboard` (~38MB).

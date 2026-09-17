# Gains / gTrade: the missing measurement, taken

`research/oracle-execution-venues/` closed with one genuinely open question. Of
the seven oracle-execution venues checked, Gains was the only one where the
spread and the fees could be read but the price feed could not, because the host
in their docs — `backend-pricing.gains.trade` — does not resolve. Their lag was
recorded as unmeasured rather than assumed.

This measures it.

**Result: Gains' oracle trails the market by 150–300ms and republishes every
505ms. It is one of the fastest oracles measured anywhere in this project, and
a replication of it is early by less than it is wrong by.**

## Finding the feed

The real host is compiled into the trading page bundle, not documented:

```js
let l = "wss://", d = "https://"
U = H(j("backend-pricing.eu.gains.trade"), d)          // https base
V = q(j("backend-pricing.eu.gains.trade"), l) + "/v3"  // the price socket
```

`wss://backend-pricing.eu.gains.trade/v3` accepts an anonymous connection and
enforces no `Origin`, so a browser can read it directly. The wire format is a
flat array of alternating pair index and price —
`[0, 76562.91, 1, 2463.54, ...]` — with indices from
`backend-arbitrum.gains.trade/trading-variables` (0 = BTC/USD, 1 = ETH/USD).

Once a second a one-element array carries the server's own clock. That heartbeat
is what makes the rest of this trustworthy: it landed a steady **42–44ms** after
the server stamped it, worst case 51ms across a whole capture. Earlier in this
project arrival-time analysis had to be thrown out because our own jitter ran
47–455ms, larger than the effects being measured. On this feed it is small
enough to check rather than assume.

## The lag

Level test against the CEX tape — for each value Gains publishes, which past
value of the reference best reproduces it. Not cross-correlation on a resampled
grid, which manufactures a lead out of a venue's own publish interval. Two
captures, 13.0 and 14.0 minutes, BTC.

| reference | lag (run 1) | lag (run 2) | fit (run 2) | basis (run 2) | well |
|---|---|---|---|---|---|
| **composite median, USD** | — | **+150ms** | **$2.13** | **$3.31** | **84%** |
| Binance spot | +200ms | +200ms | $3.28 | −$71.75 | 76% |
| Bybit spot | +200ms | +250ms | $3.60 | −$69.93 | 72% |
| Binance perp | +250ms | +300ms | $3.67 | −$38.67 | 70% |
| Coinbase spot | +350ms | +450ms | $3.99 | +$8.65 | 66% |
| Kraken spot | −1700ms | −1750ms | $6.82 | +$2.74 | 60% |

ETH reads +250ms and +200ms across the two runs, fit $0.08 and $0.13.

Guards, both runs: self-control (the reference against itself) **+0ms at
100%**; placebo against a +90s shifted reference finds a well depth of **2–4%**,
i.e. nothing; reciprocity (Binance measured against Gains) reads −500 to −550ms
against a +150 to +300ms forward measurement, which is the direction it should
be and coarse for the obvious reason that Gains is a 505ms staircase.

Kraken's −1750ms is not a lead. Their BTC/USD book is thin enough that it
updates in bursts, and a step series that lags everything reads as "ahead" under
this test for the same mechanical reason forward-fill produced the retracted
Hotstuff claim. Its 60% well depth is the weakest in the table.

## The recipe: they quote USD, the deep books quote USDT

The basis column is the whole story. Gains' BTC oracle sat **$71.75 below**
Binance's USDT book and **$2.74 from** Kraken's USD book. USDT/USD ran 0.99909
across the capture (min 0.99899, max 0.99913), and 76,300 × (1 − 0.99909) =
$69.4 — the entire difference.

So the replication is a **median of the spot books converted to USD**. That
correction is worth 9.4bp, which is more than nine times Gains' own quoted BTC
spread of 1.0bp.

The first version of this got it wrong in a way worth recording: it took the
median over a mixture of USDT-quoted and USD-quoted books without converting.
On BTC the two clusters sit ~$70 apart, so the median simply flipped between
them tick by tick. It read a fit of **$3.19 and a lag of −50ms** — worse than
any single book, and a sign flip on the answer. A median is only meaningful over
values in the same units.

Converted properly, the composite is the best explanation of their number in the
table: lowest fit error, highest well depth, and a basis of $3.31 rather than
$70.

## The honest part

The lead is real, it survives every guard, and **it is smaller than our own
formula error.**

| | |
|---|---|
| their lag | +150ms |
| our fit to their number | $2.13 mean error, $3.31 basis |
| how far BTC moves in 300ms | median **$0.00**, p90 $4.30, p99 $9.80 |

Asked directly — is our continuously recomputed value closer to their NEXT
print than their CURRENT print is? — the answer is **29.3% of the time**, across
1,051 publishes where their price actually moved. Mean error against their next
print: ours $3.74, their own displayed print $2.38.

**We lose that test.** Being 150ms early is worth less than being $2 wrong.

This is the exact inverse of the Hyperliquid result in
`research/index-replication/`, and the comparison explains both:

| | Hyperliquid | Gains |
|---|---|---|
| publish cadence | 3000ms | 505ms |
| measured lead | 2250–2450ms | 150–300ms |
| formula published? | yes, exactly | no |
| our error vs their number | **$0.01** | **$2.13** |
| lead ÷ error | huge | less than one |

Six times the cadence and two hundred times the fidelity error. Hyperliquid
names its weights, so the replication is exact and 2.25 seconds of market
movement dwarfs a penny of error. Gains says only "median of up to 8 exchanges"
without naming them, so the best available stand-in carries dollars of error
into a window where the market barely moves.

## What does reach seconds: their screen goes stale

They do not republish when their median has not changed. Sampling the age of the
print on screen every 25ms across the capture:

| median | p75 | p90 | p99 | max |
|---|---|---|---|---|
| 395ms | 843ms | 1651ms | 4011ms | 8500ms |

Total staleness at a random instant is the lag plus that age: about 0.55s
typically, 1.8s at p90, **4.2s at p99**.

This is theirs, not our socket dropping. Their heartbeat arrives every second
regardless of prices, its gaps ran a median of 1001ms and a maximum of 1534ms —
never a missed beat — and it kept flowing through **all 75** of the BTC price
gaps longer than two seconds.

## Is the price they show the price they fill at?

This is the trap GMX set: it publishes a display feed and a separate signed feed
that keepers execute against, and measuring the display feed as if it were the
fill price would have been a false finding. Gains market orders carry no price
at all — you submit, and their oracle prices the order when it settles.

Test: pull Gains' own settled trades, and for each fill ask which past value of
the display feed the executed price looks like. Pooled across every pair, scored
in basis points because XAU at $4,300 and PEPE at $0.000007 cannot be averaged
in dollars. 111 fills inside a 25-minute, 463-pair capture.

Only **1 of 111** fills carried a price that appears verbatim in the display
feed; 53 more were within 0.01–0.04bp of one. So the two are separately computed
numbers off the same oracle, not the same number.

| lag | median abs error |
|---|---|
| −2000ms | 2.870bp |
| 0ms | 1.132bp |
| **+1000ms** | **1.012bp** |
| +2000ms | 2.042bp |
| +5000ms | 2.614bp |
| +10000ms | 4.538bp |

Best fit **+750ms**, well depth 63%. Block timestamps land on whole seconds so
the resolution is about a second — enough to tell 0s from 3s, not enough to tell
200ms from 400ms.

**Execution is not materially staler than display.** There is no second-scale
lag anywhere in this venue.

## What it would have to be worth

Gains' BTC round trip is 1.0bp of spread (`pairs[0].spreadP` = 1e8, scaled 1e10)
plus 3.5bp per side (`fees[13].totalPositionSizeFeeP` = 3.5e8) = **8.0bp**, a
$61 move on a $76.3k price. The largest 300ms move in the capture was $25.10.

Same shape as GMX, and the same conclusion for a different reason: GMX has a
3.2-second execution lag defended by a fee larger than any move that fits inside
it; Gains has almost no lag to defend.

## Caveats

- Two captures of 13 and 14 minutes on a quiet tape, one market pair for the lag
  and 111 pooled fills for the execution test. The fill test in particular is
  thin — its curve is bumpy at 4s, which is noise at n=111, and only the 0–1s
  minimum region is firm.
- The composite is an equal median over four books. Gains names neither its
  exchanges nor its weights, so this is a stand-in, and its $2.13 error is a
  measurement of how much of their formula is missing rather than of their
  oracle.
- Pair indices in `trading-variables` are positional and move when Gains
  relists. Every index used is re-checked at runtime against that endpoint
  before a price is shown.

## Reproducing

```
node gainsnet.js    # load their trading page and record every host it calls
node gainscap.js    # 14-min capture: Gains feed, 5 CEX books, USDT/USD
node gainslag.js    # the level test, the guards, the composite, print age
node gainsfill.js   # 25-min capture of all 463 pairs on their feed
node gainsexec.js   # settled fills vs the display feed: is it the same price?
```

`gainsnet.js` needs Playwright and is the only step that does — it is how the
feed host was found in the first place, and it is worth keeping because the same
technique is the only thing that worked on the 2026 cohort in
`research/new-venue-screen/`.

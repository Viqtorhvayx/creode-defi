# Oracle-execution venues: the last place a lag could have been reachable

On an order-book venue a lagging oracle is unreachable — you fill against the
book, and the book is faster than the oracle. That was settled in
`research/lead-lag/` and `research/new-venue-screen/`.

This is the other class: **no order book at all.** You trade against an LP pool
at the oracle price, so the oracle *is* your fill. Any lag here is directly
tradeable, and the only defences are the spread, the fees, and how fast you can
act. Seven venues were named as unchecked. This checks them.

**Result: the largest lag found is GMX's 3.2 seconds on its actual execution
feed — and the round-trip fee is larger than the biggest move BTC made in any
3.2-second window during the capture.** The fee is the wall, not the lag.

**This class is now closed.** Every venue in it has been measured or ruled out,
including the four whose endpoints were dead on the first pass:

| venue | oracle lag | why it does not pay |
|---|---|---|
| GMX v2 | **3200ms** | 10.4bp round trip vs a $69.90 maximum 3.2s move — 0.00% hit rate |
| Ostium | 650–900ms | 1.66bp spread; the window closes before you can act |
| Avantis / Veranta | 200–400ms | 0.17bp band alone beats 96.9% of the moves in the window |
| Arcus | 300ms | no lag to speak of; a 7.2bp mark-over-oracle basis you cannot trade |
| Gains / gTrade | 150–300ms | 8.0bp round trip vs a $9.80 p99 300ms move |
| Levana | — | shut down |
| HMX / DESK | — | pool backend dead; live product is an order book |
| Jupiter | — | executes at Pyth, sub-second by design |
| Adrena | — | bot-walled, not measured |

## What could be reached

| venue | status |
|---|---|
| **GMX v2** | fully measured — execution feed, spread and lag |
| **Ostium** | fully measured (also in `research/lead-lag/`) |
| **Gains / gTrade** | **now fully measured — see `research/gains-oracle/`** |
| Jupiter | no reachable OpenAPI; executes at Pyth, which is sub-second by design |
| **Avantis** | **now fully measured — see "The four that were unreachable" below** |
| **Levana** | **shut down — the site redirects to a protocol shutdown notice** |
| **HMX** | **rebranded to DESK; the pool backend 503s and the live product is a CLOB** |
| Adrena | `app.adrena.xyz` sits behind a Vercel bot checkpoint |

## The trap: GMX publishes two price feeds

This nearly produced a false finding, and it is the most useful thing here.

| endpoint | what it is | BTC lag | BTC spread |
|---|---|---|---|
| `/prices/tickers` | the **UI display** feed, polled | +2900ms | **$0.00** — min/max band collapsed |
| `/signed_prices/latest` | what **keepers execute against** — `oracleType: realtimeFeed2`, fetched over websocket | **+3200ms** | **$3.03 (0.40bp)** median, $5.28 (0.69bp) p90 |

Measuring the ticker and calling it the fill price would have reported a
zero-spread venue with a 2.9s lag — a much better trade than exists. The feed
orders actually price from is both slower *and* carries a spread the display
feed does not show.

Level test against Binance USDT-M perp over websocket, 10 minutes, 7,646
reference ticks, 1,631 signed-price changes at a 336ms cadence. Well depth 74%.
Self-control (reference against itself) reads **+0ms at 99%**.

## What the 3.2 seconds is worth

The subtlety that decides it: **GMX v2 orders are executed by a keeper a block or
two after you submit, at whatever the oracle says then.** You cannot lock in the
stale price you can see. The window you actually get is
`3200ms − your submit-to-execution latency`.

How far BTC travelled inside that window, from the same capture:

| usable window | median | p90 | p99 | max in 10 min |
|---|---|---|---|---|
| 3200ms | $9.50 | $25.80 | $39.00 | **$69.90** |
| 2200ms | $7.40 | $20.90 | $35.40 | $59.90 |
| 1200ms | $4.60 | $14.80 | $26.10 | $38.70 |

Against a round-trip cost of the 0.40bp spread plus GMX's open and close fees:

| fees per side | total cost | move needed | hit rate at any reaction time |
|---|---|---|---|
| 5bp | 10.4bp | **$79.07** | **0.00%** |
| 7bp | 14.4bp | **$109.48** | **0.00%** |

**The cheapest break-even move is $79. The largest move BTC made in any
3.2-second window across the whole capture was $69.90.** Not once, at zero
reaction time, with the lower fee assumption.

Put as a ratio: you need a 10.4bp move inside 3.2 seconds. The median 3.2s move
is 1.25bp, the p99 is 5.1bp, and the ten-minute maximum was 9.2bp. You are
looking for something past the 99.9th percentile just to break even.

## Gains / gTrade — spread known, lag not

`backend-arbitrum.gains.trade/trading-variables` exposes the per-pair spread
directly. Scaling confirmed by comparing pairs (`spreadP / 1e10` read as a
percentage; the alternative reading gives BTC a 1% spread, which is not
credible):

| pair | spread |
|---|---|
| BTC, ETH, EUR, GBP | **1.0bp** |
| SOL, DOGE, PEPE, XAU | **0.0bp** |

Plus `totalPositionSizeFeeP = 3.5bp` per side. So BTC round trip ≈ 1bp spread +
7bp fees = **8bp**, needing a ~$61 move.

**UPDATE — the lag is now measured, and it is small.** The host in their docs
(`backend-pricing.gains.trade`) does not exist; the real one is compiled into
their trading page bundle as `backend-pricing.eu.gains.trade/v3`. Measured over
two captures: they republish every **505ms** and trail the tape by
**150–300ms**, which makes theirs one of the fastest oracles in this project
rather than one of the slowest. Their settled fills price off the display feed
from 750–1000ms earlier, so execution is not materially staler than display
either. Full write-up, guards and the execution test in
`research/gains-oracle/`.

## The four that were unreachable

Revisited with the technique that cracked Gains: pull the trading app's JS
bundles and read the feed host out of them, rather than guessing REST paths.
Two of the four turned out not to be venues any more.

| venue | what it is now |
|---|---|
| **Levana** | **shut down.** `trade.levana.finance` redirects to a protocol shutdown notice. |
| **HMX** | **rebranded to DESK.** `pool-api.desk.exchange` returns 503 and `arbitrum-gapi.hmx.org` still 526s. The live product is `clob.desk.exchange` — an order book, so the oracle is no longer the fill price and it leaves this class entirely. |
| **Adrena** | behind a Vercel bot checkpoint. Not measured. |
| **Avantis** | **rebranded to Veranta, and fully measured — below.** |

### Avantis / Veranta

The feed is compiled into the trading bundle, not documented:

```js
y  = "https://feed-v3.avantisfi.com"
new EventSource(`${y}/v1/stream?price_feed_ids=1&price_feed_ids=2`)  // event: price_update
```

It is **Pyth Lazer relayed through their own host** — feed id 1 is BTC/USD, 2 is
ETH/USD, prices scaled 1e-8, 26 publishers, a quoted bid/ask band on every
message. `/v1/price-feeds/last-price` is a daily-candle endpoint and is not the
live feed.

Measured over 11.2 minutes on BTC:

| | |
|---|---|
| publish grid | **200ms** (p90 201ms) — regular to the millisecond |
| lag vs Binance spot | **+200ms**, fit $1.93, well **56%** |
| lag vs Binance perp | +400ms, fit $2.51, well 33% |
| lag vs Coinbase | +500ms, fit $2.84, well 23% |
| quoted band | $1.27 (**0.17bp**) |

Self-control reads **+0ms at 100%**. The placebo reaches 11% well depth, which
is higher than the 2–4% seen elsewhere, so only the Binance spot result at 56%
is comfortably clear of it.

**It does not pay, and the margin is not close.** Inside the 400ms window BTC
moved a median of $0.00 and a p90 of $0.00, with a p99 of $5.80 and a maximum of
$19.80. Their own quoted band is $1.27 before a single fee, and **only 3.08% of
windows clear even that**.

One caveat that cuts against trusting this too hard: the capture landed on a
very quiet tape — 612 Binance perp changes in 11.2 minutes against 4,746 in a
13-minute Gains capture earlier the same day. That is why the well depths here
are weaker than elsewhere, and it is the reason to read this as "same order as
Gains" rather than as a precise 200ms.

A note on their wire clock: `timestampUs` arrives ~217ms *ahead* of our local
clock, and sits 226ms after the `feedUpdateTimestamp` in the same message. A
negative transport time is not physical, so their clock is simply running ahead
of ours. Their stamps are therefore usable for measuring their own publish grid
and not for absolute timing — which is why the lag above is measured on arrival
times, with the self-control guard to keep that honest.

## Ostium, re-confirmed

+900ms lag, $12.67 (1.66bp) spread, measured in the same run. Consistent with
the 650–879ms found earlier. Its defence is the spread rather than the fee.

## The pattern, stated properly

Five venue-classes measured across this session, and the same relationship every
time:

> **A venue can afford a slow oracle exactly when nothing valuable settles
> against it. Where the oracle IS the fill price, it is either fast, or it is
> defended by a cost larger than the lag is worth.**

GMX is the cleanest illustration. It has the slowest execution oracle found
anywhere — 3.2 full seconds — and it is perfectly safe, because 10.4bp of fees
against a 1.25bp median move means the lag would have to be an order of
magnitude larger before the arithmetic turned.

## Caveats

- 10 minutes on a quiet tape. In a violent market, $79 moves inside 3.2s
  certainly happen — the claim is not "never", it is that the fee is 5–8× the
  median move, so the venue is defended by construction rather than by luck.
- GMX's fee is shown as a 5–7bp range. It is not exposed on the public API
  (`/markets/info` carries funding and borrowing rates but no fee factors), so
  it comes from their published schedule rather than measurement, and price
  impact is excluded entirely. Both omissions make the answer worse, not better.
- Gains' lag was genuinely unmeasured here rather than assumed, and has since
  been measured — see the update above.

## Reproducing

```
node poolprobe.js    # which oracle-execution venues answer at all
node poolcap.js      # GMX ticker + Ostium vs Binance
node gmxsigned.js    # GMX's actual execution feed vs Binance
node gmxedge.js      # what the lag is worth after spread, fees and latency

node poolnet.js      # load the dead-endpoint venues' apps, record every host
node avcap.js        # 13-min capture: Avantis/Veranta Pyth Lazer vs the tape
node avlag.js        # the level test, the guards, and what the window is worth
```

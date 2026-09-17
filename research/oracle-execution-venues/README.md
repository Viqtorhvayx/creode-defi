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

## What could be reached

| venue | status |
|---|---|
| **GMX v2** | fully measured — execution feed, spread and lag |
| **Ostium** | fully measured (also in `research/lead-lag/`) |
| **Gains / gTrade** | spread and fees readable; price feed unreachable, so lag unmeasured |
| Jupiter | no reachable OpenAPI; executes at Pyth, which is sub-second by design |
| Avantis | every documented endpoint 404s |
| Levana | `querier-mainnet.levana.finance` — Cloudflare 1016, origin DNS dead |
| HMX | `api.hmx.org` — Cloudflare 526, invalid SSL certificate |
| Adrena | `datapi.adrena.xyz` — 503, upstream connection failure |

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

Their price backend (`backend-pricing.gains.trade`) does not resolve from here,
so **their oracle lag is unmeasured**. If it resembles GMX's 3.2s, the same
arithmetic applies and the answer is the same. If it were far longer, it would
be worth another look — that is the one genuinely open question left in this
class.

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
- Gains' lag is genuinely unmeasured, not assumed.

## Reproducing

```
node poolprobe.js    # which oracle-execution venues answer at all
node poolcap.js      # GMX ticker + Ostium vs Binance
node gmxsigned.js    # GMX's actual execution feed vs Binance
node gmxedge.js      # what the lag is worth after spread, fees and latency
```

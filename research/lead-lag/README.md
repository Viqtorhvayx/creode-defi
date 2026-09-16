# Does any perp venue lead Binance?

Short answer: **no.** Across 20+ venues measured live, nothing gets there first.
A handful tie with Binance's BTCUSDT perp; everything else trails it, by between
25ms and five seconds. Not one venue tested has a negative lag.

This directory holds the measurement harness and what it found, including two
artifacts that each produced a convincing-looking lead that wasn't real.

## Method

Two independent captures, 14 and 15 minutes, taken about 20 minutes apart on
2026-09-16. BTC on every venue that exposes a public feed from this host, plus
HYPE as a separate case (below).

Everything that matters about the method comes down to four choices:

**WebSocket push, not polling.** A poller imposes its own interval on the data,
and that interval is the single easiest thing to mistake for a lead. Where a
venue's WS was unreachable (OKX from this host) it was polled, and its numbers
are marked resolution-limited.

**Venue server clocks, not arrival times.** Arrival times carry this machine's
network path to each venue. Those paths are asymmetric — 18ms to Bitget, 204ms
to Hyperliquid — and jittery: the Binance socket's own delivery delay ranges
from 47ms to 455ms in bursts. That jitter is an order of magnitude larger than
most of the effects being measured. Running the analysis on arrival times
produces garbage: every venue pins to the boundary of the search range with no
identifiable minimum. Server timestamps instead carry only clock skew between
exchanges, which the minimum-delay figures bound at a few tens of ms.

**Two estimators that never resample the slow series.** `LEVEL` asks which
shifted reference level best matches each print. `RETURN` correlates a venue's
return over its own inter-print interval with the reference's return over that
same interval, shifted. Only the reference is interpolated, and it updates ~40
times a second — far denser than any venue tested. Interpolating the *fast*
series is harmless. Interpolating the *slow* one is what manufactures phantom
leads, and is exactly the mistake that produced the earlier retracted results in
this repo.

**Guards, because the estimator has to be caught lying.**

| guard | what it catches | result |
|---|---|---|
| self-control — two sockets on one stream, logged as separate venues | any pipeline that invents a lead from nothing | reads **0ms**, 98% well-depth, both runs |
| placebo — same test against the reference shifted 90s | how much structure the method finds in unrelated data | well-depth **1–5%**, vs 45–98% for real results |
| reciprocity — A-vs-B must equal −(B-vs-A) | one-sided results that measure a venue's publishing habits, not a relationship | exact for dense pairs; drifts only where one side is sparse, bounded by half its gap |
| confirmation hold — a crossing must still hold 300ms later | wide or jittery books crossing a threshold by accident | collapsed Paradex's apparent lead (below) |

## Results — BTC, against Binance USDT-M perp

`LEVEL` is the lag that best fits the price level. `event` is the median time to
cross the halfway point of a sharp move, over 33 moves of ≥4bp in 400ms.
Positive means the venue trails Binance.

| venue | LEVEL | event | times it got there first |
|---|---|---|---|
| Binance perp *(reference)* | 0 | 0 | — |
| Bitget | **0ms** | −3ms | 53% — a genuine tie |
| Gate | **0ms** | +7ms | 43% — a genuine tie |
| Paradex | **0ms** | −24ms | 59%, but see below |
| Backpack | **0ms** | +120ms | 13% |
| Bybit | +25ms | +36ms | 27% |
| Binance **spot** (trades) | +25ms | +11ms | 34% |
| Coinbase | +50ms | +59ms | 28% |
| Deribit | +50ms | +75ms | 28% |
| OKX *(polled)* | +75ms | +180ms | 18% |
| Binance **spot** (book) | +100ms | +101ms | 7% |
| Aster | +100ms | +114ms | 25% |
| Hyperliquid | +575ms | +559ms | 15% |
| Kraken | +575ms | +1299ms | 10% |
| Ostium *(oracle)* | +650ms | +879ms | 6% |
| Hotstuff *(book)* | +550ms | +1266ms | not identified — well-depth 13%, barely above placebo |
| Hotstuff *(oracle)* | **+4900ms** | — | — |

Run 1 gave the same ordering: Bitget/Gate/Backpack at 0, Bybit +25, spot +75,
Aster +100, Hyperliquid +500, Hotstuff oracle +5250.

Three things worth pulling out.

**Coinbase does not lead.** US spot flow was the most plausible candidate for
leading Binance on a US-driven move. It trails by 50ms and gets there first in
28% of sharp moves — behind, not ahead.

**Binance spot trails Binance's own perp** by 25–100ms, and got there first in
just 7% of sharp moves (2 of 29). Price discovery happens in the perp. This is
the one finding with a direct product consequence, since Creode currently reads
spot.

**The Hotstuff oracle's ~5s lag is real and now confirmed a third time.** It was
found at 4–5s by an earlier direct level test, 5250ms in run 1, 4900ms in run 2,
with well-depth 45% against a 2% placebo. It is still not tradable — see below.

## Results — HYPE, the case that should have worked

Hyperliquid is the dominant venue for its own token. If price discovery location
ever produced a lead, this is where it would show up.

| venue | LEVEL | event | got there first |
|---|---|---|---|
| Binance *(reference)* | 0 | 0 | — |
| Gate | 0ms | +5ms | 37% |
| Bybit | +25ms | +41ms | 21% |
| **Hyperliquid** | **+275ms** | **+577ms** | **21%** |

Hyperliquid trails Binance on its own token, in both runs, on both estimators.
Run 1 was starker still: first in 3 of 51 sharp moves.

## Two artifacts that looked exactly like a lead

**Aster's timestamps are bucketed.** Its `bookTicker` copies Binance's schema,
but its `T` field is rounded into 50–100ms buckets — 666 distinct values across
1637 messages. Rounding down backdates every print, and Aster duly measured a
200–400ms *lead* over Binance. Its `E` field has full millisecond resolution;
on `E`, Aster reads +100ms behind. The harness now uses `E`.

**Paradex's book is jittery.** In the event study Paradex looked like it crossed
first, at −71ms with a p25 of −658ms. But its level test said +0ms, and run 1
had said +57ms. Requiring a crossing to still hold 300ms later pulled p25 from
−658ms to −109ms and the median to −24ms. The negative tail was a wide book
wobbling across the threshold early and falling back, not information. Paradex
ties; it does not lead.

Both fit the same pattern as the earlier retracted claims in this repo: a number
that survives only because one specific property of one feed was never checked.

## What a lag is actually worth

A lag only pays if, during the lag window, the real price travels further than
it costs to trade. Ostium is the only venue measured where the lagging price
*is* the fill price — you execute at the oracle, not against a book — so it is
the only place a lag is even theoretically extractable.

Measured: lag 650–879ms, spread $13.10 (1.7bp), BTC ~$75,900.

| your reaction time | usable window | gap beats spread | beats spread+2bp | avg edge when it does |
|---|---|---|---|---|
| 0ms *(unattainable)* | 650ms | 23.4% | 3.2% | 1.2bp (~$9) |
| 250ms | 400ms | 13.5% | 1.4% | 1.2bp |
| 500ms | 150ms | 3.7% | 0.2% | — |
| 750ms | none | — | — | the venue has caught up before you can act |

At 2bp of fees the gap clears cost about 3% of the time, and when it does it is
worth roughly 1.2bp — about $9 on a $76,000 position, before gas, before
funding, and before the transaction has to land on Arbitrum. The reaction-time
row is what kills it: a browser watching a websocket and firing an L2
transaction does not operate inside a 650ms window.

The Hotstuff oracle's 4.9s lag is nearly eight times larger, and the gap beats a
1bp cost 80% of the time. It is still worth nothing, because Hotstuff is an
order-book venue: you fill against the book, and the book tracks Binance within
550ms. The oracle governs margin and liquidation math only. The large lag and
the inability to trade it are the same fact — an oracle is allowed to be slow
precisely because nothing settles against it directly.

## Reproducing

```
node probe.js          # which venues answer from here, and with what fields
node probe_ws.js       # which websocket feeds work
node collect.js        # 15-minute capture -> ticks2.jsonl
node reduce.js ticks2.jsonl reduced.json
BASE=srv ASSET=BTC node lead.js reduced.json     # level + return, placebo, reciprocity
CONFIRM=300 ASSET=BTC node event.js reduced.json # who moves first on sharp moves
node edge.js reduced.json                        # what a lag is worth after costs
```

`BASE=loc` reruns on arrival times. It is left in deliberately: seeing it fail
is the clearest demonstration of why server clocks are not optional here.

## Caveats

- Two windows totalling 29 minutes on one day, with BTC around $75–76k and no
  major scheduled event. Lead-lag can shift during genuine news shocks; this
  says nothing about behaviour in a violent tape.
- BitMEX connects but sent no quote data and is missing. Binance's futures
  *trade* stream is geo-blocked from this host, so spot-vs-perp uses spot trades
  against perp quotes — both on Binance's own clock, so the comparison is sound.
- Lighter, Vertex, Extended, Drift, Orderly, edgeX and Avantis were probed and
  could not be reached or required auth. None are large enough to overturn a
  result this consistent, but they are untested.
- The tie group (Bitget, Gate, Paradex, Backpack at 0ms) is a tie *within
  measurement resolution*. Clock skew between exchanges bounds that resolution
  at a few tens of ms; nothing here can distinguish 0ms from 20ms.

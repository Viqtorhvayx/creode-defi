# Screening the 2026 perp DEX cohort for a reachable oracle lag

39 venues listed in 2026 with a live site (see `research/venue-directory/`).
This screened them for the one property worth having: a published oracle that
visibly trails the real market, sitting somewhere a taker could actually reach.

**Result: no. The largest oracle lag found anywhere in this session — 5 to 6
seconds, on Katana — sits behind a book with $344 of depth.**

## What could even be opened

Most of the cohort publishes no API and no docs. Guessing REST paths against 19
discovered hosts returned nothing on all 19. Loading each app in a real browser
and recording its network calls worked, but only for a minority — the rest are
waitlists, wallet-gated, or did not finish loading.

| outcome | venues |
|---|---|
| **API cracked, oracle measurable** | Katana, Arcus, Ondo Perps |
| **Hyperliquid front-ends, not separate venues** | Meridian, Bounce.Tech, 100XSOON — all call `api.hyperliquid.xyz` |
| **Testnet** | Brokex (`/protocol-info` returns `"network":"testnet"`) |
| **Waitlist / not trading** | OBSDN |
| **Nothing reachable** | Drake, AFX, Phoenix, Mooncake, Euphoria, Likwid, UpDown, TRUE DEX, Perpl, Corex, Bulk, Decibel, Wikicious, Denaria, and the rest |

Two traps worth recording:

- **TRUE DEX streams `wss://app.truefinance.ai/ws/coingecko`**, carrying CoinGecko
  aggregates with fdv and 30d/60d/1y changes. That looks like a catastrophically
  slow oracle, but the payload shape is a token browser, not a trading feed. It
  would have been a false finding; their actual quote host (`quotes.truefinance.ai`,
  a Fastify server) never revealed a working path.
- **Brokex's `/markets` showed an `updatedAt` 53 minutes stale** — which looked
  like an enormous lag until `/protocol-info` said testnet.

## The measurements

Level test against Binance USDT-M perp over websocket, same method and guards as
`research/lead-lag/`. Self-control reads **+0ms at 99% well depth**; placebo at
+90s finds nothing (6% well depth against 36–69% for the real results).

### Katana Perps — 7 min, 579 reference ticks

| feed | changes | lag vs Binance | fit | well |
|---|---|---|---|---|
| **index** | 207 | **+5000ms** | $1.96 | 51% |
| book mid | 1398 | +1100ms | $2.07 | 55% |
| mark | 59 | +300ms | $2.48 | 69% |

A separate 11.5-minute run put the index at **+6100ms**. So the index genuinely
trails by 5–6 seconds, republishing every ~4.8s. That is larger than Hotstuff's
4.9s and the biggest lag measured in this repo.

**It is not reachable, for two independent reasons.**

First, the same structural reason as every other order-book venue: you fill
against the book, and the book lags only 1.1s while the mark lags 300ms. The
5–6s index governs funding, margin and liquidation, not fills.

Second, and decisive on its own — top of book over 1398 samples:

| | median | p90 |
|---|---|---|
| bid depth | **$344** | $1,788 |
| ask depth | **$413** | $4,815 |
| spread | $1.00 (0.1bp) | $2.00 |

The spread is genuinely tight. There is simply almost nothing behind it. A
six-second oracle lag in front of $413 of asks is not a trade.

### Arcus — 11.5 min

| feed | cadence | lag vs Binance | fit | well |
|---|---|---|---|---|
| oracle | 603ms | +300ms | $2.85 | 63% |
| mark | 604ms | +400ms | $3.01 | 54% |
| last trade | 5713ms | +100ms | $6.08 | 37% |

Everything is fast; there is no lag to speak of. What Arcus does have is a
**persistent basis: mark sits $55.10 (7.2bp) above oracle, and above it 100% of
the time** across 749 samples, p5 $50.50 to p95 $60.70. That is a structural
offset, not a lag — both legs carry the same ~300–400ms delay — so there is
nothing to arbitrage between them. Worth knowing if you trade there, because
your mark-to-market and your liquidation price are 7bp apart by construction.

Arcus also geo-blocks: `api.arcus.xyz/v1/compliance` returned
`{"country":"US","restrictions":{"perpetuals":true}}`.

### Ondo Perps

Reachable (`api.ondoperps.xyz/v1/markets`, `wss://api.ondoperps.xyz/ws`) but the
perp markets are tokenized equities — SPYon, AAPL and similar — not a BTC market
comparable to the rest, so it is outside this screen.

## The pattern, again

This is the fourth time in this session the same shape has appeared, and it is
now hard to read as coincidence:

> The size of a venue's oracle lag and your ability to trade it are inversely
> related.

Hotstuff: 4.9s lag, order-book venue, book tracks Binance within 550ms. Ostium:
sub-second lag but the oracle *is* the fill price, so it is defended with a
spread and a reaction-time window you cannot beat. Katana: 5–6s lag, the biggest
yet, behind $413 of asks.

A venue can afford a slow oracle precisely when nothing valuable settles against
it. The moment the oracle matters for fills, it stops being slow — or the venue
stops being solvent.

## Reproducing

```
node discover.js     # grep frontends and bundles for API hosts
node netcap.js       # load each app in a browser, record its real network calls
node newvenues.js    # capture oracle/mark/last against a Binance perp reference
node newvlag.js      # level test with self-control and placebo
node katbook.js      # Katana book, mark, index and top-of-book depth
```

## Caveats

- Single sessions of 7 and 11.5 minutes on a quiet tape. Polling spot for the
  reference gave only 8 price changes in 50 seconds, which is why the reference
  is the perp websocket.
- Depth is top-of-book only. Katana's full book may hold more further out, but
  the measured spread of 0.1bp means anything deeper is at a materially worse
  price.
- `netcap.js` runs with `ignoreHTTPSErrors` because this sandbox's proxy
  certificate is not in Chromium's trust store. Fine for reading public market
  data; these responses are not certificate-verified.
- "Nothing reachable" means nothing reachable *from here, in one pass*. A venue
  in that row may well have a perfectly good API behind a wallet connection or a
  region this sandbox cannot reach.

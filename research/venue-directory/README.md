# Perp DEX directory — who exists, and who is actually live

Pulled 2026-09-17 from DefiLlama's protocol registry (`api.llama.fi/protocols`,
category `Derivatives`), then every listed site was fetched to check it responds.
Volume data now sits behind DefiLlama's paid plan, so this ranks by *recency and
liveness*, not size.

**448 protocols** carry a derivatives category. **43 were listed in 2026**, and
**39 of those have a live site**.

## Tested first-hand in this repo

These were measured directly — funding pulled and normalised, order books
walked, index feeds raced. See `research/funding-spreads/`,
`research/venue-architecture/` and `research/index-replication/`.

| venue | model | index / oracle source | funding settles |
|---|---|---|---|
| Hyperliquid | order book | own validators, weighted median of 7 CEX spot books | 1h |
| dYdX v4 | order book | Slinky/Connect sidecar | 1h |
| Lighter | order book | Chainlink + Stork + Pyth | 1h |
| Backpack | order book | in-house composite | 1h |
| Extended | order book | in-house composite | 1h |
| Paradex | order book | in-house composite | 8h |
| Aster | order book | in-house composite | 8h |
| ApeX Omni | order book | in-house composite | 1h |
| GRVT | order book | in-house composite (quotes percent) | 8h |
| Hibachi | order book | in-house composite | 1h |
| Orderly | order book (REST book auth-gated) | volume-weighted CEX average | 8h |
| Aevo | order book | in-house composite | 1h |
| Ostium | pool / oracle execution | Stork | — |
| Hotstuff | order book | weighted median of 9 venues, MAD filtered | 2h |
| Bullbit | order book | CEX composite | — |

## Listed in 2026 — the current wave

`site` is the HTTP status of the protocol's own URL as of 2026-09-17.

| listed | venue | chain | site |
|---|---|---|---|
| 2026-09-08 | VS Trade | Robinhood Chain | no url |
| 2026-09-07 | TRUE DEX | Solana | 200 |
| 2026-09-07 | Jetbit | BNB | no url |
| 2026-09-07 | Polymarket Perps | — | 200 |
| 2026-09-02 | Strat Perps | Strat | 200 |
| 2026-08-31 | HertzFlow | BNB | 200 |
| 2026-08-27 | Arcus pTokens | Robinhood Chain | 200 |
| 2026-08-21 | Drake Exchange | Monad | 200 |
| 2026-08-05 | Meridian Perps | Robinhood Chain | 200 |
| 2026-07-31 | AZverse Perps | multi | no url |
| 2026-07-28 | Katana Perps | Katana | 200 |
| 2026-07-18 | AFX LP | AFX L1 | 200 |
| 2026-07-14 | Wikicious | Arbitrum | 200 |
| 2026-07-10 | Arcus Perps | Robinhood Chain | 200 |
| 2026-07-03 | Rubin Trade | multi | no url |
| 2026-06-25 | WaterX | Sui | 200 |
| 2026-06-22 | OBSDN | Monad | 200 |
| 2026-06-09 | Ondo Perps | — | 200 |
| 2026-06-08 | BULK | Solana | 200 |
| 2026-06-04 | Brokex | multi | 200 |
| 2026-05-22 | Likwid | multi | 200 |
| 2026-05-21 | Challenge4Trading Perp | Arbitrum | **dead** |
| 2026-05-19 | Flamix | Flare | 200 |
| 2026-05-15 | Euphoria Finance | MegaETH | 200 |
| 2026-05-06 | RISEx | RISE | 200 |
| 2026-05-05 | UpDown | Celo | 200 |
| 2026-04-20 | Bounce.Tech | Hyperliquid L1 | 200 |
| 2026-04-09 | Tristero Margin | multi | 200 |
| 2026-04-03 | Bullbit | Base | 200 |
| 2026-03-31 | Hotstuff | — | 200 |
| 2026-03-28 | Phoenix Perp | — | 200 |
| 2026-03-24 | Rocket Perp | — | 200 |
| 2026-03-17 | YLD | Ethereum | 451 (geo-blocked) |
| 2026-03-10 | Perpl | Monad | 200 |
| 2026-03-06 | 2xSwap | Ethereum | 200 |
| 2026-02-26 | Decibel | Aptos | 200 |
| 2026-02-18 | Normal | Stellar | 200 |
| 2026-02-10 | 100XSOON | Base | 200 |
| 2026-01-30 | Denaria | Linea | 200 |
| 2026-01-24 | Sai | Nibiru | 200 |
| 2026-01-23 | GMTrade | Solana | 200 |
| 2026-01-09 | Corex Markets | CORE | 200 |
| 2026-01-08 | Mooncake | Solana | 200 |

## Listed in 2025 — the cohort that matured

62 protocols. The ones that became significant: **Paradex**, **edgeX**,
**Orderly**, **Extended**, **Pacifica**, **Ethereal**, **Bluefin Pro**,
**SYMMIO**, **Boros** (funding-rate trading, not perps proper), **Antarctic**.

The long tail: Monday Trade, LeverUp, Fufuture, Astros, DipCoin, TurboFlow,
Rho X, Sharwa, foxify, Velar, GOATUP, Artura, Somnex, Mjolnir, Evedex, Elys,
K-BIT, Ostrich, YieldFlow-YTrade, Volta, Alkimiya, Racks, Stobix, Perpstreet,
TaraPerps, Sypher, SeedFi, LuckyFuture, Cyclo, Plaza, Superp, ZO Perps, Typus,
Mirage, RollX, Tea-REX, Golden Finance, Bumpin Trade, RFX V2, Flex Perpetuals,
SIR, Electra.

## Patterns worth noting

- **Robinhood Chain is a real venue cluster now** — Arcus, Meridian, VS Trade
  and a Lighter deployment all list against it.
- **Monad and MegaETH are attracting perp launches** — Drake, OBSDN, Perpl on
  Monad; Euphoria on MegaETH.
- **Order books have won.** Almost everything new is a CLOB. The peer-to-pool
  model (GMX, Gains, Ostium, Avantis, Jupiter) is now a minority of new launches.
- **A listing is not a venue.** One of the 43 already has a dead site, several
  have no URL registered at all, and DefiLlama lists anything that reports. Treat
  this as a candidate list to verify, not a recommendation.

## Caveats

- Ranking by volume was not possible — DefiLlama's volume endpoints returned 402
  (paid plan) on 2026-09-17. Liveness here means "the website answered", which is
  a much weaker signal than real open interest.
- A live site says nothing about liquidity, security, or whether withdrawals
  work. Nothing here has been assessed for counterparty risk.
- Category membership is DefiLlama's, and `Derivatives` mixes perps with options
  and structured products. Boros, for example, trades funding rates rather than
  perps.

## Reproducing

```
node directory.js     # pulls the registry and checks every listed site
```

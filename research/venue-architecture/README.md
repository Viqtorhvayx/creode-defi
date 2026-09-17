# Who is your counterparty on a perp DEX?

Two designs, and the difference decides who takes the other side of your trade.

**Peer-to-peer (central limit order book).** Your order matches against other
traders' resting limit orders. The protocol is a matching engine, not a
counterparty. Price discovery happens on the book; the oracle is only used for
funding, margin and liquidation.

**Peer-to-pool.** There is no book. You trade against a shared LP vault at a
price the oracle hands down, and the vault is the counterparty to every
position. LP returns are the mirror image of trader PnL.

## The empirical test

A peer-to-peer venue has a real book you can fetch: many distinct price levels
posted by independent makers. A pool venue has nothing to fetch, because there
is nothing there — just a single quoted price. `books.js` runs that test.

Measured 2026-09-17 on BTC (level counts are capped by each API, so they are a
floor on real book size, not its extent):

| venue | bid levels | ask levels | model |
|---|---|---|---|
| Extended | 3657 | 2877 | order book |
| Backpack | 2449 | 2169 | order book |
| dYdX v4 | 100 | 100 | order book |
| Lighter | 100 | 100 | order book |
| Aster | 100 | 100 | order book |
| ApeX Omni | 100 | 100 | order book |
| Paradex | 100 | 71 | order book |
| GRVT | 50 | 50 | order book |
| Hyperliquid | 20 | 20 | order book *(API caps at 20)* |
| Hibachi | 20 | 20 | order book |
| Orderly | auth-gated | auth-gated | order book — REST needs an account header |
| Ostium | none | single quoted price | pool / oracle execution |
| Gains (gTrade) | none | gDAI / gUSDC vaults | pool / oracle execution |

Also peer-to-pool, not probed here: GMX, Jupiter (JLP), Avantis, Levana, HMX,
Adrena.

## Caveats worth keeping

- **An order book does not guarantee your counterparty is another retail
  trader.** Most flow on these venues is matched by professional market makers.
  "Peer-to-peer" means the protocol is not systematically on the other side, not
  that a human took your trade.
- **Some venues run a protocol vault that also makes markets.** Hyperliquid's
  HLP and dYdX's MegaVault quote on their own books. They compete with other
  makers rather than being the mandated counterparty, which is the important
  difference from the pool model — but they are still protocol-owned capital
  taking the other side of some of your fills.
- **Level counts above are API response caps**, not a measure of depth. For
  actual depth at a price distance, see `research/funding-spreads/sizing.js`,
  which walks the books: within 10bp of mid, Hyperliquid held $3.5M of bids
  against dYdX's $30k.

## Reproducing

```
node books.js
```

# Market making Katana Perps: measured, and it loses money

**Result: negative in all six markets measured.** Adverse selection exceeds the
half-spread everywhere, before inventory risk, latency or infrastructure.

This tested an idea I raised myself after seeing Katana quote a 0.1bp spread on
$400 of depth: a tight spread with almost nobody in the book looked like a venue
crying out for a market maker. That reasoning was wrong, and the way it was
wrong is the useful part.

## The economics

Per dollar of maker volume you earn half the spread, pay the maker fee, and lose
adverse selection — the tendency to get filled precisely when the price is about
to move against you. Measured from Katana's own prints: every fill carries
`makerSide`, so if a taker lifts the maker's ask, the maker is short, and a
rising mid afterwards is their loss.

25-minute capture, book polled at 400ms, fills scored only where they fall
inside the book series.

The analysis was run twice on the same capture, the second time after the write
stream had fully flushed and so with more fills scored. Both are shown, because
the difference is the honest measure of how firm these numbers are.

| market | half-spread | fee | net (run A) | net (run B) | fills A / B |
|---|---|---|---|---|---|
| BTC-USD | 0.07bp | 0.48 | −1.60bp | **−2.02bp** | 128 / 164 |
| ETH-USD | 0.41bp | 0.48 | −0.39bp | **−0.31bp** | 25 / 28 |
| HYPE-USD | 1.24bp | 0.48 | −3.02bp | **−2.70bp** | 22 / 24 |
| SOL-USD | 1.00bp | 0.48 | −1.69bp | **−1.90bp** | 21 / 22 |
| XRP-USD | 0.77bp | 0.48 | −2.43bp | **−2.72bp** | 23 / 29 |
| ZEC-USD | 0.87bp | 0.48 | −1.36bp | **−0.15bp** | 32 / 36 |

**The sign is stable in all six markets across both runs. The magnitude is not.**
ZEC moved from −1.36bp to −0.15bp on four extra fills, which says plainly that a
30-odd fill sample cannot pin a per-market number. Only BTC, at 164 fills, is
reasonably stable — and it is the most negative of the six.

So the finding to carry away is the direction and the mechanism, not any single
figure: adverse selection at 30s runs 0.25–3.47bp against a half-spread of
0.07–1.24bp, and exceeds everything you earn in every market measured.

## BTC is the worst market, not the best

BTC's tick size is $1.00 and the spread sits at exactly one tick — 0.13bp. The
maker fee round trip is 0.95bp, or $7.26 on a $76,400 contract. **The spread
covers the fee 0.2% of the time.** You would need a seven-tick spread to break
even on fees alone, before adverse selection.

Across all nine markets, the tick size is what determines whether a profitable
quote is even legal:

| market | spread | min possible spread (1 tick) | breakeven |
|---|---|---|---|
| BTC-USD | 0.13bp | 0.13bp | 0.95bp |
| ZEC-USD | 2.38bp | 0.07bp | 0.95bp |
| ETH-USD | 1.23bp | 0.41bp | 0.95bp |
| TAO-USD | 5.71bp | 0.44bp | 0.95bp |
| XRP-USD | 2.30bp | 0.77bp | 0.95bp |
| SOL-USD | 1.00bp | 1.00bp | 0.95bp |
| DOGE-USD | 4.90bp | 1.23bp | 0.95bp |
| HYPE-USD | 2.50bp | 1.25bp | 0.95bp |
| KAT-USD | 7.02bp | 2.34bp | 0.95bp |

Where the minimum legal spread is below breakeven (BTC, ZEC, ETH, TAO, XRP),
competitors can quote you into a loss. Where it is above (SOL, DOGE, HYPE, KAT),
the tick protects the spread — but the adverse selection measured there is worse
than the protection is worth.

## Why the premise was wrong

**Katana launched with GSR, Selini Capital and Auros as market makers.** The
one-or-two orders at top of book are not an absence of competition. They are
three of the largest market-making firms in crypto, quoting a new venue thinly
because that is the correct response to uncertain flow.

A tight spread is not an opening for a maker. It is the incumbents telling you
what they are willing to be paid for the risk — and they have the speed to
cancel into a move that you do not.

Fees compound it. The published defaults are 0.01% maker / 0.04% taker; the live
API returns **0.00475% / 0.019%**, already promotionally halved. The docs note
that "trade fees can be negative for promotional purposes," so a maker rebate is
possible in principle, but no scope currently returns one. At a positive maker
fee there is no rebate to offset adverse selection.

## A correction

An earlier, thinner pass on this data reported ZEC-USD with **favourable**
adverse selection (−1.77bp at 30s) and a net of +1.66bp, and I described it as a
real signal worth chasing. It was not. Those fills came from the 50-trade
backfill the trades endpoint returns on first call, which predates the book
series, so most could not be scored and the few that could were noise. Once the
backfill is discarded and only fills inside the book window are counted, ZEC
reads **+1.76bp adverse, net −1.36bp** — the opposite sign.

Relatedly, an early look at BTC trade sizes (median $252, p90 $298) suggested
wash trading. Across the full sample the size distributions are fat-tailed in
every market (6.5x to 984x between p10 and p90), which reads as organic flow.
Informed organic flow is precisely what produces the adverse selection above.

## What would change the answer

- **A negative maker fee.** The docs allow it. At −0.48bp instead of +0.48bp the
  swing is ~1bp, which would bring ETH close to breakeven and nothing else.
- **Points.** Katana runs a Season 1 points programme rewarding liquidity
  contribution. If those points are worth more than the ~1–3bp per dollar of
  volume you lose quoting, market making becomes a way to buy points at a known
  cost. That is an incentive-farming decision priced on expected token value,
  not a market-making decision, and it is not measurable from the API.
- **Being faster than GSR.** Not a plan.

## Reproducing

```
node katmm.js        # 25-min capture: book at 400ms, fills, across 6 markets
node katmmlag.js     # spread, fees, adverse selection at 2/5/15/30s, net edge
```

## Caveats

- 25 minutes, one session. Fill counts are 22–164 per market; only BTC's 164 is
  a comfortable sample. Re-running the analysis minutes apart moved ZEC's net by
  1.2bp, so treat every per-market figure as indicative. The direction is
  consistent across all six markets and both runs, which is what makes it
  believable — no individual number is.
- Adverse selection is measured against Katana's own mid, not against a fill you
  actually got. A real maker choosing when and where to quote would do somewhat
  better than a maker assumed to be at the touch continuously.
- Inventory risk, latency, cancel/replace costs and gas are all excluded. Every
  one of them makes the answer worse.

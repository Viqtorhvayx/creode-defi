# Trading bot: the validation layer first

Built from the Interactive Brokers + Python + Claude workflow in the reference
video. That video showed a Pine strategy with **14 trades over 2.5 months at a
64% win rate, +12.12%**, and then wired it to an IBKR paper account.

Fourteen trades cannot tell an edge from a coin flip. `research/trader-outcomes/`
in this repo measured that directly: across 45,530 real accounts, past
performance predicted future performance at **−0.03** once account size was
removed. A short in-sample record is precisely the thing that does not carry.

So the validation layer is built before the execution layer, and the strategy is
pluggable so the harness never knows what it is testing.

## What is here

| file | does |
|---|---|
| `src/data.py` | cached OHLCV. Every module reads the same bytes, so two runs cannot silently disagree |
| `src/strategy.py` | the strategy interface, a baseline implementation, and a look-ahead detector |
| `src/backtest.py` | fills, costs, walk-forward folds, permutation test |

## The three things that stop a backtest lying

1. **Fills at the next bar's open**, never the close that produced the signal.
2. **Costs on every fill** — IBKR tiered $0.0035/share, $0.35 minimum, plus 2bp
   slippage. Turnover is the strongest correlate of losing in the account data,
   and cost is the mechanism.
3. **A look-ahead detector.** `check_no_lookahead()` recomputes signals on
   truncated history and requires the past not to change. A centred window, a
   backfill, a whole-sample normalisation — all of them show up here. It is the
   single check worth running before believing any number.

## First result: the baseline strategy fails, and that is the point

Trend-filtered channel breakout with an ATR trailing stop, on MU, 1,853 bars
from 2019-01-02 to 2026-05-15. Look-ahead check passes across 25 truncations.

| | |
|---|---|
| total return | **+242%** |
| CAGR | 18.2% |
| max drawdown | −28.0% |
| Sharpe | 0.76 |
| trades | 30 |
| win rate | 50% |

Which looks fine until it is asked the two questions that matter:

**Walk-forward — positive in all five folds, but one fold is the whole result:**

| fold | period | return | Sharpe | trades |
|---|---|---|---|---|
| 1 | 2019-01 → 2020-06 | +6.8% | 0.33 | 5 |
| 2 | 2020-06 → 2021-12 | +45.1% | 1.36 | 2 |
| 3 | 2021-12 → 2023-05 | +4.8% | 0.27 | 3 |
| 4 | 2023-06 → 2024-11 | +12.7% | 0.50 | 6 |
| 5 | 2024-11 → 2026-05 | **+191.8%** | 2.03 | 7 |

**Permutation test — beaten by random timing 21% of the time.** Same trade
count, same holding pattern, only the timing shuffled. p ≈ 0.21 is not
significance.

**Buy and hold over the same period returned +2,297%.** The strategy captured
about a tenth of simply owning the stock, while taking a 28% drawdown to do it.

So: the baseline is a bad strategy, it underperforms the asset by 10x, and it is
statistically indistinguishable from random entry timing. **The harness detected
all three.** That is the deliverable — a thing that can tell a real edge from a
lucky fortnight before money touches it.

## The baseline is a placeholder, not the video's strategy

The video's Pine source was not legible at the source resolution (480x270), so
`strategy.signals()` is a conventional trend-breakout standing in for it. It is
a real strategy rather than a stub so the harness has something honest to
measure, but it is **not** the strategy from the video and is not claimed to be.
Swapping in different rules means writing one `signals()` function.

## Not yet built: the execution layer

IB Gateway / TWS listens on `localhost:7497` on the trader's own machine, so the
live leg cannot run from a remote container. Once a strategy survives the
harness, the remaining pieces are the IBKR adapter (`ib_insync`), the
`morning_prefilter.py` universe screen, position sizing and the order loop — all
of which are mechanical next to the question of whether the edge is real.

## Running it

```
pip install yfinance pandas numpy ib_insync
cd tradingbot
python3 -c "
import sys; sys.path.insert(0,'src')
import data, strategy, backtest as bt
df = data.get_bars('MU','2019-01-01','2026-05-16')
print(strategy.check_no_lookahead(df))
print(bt.walk_forward(df, strategy.signals, folds=5))
print(bt.permutation_test(df, strategy.signals(df), n=200))
"
```

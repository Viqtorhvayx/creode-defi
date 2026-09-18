"""Strategy interface, plus one baseline implementation.

The point of the interface is that the validation harness never knows which
strategy it is testing. Swapping in the rules from the video — or any other set
— means writing one `signals()` function, not touching the backtest.

A strategy returns, for each bar, a target position in {-1, 0, +1} decided
ONLY from data available at that bar's close. Everything that makes backtests
lie lives in that sentence, so it is enforced rather than trusted: `signals()`
is handed a frame and must not look ahead, and `check_no_lookahead()` below
verifies it by recomputing on truncated history.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class Params:
    trend_len: int = 100      # bars for the regime filter
    breakout_len: int = 20    # bars for the entry channel
    atr_len: int = 14
    atr_stop: float = 2.0     # stop distance, in ATRs
    long_only: bool = True    # cash equities: shorting has borrow cost/locate risk


def atr(df: pd.DataFrame, n: int) -> pd.Series:
    h, l, c = df["High"], df["Low"], df["Close"]
    pc = c.shift(1)
    tr = pd.concat([h - l, (h - pc).abs(), (l - pc).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False).mean()


def signals(df: pd.DataFrame, p: Params | None = None) -> pd.Series:
    """Baseline: trend-filtered channel breakout with an ATR trailing stop.

    This is a PLACEHOLDER standing in for the video's Pine strategy, whose rules
    were not legible at the source video's 480x270. It is a real, conventional
    strategy rather than a stub, so the harness has something honest to measure —
    but it is not the strategy from the video and is not claimed to be.
    """
    p = p or Params()
    if len(df) < max(p.trend_len, p.breakout_len, p.atr_len) + 5:
        return pd.Series(0, index=df.index, dtype=int)

    c = df["Close"]
    trend = c.rolling(p.trend_len).mean()
    # shift(1): the channel must be the one that existed BEFORE this bar, or the
    # breakout is compared against a level that already includes the breakout.
    hi = df["High"].rolling(p.breakout_len).max().shift(1)
    lo = df["Low"].rolling(p.breakout_len).min().shift(1)
    a = atr(df, p.atr_len)

    pos = np.zeros(len(df), dtype=int)
    stop = np.nan
    for i in range(len(df)):
        if np.isnan(trend.iat[i]) or np.isnan(hi.iat[i]) or np.isnan(a.iat[i]):
            continue
        prev = pos[i - 1] if i else 0
        px = c.iat[i]

        if prev > 0:
            stop = max(stop, px - p.atr_stop * a.iat[i])
            pos[i] = 0 if px <= stop else 1
        elif prev < 0:
            stop = min(stop, px + p.atr_stop * a.iat[i])
            pos[i] = 0 if px >= stop else -1

        if pos[i] == 0:
            if px > hi.iat[i] and px > trend.iat[i]:
                pos[i] = 1
                stop = px - p.atr_stop * a.iat[i]
            elif not p.long_only and px < lo.iat[i] and px < trend.iat[i]:
                pos[i] = -1
                stop = px + p.atr_stop * a.iat[i]
    return pd.Series(pos, index=df.index, dtype=int)


def check_no_lookahead(df: pd.DataFrame, p: Params | None = None, probes: int = 25) -> tuple[bool, str]:
    """Recompute signals on truncated history and require the past not to change.

    A strategy that peeks — a centred rolling window, a fillna(method='bfill'),
    a normalisation over the whole sample — produces different signals for bar
    i depending on whether bars after i were present. This catches that, and it
    is the single check worth running before believing any backtest number.
    """
    full = signals(df, p)
    n = len(df)
    if n < 150:
        return True, "too short to probe"
    rng = np.random.default_rng(0)
    for cut in rng.choice(np.arange(120, n), size=min(probes, n - 120), replace=False):
        cut = int(cut)
        part = signals(df.iloc[:cut], p)
        if not full.iloc[:cut].equals(part):
            first = (full.iloc[:cut] != part).idxmax()
            return False, f"signals changed at {first} when later bars were removed (cut={cut})"
    return True, f"clean across {min(probes, n - 120)} truncations"

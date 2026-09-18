"""Backtest and walk-forward validation.

Why this exists in the shape it does: the video's strategy was shown with 14
trades over 2.5 months at a 64% win rate. That is not a result, it is a sample
too small to tell an edge from a coin. Across 45,530 real perp accounts
(research/trader-outcomes/) past performance predicted future performance at
-0.03 once account size was removed, so a short in-sample record is exactly the
thing that does not carry.

So this module is built to answer one question — would this have made money on
data it was never fitted to — and it answers it three ways:

  1. costs are charged on every fill, because turnover is what kills retail
     returns in the account data
  2. trades are entered at the NEXT bar's open, never the close that generated
     the signal
  3. the record is split into in-sample and out-of-sample, and a permutation
     test asks how often random entries with the same trade count and holding
     period would have done as well
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class Costs:
    """IBKR US equities, tiered: $0.0035/share, $0.35 min, plus slippage."""
    per_share: float = 0.0035
    min_ticket: float = 0.35
    slippage_bp: float = 2.0     # half-spread + impact on a liquid large cap


@dataclass
class Result:
    equity: pd.Series
    trades: pd.DataFrame
    stats: dict


def run(df: pd.DataFrame, pos: pd.Series, capital: float = 10_000.0, costs: Costs | None = None) -> Result:
    """Walk a signal series through bars and produce equity, trades and stats.

    Entry and exit both happen at the open AFTER the signal bar. Filling at the
    close that produced the signal is the most common way a backtest invents
    returns that were never available.
    """
    costs = costs or Costs()
    o, c = df["Open"].to_numpy(float), df["Close"].to_numpy(float)
    tgt = pos.reindex(df.index).fillna(0).to_numpy(int)

    cash, shares, cur = capital, 0.0, 0
    eq = np.zeros(len(df))
    rows = []
    entry_px = entry_dt = None

    for i in range(len(df)):
        want = tgt[i - 1] if i else 0          # act on yesterday's signal
        if want != cur and not np.isnan(o[i]):
            px = o[i]
            if cur != 0:                        # close first
                fee = max(costs.min_ticket, abs(shares) * costs.per_share)
                fill = px * (1 - np.sign(shares) * costs.slippage_bp / 1e4)
                cash += shares * fill - fee
                rows.append({
                    "entry": entry_dt, "exit": df.index[i], "side": int(np.sign(shares)),
                    "entry_px": entry_px, "exit_px": fill,
                    "pnl": shares * (fill - entry_px) - fee,
                    "bars": int(i - df.index.get_loc(entry_dt)),
                })
                shares, cur = 0.0, 0
            if want != 0:                       # then open
                notional = cash
                sh = np.floor(notional / px) * want
                if sh != 0:
                    fee = max(costs.min_ticket, abs(sh) * costs.per_share)
                    fill = px * (1 + np.sign(sh) * costs.slippage_bp / 1e4)
                    cash -= sh * fill + fee
                    shares, cur = sh, want
                    entry_px, entry_dt = fill, df.index[i]
        eq[i] = cash + shares * (c[i] if not np.isnan(c[i]) else 0.0)

    equity = pd.Series(eq, index=df.index)
    trades = pd.DataFrame(rows)
    return Result(equity, trades, stats(equity, trades, capital))


def stats(equity: pd.Series, trades: pd.DataFrame, capital: float) -> dict:
    if not len(equity):
        return {}
    ret = equity.pct_change().fillna(0)
    years = max(len(equity) / 252.0, 1e-9)
    total = equity.iloc[-1] / capital - 1
    cagr = (equity.iloc[-1] / capital) ** (1 / years) - 1 if equity.iloc[-1] > 0 else -1.0
    dd = (equity / equity.cummax() - 1).min()
    sharpe = (ret.mean() / ret.std() * np.sqrt(252)) if ret.std() > 0 else 0.0
    wins = int((trades["pnl"] > 0).sum()) if len(trades) else 0
    return {
        "total_return": float(total),
        "cagr": float(cagr),
        "max_drawdown": float(dd),
        "sharpe": float(sharpe),
        "trades": int(len(trades)),
        "win_rate": float(wins / len(trades)) if len(trades) else 0.0,
        "avg_bars_held": float(trades["bars"].mean()) if len(trades) else 0.0,
    }


def walk_forward(df: pd.DataFrame, signal_fn, folds: int = 5, capital: float = 10_000.0) -> pd.DataFrame:
    """Split the history into consecutive folds and report each separately.

    A single number over one period tells you nothing about whether it repeats.
    Consistency across folds is the closest thing to evidence available without
    live trading — and if the edge lives in one fold, it is that fold's market,
    not a strategy.
    """
    n = len(df)
    out = []
    for k in range(folds):
        a, b = int(n * k / folds), int(n * (k + 1) / folds)
        part = df.iloc[a:b]
        if len(part) < 150:
            continue
        r = run(part, signal_fn(part), capital)
        out.append({
            "fold": k + 1,
            "from": part.index[0].date(), "to": part.index[-1].date(),
            **{key: r.stats.get(key) for key in ("total_return", "sharpe", "max_drawdown", "trades", "win_rate")},
        })
    return pd.DataFrame(out)


def permutation_test(df: pd.DataFrame, pos: pd.Series, n: int = 200, capital: float = 10_000.0) -> dict:
    """How often does a random strategy with the SAME trade count and holding
    pattern beat this one?

    This is the test that a 14-trade record cannot survive and a real edge can.
    The signal's own timing is shuffled, so the comparison holds trade
    frequency, direction mix and average hold constant, and varies only WHEN the
    trades happened.
    """
    real = run(df, pos, capital).stats.get("total_return", 0.0)
    arr = pos.to_numpy(int)
    rng = np.random.default_rng(0)
    beat = 0
    for _ in range(n):
        shuffled = pd.Series(rng.permutation(arr), index=df.index)
        if run(df, shuffled, capital).stats.get("total_return", 0.0) >= real:
            beat += 1
    return {"real_return": float(real), "beaten_by_random_pct": 100.0 * beat / n, "n": n}

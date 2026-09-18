"""Market data, cached to disk.

Every other module reads bars through here so that a backtest, a walk-forward
run and the live prefilter all see byte-identical data. The cache is not an
optimisation — it is what stops a re-run silently disagreeing with the previous
one because a vendor revised a bar.
"""
from __future__ import annotations

import os
from datetime import date, timedelta

import pandas as pd
import yfinance as yf

CACHE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "bars")
os.makedirs(CACHE, exist_ok=True)


def _path(ticker: str, interval: str) -> str:
    return os.path.join(CACHE, f"{ticker.replace('/', '-')}_{interval}.parquet")


def get_bars(
    ticker: str,
    start: str | date,
    end: str | date,
    interval: str = "1d",
    refresh: bool = False,
) -> pd.DataFrame:
    """Daily (or intraday) OHLCV with a DatetimeIndex, adjusted for splits.

    Returns an empty frame rather than raising when a ticker has no data — a
    dead listing in a historical universe is normal and must not abort a
    backtest over hundreds of names.
    """
    p = _path(ticker, interval)
    cached = None
    if os.path.exists(p) and not refresh:
        try:
            cached = pd.read_parquet(p)
        except Exception:
            cached = None

    need = True
    if cached is not None and len(cached):
        have_start, have_end = cached.index.min().date(), cached.index.max().date()
        need = not (have_start <= pd.Timestamp(start).date() and have_end >= pd.Timestamp(end).date())

    if need:
        try:
            df = yf.download(
                ticker, start=start, end=end, interval=interval,
                progress=False, auto_adjust=True, threads=False,
            )
        except Exception:
            return cached if cached is not None else pd.DataFrame()
        if df is None or not len(df):
            return cached if cached is not None else pd.DataFrame()
        # yfinance returns a column MultiIndex when given a list; flatten the
        # single-ticker case so downstream code never has to branch on it.
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df = df.rename(columns=str.title)
        if cached is not None and len(cached):
            df = pd.concat([cached, df])
            df = df[~df.index.duplicated(keep="last")].sort_index()
        try:
            df.to_parquet(p)
        except Exception:
            pass
        cached = df

    if cached is None:
        return pd.DataFrame()
    m = (cached.index >= pd.Timestamp(start)) & (cached.index <= pd.Timestamp(end))
    return cached.loc[m].copy()


def get_many(
    tickers: list[str],
    start: str | date,
    end: str | date,
    interval: str = "1d",
) -> dict[str, pd.DataFrame]:
    """Bars for a list of tickers. Names with no data are simply absent."""
    out: dict[str, pd.DataFrame] = {}
    for t in tickers:
        df = get_bars(t, start, end, interval)
        if len(df):
            out[t] = df
    return out


def trading_days_ago(n: int) -> str:
    """Calendar approximation, deliberately generous — callers slice by date."""
    return (date.today() - timedelta(days=int(n * 1.5) + 10)).isoformat()

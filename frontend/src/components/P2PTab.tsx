import React, { useState, useEffect, useCallback } from 'react';
import { P2PCandleChart, type MarketStats } from './P2PCandleChart';
import { MarketSelector } from './MarketSelector';
import { OrderBook } from './OrderBook';
import { CircleNotch, CheckCircle } from '@phosphor-icons/react';
import { useWalletClient, useAccount } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { createLimitOrder, marketFill, fetchBook, fillOrderById, cancelOrder, fetchBalance, fetchTrades, type OpenOrder, type Trade } from '../lib/p2p';
import { getPair, fetchPairStats, formatVolume, formatPrice, type PairStat, type Timeframe } from '../lib/market';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeTradeMode, setActiveTradeMode] = useState<'Market' | 'Limit'>('Market');
  const [activeInterval, setActiveInterval] = useState<Timeframe>('1H');
  const [selectedPairId, setSelectedPairId] = useState<string>('HBAR-USDC');
  const [activeChartTab, setActiveChartTab] = useState<'Market Overview' | 'Order Book'>('Market Overview');
  const [activeOrderTab, setActiveOrderTab] = useState<'Orders' | 'Trades' | 'Open Peer Orders'>('Orders');
  const [tradeSide, setTradeSide] = useState<'Long' | 'Short'>('Long');
  const [payAmount, setPayAmount] = useState<string>('1500');
  const [priceAmount, setPriceAmount] = useState<string>('0.0815');
  const [posSize, setPosSize] = useState<number>(10);

  // On-chain P2P order wiring.
  const { isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [txState, setTxState] = useState<'idle' | 'pending' | 'done'>('idle');

  // Selected market + real price data.
  const pair = getPair(selectedPairId);
  const [pairStats, setPairStats] = useState<Record<string, PairStat>>({});
  const [mkt, setMkt] = useState<MarketStats | null>(null); // live price/high/low/change from the chart feed
  const stat = pairStats[selectedPairId];
  // Long pays the quote token to buy base; Short pays (sells) the base token.
  const payTokenSym = tradeSide === 'Long' ? pair.quote : pair.base;
  const payTokenIcon = tradeSide === 'Long' ? pair.quoteIcon : pair.baseIcon;
  const recvSym = tradeSide === 'Long' ? pair.base : pair.quote;

  // Real 24h volume/change for every market (drives the selector badges).
  useEffect(() => {
    let alive = true;
    const load = () => fetchPairStats().then((s) => { if (alive) setPairStats(s); }).catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Real balance of the token the user pays with.
  const [payBalance, setPayBalance] = useState<number | null>(null);
  useEffect(() => {
    setPayBalance(null);
    if (!isConnected || !address) return;
    let alive = true;
    fetchBalance(address, payTokenSym).then((b) => { if (alive) setPayBalance(b); }).catch(() => {});
    return () => { alive = false; };
  }, [isConnected, address, payTokenSym]);

  // Live "Open Peer Orders" book straight from the CreodeP2P contract.
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const myAddr = (address || '').toLowerCase();

  const loadOrders = useCallback(async () => {
    try {
      const list = await fetchBook(selectedPairId);
      setOpenOrders(list.filter((o) => o.side !== 'Other'));
    } catch (e) {
      console.error('[P2P] failed to load open orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedPairId]);

  useEffect(() => {
    setOrdersLoading(true);
    loadOrders();
    const t = setInterval(loadOrders, 10_000);
    return () => clearInterval(t);
  }, [loadOrders]);

  // Recent on-chain fills (Trades tape).
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setTradesLoading(true);
    const load = () => fetchTrades(selectedPairId)
      .then((t) => { if (alive) setTrades(t); })
      .catch(() => {})
      .finally(() => { if (alive) setTradesLoading(false); });
    load();
    const t = setInterval(load, 15_000);
    return () => { alive = false; clearInterval(t); };
  }, [selectedPairId]);

  // Clicking an order-book row pre-fills the limit price.
  const usePrice = (price: number) => {
    setPriceAmount(String(price));
    setActiveTradeMode('Limit');
  };

  // Take (fill) another maker's resting order — pay its full remaining buy side.
  const takeOrder = async (o: OpenOrder) => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    setBusyId(o.id);
    try {
      await fillOrderById(walletClient, o, o.buyRemaining);
      await loadOrders();
    } catch (e) {
      const err = e as any;
      console.error('[P2P] fill failed:', err);
      alert('Fill failed: ' + (err?.reason || err?.shortMessage || err?.message || 'Unknown error'));
    } finally {
      setBusyId(null);
    }
  };

  // Cancel the connected user's own resting order (refunds escrow).
  const cancelMyOrder = async (o: OpenOrder) => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    setBusyId(o.id);
    try {
      await cancelOrder(walletClient, o.id);
      await loadOrders();
    } catch (e) {
      const err = e as any;
      console.error('[P2P] cancel failed:', err);
      alert('Cancel failed: ' + (err?.reason || err?.shortMessage || err?.message || 'Unknown error'));
    } finally {
      setBusyId(null);
    }
  };

  const fmtNum = (n: number, max = 4) => n.toLocaleString(undefined, { maximumFractionDigits: max });

  const submitOrder = async () => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    const amt = parseFloat(String(payAmount).replace(/,/g, ''));
    if (!amt || amt <= 0) { alert('Enter an amount.'); return; }
    setTxState('pending');
    try {
      if (activeTradeMode === 'Limit') {
        const price = parseFloat(String(priceAmount).replace(/,/g, ''));
        if (!price || price <= 0) { alert('Enter a limit price.'); setTxState('idle'); return; }
        await createLimitOrder(walletClient, selectedPairId, tradeSide, amt, price);
      } else {
        await marketFill(walletClient, selectedPairId, tradeSide, amt);
      }
      setTxState('done');
      loadOrders();
      setTimeout(() => setTxState('idle'), 4000);
    } catch (e) {
      const err = e as any;
      console.error('[P2P] order failed:', err);
      alert('Order failed: ' + (err?.reason || err?.shortMessage || err?.message || 'Unknown error'));
      setTxState('idle');
    }
  };

  const orderBtnClass = (base: string) => `w-full text-white font-bold py-3.5 rounded-[8px] transition-colors text-[14px] shadow-sm flex items-center justify-center gap-2 ${base}`;
  const orderBtnColor = tradeSide === 'Long' ? 'bg-[#00c076] hover:bg-[#00ad6a]' : 'bg-[#ff5353] hover:bg-[#e04848]';
  const orderBtnContent = txState === 'done'
    ? (<><CheckCircle size={16} weight="fill" /> Order placed</>)
    : txState === 'pending'
      ? (<><CircleNotch size={16} weight="bold" className="animate-spin" /> Confirming…</>)
      : !isConnected ? 'Connect wallet' : tradeSide;

  // Match VaultTab colors
  const bgColor = theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-slate-100';
  
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const greenColor = '#00c076';
  const redColor = '#ff5353';

  // Real header numbers from the live feed (chart candles + market stats).
  const priceStr = mkt ? formatPrice(mkt.price) : '—';
  const chgVal = mkt?.change24h ?? stat?.change24h ?? 0;
  const chgStr = `${chgVal >= 0 ? '+' : ''}${chgVal.toFixed(2)}%`;
  const chgColor = chgVal >= 0 ? greenColor : redColor;
  const volStr = formatVolume(stat?.volume24h ?? 0);
  const highStr = mkt ? formatPrice(mkt.high24h) : '—';
  const lowStr = mkt ? formatPrice(mkt.low24h) : '—';

  // Estimated fill for the trade panel, from real inputs.
  const payNum = parseFloat(String(payAmount).replace(/,/g, '')) || 0;
  const priceNum = activeTradeMode === 'Limit'
    ? (parseFloat(String(priceAmount).replace(/,/g, '')) || 0)
    : (mkt?.price || 0);
  const recvEst = priceNum > 0 ? (tradeSide === 'Long' ? payNum / priceNum : payNum * priceNum) : 0;

  // The connected user's own open orders on this pair (for the Orders tab).
  const myOrders = openOrders.filter((o) => myAddr && o.maker.toLowerCase() === myAddr);

  return (
    <div className={`w-full flex flex-col gap-4 ${textMain}`}>
      
      {/* TOP TRADING BAR */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] p-4 flex items-center justify-between shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
        <div className="flex items-center gap-6">
          <MarketSelector pairId={selectedPairId} onSelect={setSelectedPairId} stats={pairStats} theme={theme} />

          <div className={`h-8 w-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>Mark Price</span>
              <span className="text-lg font-bold tracking-tight tabular-nums">{priceStr} <span className={`text-xs font-semibold ${textMuted}`}>{pair.quote}</span></span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h Change</span>
              <span className="text-sm font-bold tracking-tight tabular-nums" style={{ color: chgColor }}>{chgStr}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h Vol</span>
              <span className="text-sm font-bold tracking-tight tabular-nums">{volStr}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h High</span>
              <span className="text-sm font-bold tracking-tight tabular-nums">{highStr}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h Low</span>
              <span className="text-sm font-bold tracking-tight tabular-nums">{lowStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-6">
        
        {/* === LEFT & MIDDLE WRAPPER === */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Top Row: Market Chart Module */}
          <div className="w-full">
            <div className={`${cardBg} border ${borderColor} rounded-[16px] p-6 flex flex-col h-[620px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
              
              {/* Chart Tabs (Market Overview / Order Book) */}
              <div className={`flex items-center gap-6 border-b ${borderColor} mb-6`}>
                {['Market Overview', 'Order Book'].map((tab) => (
                  <div 
                    key={tab}
                    className={`pb-3 text-[14px] cursor-pointer relative transition-colors ${activeChartTab === tab ? 'text-[#00A8E8] font-bold' : textMuted + ' font-semibold hover:' + textMain}`}
                    onClick={() => setActiveChartTab(tab as any)}
                  >
                    {tab}
                    {activeChartTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                    )}
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold tracking-tight">{pair.base} / {pair.quote}</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-bold tracking-tight tabular-nums">{priceStr}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: chgColor }}>{chgStr}</span>
                  </div>
                </div>

                {activeChartTab === 'Market Overview' && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-full shadow-sm dark:shadow-none">
                      {(['15m', '1H', '4H', '1D', '1W'] as const).map((tf) => {
                        const active = activeInterval === tf;
                        return (
                          <button
                            key={tf}
                            onClick={() => setActiveInterval(tf)}
                            className={`text-[12px] font-bold transition-all duration-300 rounded-full py-1.5 px-3.5 tracking-wide border border-transparent ${
                              active
                                ? 'bg-transparent text-[#00A8E8] shadow-[inset_0_0_20px_rgba(0,168,232,0.35)]'
                                : theme === 'dark'
                                  ? 'text-white/40 hover:text-white hover:bg-white/5'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            {tf}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart / Order Book Area */}
              <div className="flex-1 w-full relative overflow-hidden flex flex-col mb-8">
                {activeChartTab === 'Market Overview' ? (
                  <P2PCandleChart theme={theme} pairId={selectedPairId} interval={activeInterval} onStats={setMkt} />
                ) : (
                  <OrderBook orders={openOrders} pair={pair} theme={theme} lastPrice={mkt?.price ?? stat?.price ?? 0} onPickPrice={usePrice} />
                )}
              </div>

              {/* Footer Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-auto">
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H High</span>
                  <span className="text-[15px] font-bold tracking-tight tabular-nums">{highStr}</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Low</span>
                  <span className="text-[15px] font-bold tracking-tight tabular-nums">{lowStr}</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Volume</span>
                  <span className="text-[15px] font-bold tracking-tight tabular-nums">{volStr}</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Change</span>
                  <span className="text-[15px] font-bold tracking-tight tabular-nums" style={{ color: chgColor }}>{chgStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Merged Tabs Panel (Spans across both Chart and Market Activity) */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col min-h-[300px] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            {/* Tabs */}
            <div className={`flex items-center px-3 pt-4 border-b ${borderColor}`}>
              {['Orders', 'Trades', 'Open Peer Orders'].map((tab) => (
                <div 
                  key={tab}
                  className={`px-3 pb-3 text-sm cursor-pointer relative ${activeOrderTab === tab ? 'text-white font-medium' : textMuted}`}
                  onClick={() => setActiveOrderTab(tab as any)}
                >
                  {tab}
                  {activeOrderTab === tab && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Table Content */}
            <div className="flex-1 overflow-hidden p-2">
              {activeOrderTab === 'Orders' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={textMuted}>
                      <th className="font-normal py-3 px-4">Pair</th>
                      <th className="font-normal py-3 px-4">Type</th>
                      <th className="font-normal py-3 px-4">Side</th>
                      <th className="font-normal py-3 px-4">Amount</th>
                      <th className="font-normal py-3 px-4">Price</th>
                      <th className="font-normal py-3 px-4">Status</th>
                      <th className="font-normal py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {myOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`py-10 text-center ${textMuted}`}>
                          {isConnected ? `No open ${pair.id} orders. Place a limit order to get started.` : 'Connect your wallet to see your orders.'}
                        </td>
                      </tr>
                    )}
                    {myOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="py-3 px-4 font-bold tracking-tight">{pair.id}</td>
                        <td className={`py-3 px-4 font-bold tracking-tight ${textMuted}`}>Limit</td>
                        <td className={`py-3 px-4 font-bold tracking-tight ${o.side === 'Short' ? 'text-[#ff5353]' : 'text-[#00c076]'}`}>{o.side}</td>
                        <td className="py-3 px-4 font-bold tracking-tight tabular-nums">{formatPrice(o.side === 'Short' ? o.sellRemaining : o.buyRemaining)} {pair.base}</td>
                        <td className="py-3 px-4 font-bold tracking-tight tabular-nums">{formatPrice(o.price)} {pair.quote}</td>
                        <td className="py-3 px-4 font-bold tracking-tight"><span className="text-[#3b82f6] font-bold tracking-tight">Open</span></td>
                        <td className="py-3 px-4 font-bold tracking-tight">
                          <button onClick={() => cancelMyOrder(o)} disabled={busyId === o.id} className="text-[10px] font-bold px-3 py-1.5 rounded bg-transparent border border-[#ff5353] text-[#ff5353] hover:bg-[#ff5353]/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1">
                            {busyId === o.id ? <CircleNotch size={11} weight="bold" className="animate-spin" /> : null}
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeOrderTab === 'Trades' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={textMuted}>
                      <th className="font-normal py-3 px-4">Side</th>
                      <th className="font-normal py-3 px-4 text-right">Price ({pair.quote})</th>
                      <th className="font-normal py-3 px-4 text-right">Amount ({pair.base})</th>
                      <th className="font-normal py-3 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {tradesLoading && trades.length === 0 && (
                      <tr><td colSpan={4} className={`py-10 text-center ${textMuted}`}><CircleNotch size={18} weight="bold" className="animate-spin inline-block mr-2 align-[-3px]" />Loading recent trades…</td></tr>
                    )}
                    {!tradesLoading && trades.length === 0 && (
                      <tr><td colSpan={4} className={`py-10 text-center ${textMuted}`}>No trades on this market yet.</td></tr>
                    )}
                    {trades.map((t, i) => (
                      <tr key={`${t.id}-${i}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className={`py-3 px-4 font-bold tracking-tight ${t.side === 'Short' ? 'text-[#ff5353]' : 'text-[#00c076]'}`}>{t.side === 'Short' ? 'Sell' : 'Buy'}</td>
                        <td className={`py-3 px-4 text-right font-bold tracking-tight tabular-nums ${t.side === 'Short' ? 'text-[#ff5353]' : 'text-[#00c076]'}`}>{formatPrice(t.price)}</td>
                        <td className="py-3 px-4 text-right font-bold tracking-tight tabular-nums">{formatPrice(t.amount)}</td>
                        <td className={`py-3 px-4 text-right font-semibold tabular-nums ${textMuted}`}>{t.time ? new Date(t.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeOrderTab === 'Open Peer Orders' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={textMuted}>
                      <th className="font-normal py-3 px-4">Maker</th>
                      <th className="font-normal py-3 px-4">Side</th>
                      <th className="font-normal py-3 px-4 text-right">Price (USDC)</th>
                      <th className="font-normal py-3 px-4 text-right">Available</th>
                      <th className="font-normal py-3 px-4">You Pay</th>
                      <th className="font-normal py-3 px-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {ordersLoading && openOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`py-10 text-center ${textMuted}`}>
                          <CircleNotch size={18} weight="bold" className="animate-spin inline-block mr-2 align-[-3px]" />
                          Loading open orders…
                        </td>
                      </tr>
                    )}
                    {!ordersLoading && openOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`py-10 text-center ${textMuted}`}>
                          No open peer orders yet. Place a limit order to get started.
                        </td>
                      </tr>
                    )}
                    {openOrders.map((o) => {
                      const mine = myAddr && o.maker.toLowerCase() === myAddr;
                      const initial = o.maker.slice(2, 3).toUpperCase();
                      // Base amount available to fill = sell side if maker is Short (sells BASE), else buy side.
                      const baseAvail = o.side === 'Short' ? o.sellRemaining : o.buyRemaining;
                      const baseSym = o.side === 'Short' ? o.sellSym : o.buySym;
                      return (
                        <tr key={o.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${mine ? 'bg-[#00A8E8]' : 'bg-[#8b5cf6]'} flex items-center justify-center text-white font-bold shrink-0`}>
                                {initial}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold tracking-tight">{mine ? 'You' : `${o.maker.slice(0, 6)}…${o.maker.slice(-4)}`}</span>
                                <span className={`text-[10px] ${textMuted}`}>Order #{o.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className={`py-3 px-4 font-bold tracking-tight ${o.side === 'Short' ? 'text-[#ff5353]' : 'text-[#00c076]'}`}>{o.side}</td>
                          <td className="py-3 px-4 text-right font-bold tracking-tight">${fmtNum(o.price)}</td>
                          <td className="py-3 px-4 text-right font-bold tracking-tight">{fmtNum(baseAvail)} {baseSym}</td>
                          <td className="py-3 px-4 text-[#3b82f6] font-bold tracking-tight">{fmtNum(o.buyRemaining)} {o.buySym}</td>
                          <td className="py-3 px-4 text-right">
                            {mine ? (
                              <button
                                onClick={() => cancelMyOrder(o)}
                                disabled={busyId === o.id}
                                className="text-[10px] font-bold px-3 py-1.5 rounded bg-transparent border border-[#ff5353] text-[#ff5353] hover:bg-[#ff5353]/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {busyId === o.id ? <CircleNotch size={11} weight="bold" className="animate-spin" /> : null}
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => takeOrder(o)}
                                disabled={busyId === o.id}
                                className="text-[10px] font-bold px-3 py-1.5 rounded bg-transparent border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {busyId === o.id ? <CircleNotch size={11} weight="bold" className="animate-spin" /> : null}
                                Fill
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>        {/* === RIGHT WRAPPER: Order Input Panel === */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full h-full">
          
          <div className="w-full h-full">
            <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] overflow-hidden min-h-[620px] h-auto`}>
              
              {/* Buy / Sell Toggle */}
              <div className="px-6 pt-6 pb-2">
                <div className="flex bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-sm dark:shadow-none p-1 rounded-full relative w-full h-[48px] items-center font-bold text-[14px]">
                   <div
                     className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Long' ? 'text-white' : textMuted + ' hover:text-white'}`}
                     onClick={() => setTradeSide('Long')}
                   >
                     Long
                   </div>
                   <div
                     className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Short' ? 'text-white' : textMuted + ' hover:text-white'}`}
                     onClick={() => setTradeSide('Short')}
                   >
                     Short
                   </div>
                   <div 
                     className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ${tradeSide === 'Long' ? 'bg-[#00c076] left-1' : 'bg-[#ff5353] left-[calc(50%+2px)]'}`}
                   ></div>
                </div>
              </div>

              {/* Market / Limit Tabs */}
              <div className={`flex items-center px-4 pt-2 border-b ${borderColor} mb-4`}>
                {['Market', 'Limit'].map((tab) => (
                  <div 
                    key={tab}
                    className={`pb-3 mr-6 text-[14px] cursor-pointer relative transition-colors ${activeTradeMode === tab ? 'text-[#00A8E8] font-bold' : textMuted + ' font-semibold hover:' + textMain}`}
                    onClick={() => setActiveTradeMode(tab as any)}
                  >
                    {tab}
                    {activeTradeMode === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                    )}
                  </div>
                ))}
              </div>

              <div className="px-4 pb-6 flex flex-col flex-1 h-full">
                
                {/* === MARKET MODE === */}
                {activeTradeMode === 'Market' && (
                  <div className="flex flex-col flex-1 h-full">
                    {/* Info Box */}
                    <div className="flex items-start gap-3 bg-[#e6faee] dark:bg-[#00c076]/10 p-3 rounded-[8px] mb-5 border border-[#00c076]/20">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Market Order</span>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-white/70 leading-tight">Your order will be executed instantly at the best available price.</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Amount (You pay)</span>
                    </div>

                    {/* Amount Input */}
                    <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white'} border ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'} rounded-[12px] py-4 px-4 mb-3 focus-within:border-[#00c076] transition-colors group`}>
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          type="text" 
                          placeholder="0.00"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[30px] sm:text-[36px] font-bold w-full min-w-0 text-left [appearance:textfield] ${textMain} placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0`} 
                        />
                        
                        <div className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[90px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: payTokenIcon.bg, color: payTokenIcon.fg }}>
                             <span className="text-[10px] font-bold">{payTokenIcon.label}</span>
                          </div>
                          <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{payTokenSym}</span>
                        </div>
                      </div>
                      <div className={`text-[11px] font-semibold ${textMuted} mt-1.5 px-0.5`}>≈ {formatPrice(recvEst)} {recvSym} received</div>
                    </div>

                    {/* Balance */}
                    <div className="flex justify-between items-center mb-6 px-1">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Available: <span className="text-[#00A8E8] font-bold tabular-nums">{payBalance === null ? (isConnected ? '…' : '—') : formatPrice(payBalance)} {payTokenSym}</span></span>
                      {payBalance !== null && payBalance > 0 && (
                        <button onClick={() => setPayAmount(String(payBalance))} className="text-[12px] font-bold tracking-tight text-[#00A8E8] hover:underline">Max</button>
                      )}
                    </div>

                    {/* Slider */}
                    <div className="mb-8 px-1 mt-6 relative">
                      <div className="relative h-1.5 bg-slate-200 dark:bg-[#1e2330] rounded-full flex items-center">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={posSize}
                          onChange={(e) => { const p = Number(e.target.value); setPosSize(p); if (payBalance) setPayAmount(String(Number((payBalance * p / 100).toFixed(6)))); }}
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer m-0 p-0"
                        />
                        {/* Markers */}
                        <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[100%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        
                        {/* Active Track */}
                        <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10 pointer-events-none" style={{ width: `${posSize}%` }}></div>
                        
                        {/* Marker Label */}
                        <div className="absolute bottom-[12px] -translate-x-1/2 bg-[#00A8E8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] pointer-events-none z-20" style={{ left: `${posSize}%` }}>{posSize}%</div>
                        
                        {/* Thumb */}
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_10px_rgba(0,168,232,0.5)] border-[3px] border-white dark:border-[#0b0e14] z-20 pointer-events-none" style={{ left: `${posSize}%` }}></div>
                      </div>
                      <div className={`flex justify-between mt-3 text-[10px] font-bold ${textMuted}`}>
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Summary Table */}
                    <div className="flex flex-col gap-3 text-[12px] font-semibold pb-4 px-1 mt-auto">
                      <div className="flex justify-between">
                        <span className={textMuted}>You will receive (Est.)</span>
                        <span className="text-[#00c076] font-bold tabular-nums">{formatPrice(recvEst)} {recvSym}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={textMuted}>Estimated Price</span>
                        <span className={`${textMain} tabular-nums`}>{priceStr} {pair.quote}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className={textMuted}>Slippage Tolerance</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </div>
                        <span className={`${textMain}`}>0.50%</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button onClick={submitOrder} disabled={txState === 'pending'} className={orderBtnClass(txState === 'done' ? 'bg-emerald-500' : orderBtnColor) + ' disabled:opacity-70'}>
                      {orderBtnContent}
                    </button>
                  </div>
                )}

                {/* === LIMIT MODE === */}
                {activeTradeMode === 'Limit' && (
                  <div className="flex flex-col flex-1 h-full">
                    {/* Limit Alert Box */}
                    <div className="flex items-start gap-3 bg-[#e6faee] dark:bg-[#00c076]/10 p-3 rounded-[8px] mb-5 border border-[#00c076]/20">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Limit Order</span>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-white/70 leading-tight">Your order will be placed at the specified price or better.</span>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Amount (You pay)</span>
                    </div>
                    <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white'} border ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'} rounded-[12px] py-4 px-4 mb-3 focus-within:border-[#00c076] transition-colors group`}>
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          type="text" 
                          placeholder="0.00"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[30px] sm:text-[36px] font-bold w-full min-w-0 text-left [appearance:textfield] ${textMain} placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0`} 
                        />
                        <div className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[90px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: payTokenIcon.bg, color: payTokenIcon.fg }}>
                             <span className="text-[10px] font-bold">{payTokenIcon.label}</span>
                          </div>
                          <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{payTokenSym}</span>
                        </div>
                      </div>
                      <div className={`text-[11px] font-semibold ${textMuted} mt-1.5 px-0.5`}>≈ {formatPrice(recvEst)} {recvSym} received</div>
                    </div>

                    {/* Price Input */}
                    <div className="flex justify-between items-end mb-2 mt-1">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Price (Limit)</span>
                    </div>
                    <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white'} border ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'} rounded-[12px] py-4 px-4 mb-5 focus-within:border-[#00c076] transition-colors group`}>
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          type="text" 
                          placeholder="0.00"
                          value={priceAmount}
                          onChange={(e) => setPriceAmount(e.target.value)}
                          className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[30px] sm:text-[36px] font-bold w-full min-w-0 text-left [appearance:textfield] ${textMain} placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0`} 
                        />
                        <div className="flex items-center justify-end gap-2 px-3 py-1.5 min-w-[60px] shrink-0">
                          <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-none pr-1">{pair.quote}</span>
                        </div>
                      </div>
                      <div className={`text-[11px] font-semibold ${textMuted} mt-1.5 px-0.5`}>Mark: {priceStr} {pair.quote}</div>
                    </div>

                    {/* Balance & Total */}
                    <div className="flex justify-between items-center mb-6 px-1">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Available: <span className="text-[#00A8E8] font-bold tabular-nums">{payBalance === null ? (isConnected ? '…' : '—') : formatPrice(payBalance)} {payTokenSym}</span></span>
                      {payBalance !== null && payBalance > 0 && (
                        <button onClick={() => setPayAmount(String(payBalance))} className="text-[12px] font-bold tracking-tight text-[#00A8E8] hover:underline">Max</button>
                      )}
                    </div>

                    {/* Slider */}
                    <div className="mb-8 px-1 relative">
                      <div className="relative h-1.5 bg-slate-200 dark:bg-[#1e2330] rounded-full flex items-center">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={posSize}
                          onChange={(e) => { const p = Number(e.target.value); setPosSize(p); if (payBalance) setPayAmount(String(Number((payBalance * p / 100).toFixed(6)))); }}
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer m-0 p-0"
                        />
                        {/* Markers */}
                        <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        <div className="absolute left-[100%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                        
                        {/* Active Track */}
                        <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10 pointer-events-none" style={{ width: `${posSize}%` }}></div>
                        
                        {/* Marker Label */}
                        <div className="absolute bottom-[12px] -translate-x-1/2 bg-[#00A8E8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] pointer-events-none z-20" style={{ left: `${posSize}%` }}>{posSize}%</div>
                        
                        {/* Thumb */}
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_10px_rgba(0,168,232,0.5)] border-[3px] border-white dark:border-[#0b0e14] z-20 pointer-events-none" style={{ left: `${posSize}%` }}></div>
                      </div>
                      <div className={`flex justify-between mt-3 text-[10px] font-bold ${textMuted}`}>
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button onClick={submitOrder} disabled={txState === 'pending'} className={'mt-auto ' + orderBtnClass(txState === 'done' ? 'bg-emerald-500' : orderBtnColor) + ' disabled:opacity-70'}>
                      {orderBtnContent}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Side Info Card (Trade with confidence) */}
          <div className={`mt-auto ${cardBg} border ${borderColor} rounded-[16px] flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            {/* Headline / Header */}
            <div className={`flex items-center px-3 pt-4 border-b ${borderColor}`}>
              <div className={`px-3 pb-3 text-[14px] cursor-pointer relative font-bold text-slate-900 dark:text-white`}>
                Trade with confidence
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 flex items-center justify-between">
              <span className={`text-[13px] font-medium ${textMuted} leading-relaxed max-w-[220px]`}>
                Non-custodial peer-to-peer escrow. Every trade settles on-chain on Hedera — no house, no custody.
              </span>
              <div className="w-12 h-12 bg-gradient-to-br from-[#00A8E8] to-[#007ba8] rounded-[12px] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,168,232,0.4)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Fast client polling of our own /api/market/pool-tick route, for pairs with
// no push feed available (GeckoTerminal-sourced). Not true streaming, but a
// large jump from the previous 15-30s snapshot re-fetch down to ~3s, reading
// straight off the pool contract's own Swap events.
export interface PoolTick { price: number; time: number }

export function pollPoolTick(pairId: string, onTick: (tick: PoolTick) => void, intervalMs = 3000): () => void {
  let alive = true;
  let lastTime = 0;
  const poll = async () => {
    try {
      const res = await fetch(`/api/market/pool-tick?pair=${encodeURIComponent(pairId)}`);
      if (!res.ok || !alive) return;
      const d = await res.json();
      if (d.price == null || d.time == null || d.time === lastTime) return;
      lastTime = d.time;
      onTick({ price: d.price, time: d.time });
    } catch {
      // ignore — next poll will retry
    }
  };
  poll();
  const t = setInterval(poll, intervalMs);
  return () => { alive = false; clearInterval(t); };
}

# Creode Binance Relay

A small, standalone, always-on service. It holds one persistent WebSocket
connection to Binance per token (the 20 tokens the Vault chart tracks that
vDEX also lists) and re-broadcasts every trade print to browsers over
Server-Sent Events.

This exists because the main Creode app runs on Vercel's serverless
functions, which can't hold a connection open forever — that relay has to
reconnect roughly every 9 seconds. This service isn't bound by that limit,
so it never has to reconnect unless the connection actually drops.

**Nothing in the main `frontend/` app depends on this yet.** It's built and
ready, but it has to be deployed and given a real URL before it can be wired
in — that part needs you.

## What you need to do

1. **Pick a host that runs a long-lived process** — Render, Fly.io, and
   Railway all work identically here since this ships as a plain Docker
   container. Render is the simplest to point-and-click; a `render.yaml` is
   included for it.
2. **Create an account** on whichever you pick.
3. **Important — pick a plan that doesn't sleep on inactivity.** Free tiers
   on most of these platforms spin the service down after a period of no
   traffic, and spinning back up takes a few seconds — that would
   reintroduce the exact reconnect gap this service exists to remove. The
   included `render.yaml` requests Render's `starter` plan (their smallest
   plan that stays running continuously), which has a small monthly cost.
   Fly.io and Railway have similar "always-on" tiers if you'd rather use one
   of those.
4. **Connect this repo** (or push this `relay-server/` folder to its own
   repo, if you'd rather keep it separate from the main app) to that host.
5. **Deploy it.** Render will pick up `render.yaml` automatically. On
   Fly.io/Railway, point their CLI or dashboard at the `Dockerfile` in this
   folder.
6. Once it's live, hit `https://<your-deployed-url>/health` — it should
   return `ok`. That confirms it's running.
7. **Give me the deployed URL.** I'll then wire the frontend to use it as an
   additional layer on top of what's already live (the same safe,
   additive pattern as the current Vercel relay: if this new service is
   ever unreachable, the app falls straight back to exactly what's running
   today — nothing existing gets removed or put at risk).

## Endpoints

- `GET /health` — returns `ok` if the process is running.
- `GET /stream?symbol=BTC` — Server-Sent Events stream of live trade prints
  for that symbol. Valid symbols: BTC, ETH, SOL, HYPE, XRP, BNB, DOGE, SUI,
  AVAX, LINK, AAVE, TON, NEAR, TAO, ZEC, PENGU, PEPE, ASTER, WLFI, FARTCOIN.

## Local test

```
cd relay-server
npm install
npm start
curl http://localhost:3001/health
curl -N "http://localhost:3001/stream?symbol=BTC"
```

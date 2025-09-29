# listener.py
# Real-time PumpPortal listener with pretty output, CLI args, and auto-reconnect
# Usage examples:
#   python listener.py                           # firehose of new tokens
#   python listener.py --mint <MINT>             # trades for a specific token
#   python listener.py --mint <M1> --mint <M2>   # multiple tokens
#   python listener.py --account <WALLET>        # trades by a wallet
#
# Note: Keep a single WS connection and multiplex subscriptions.

import asyncio
import json
import os
import signal
import sys
import time
import argparse

import websockets

WS_ENDPOINT = os.getenv("PUMPPORTAL_WS", "wss://pumpportal.fun/api/data")

# --- helpers -----------------------------------------------------------------

def ts():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def safe_get(d, *keys, default=None):
    cur = d
    for k in keys:
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return cur


def format_number(val):
    try:
        f = float(val)
        if abs(f) >= 1:
            return f"{f:,.2f}"
        return f"{f:.6f}"
    except Exception:
        return str(val)


# Pretty printers that are resilient to schema changes

def print_new_token(msg):
    data = msg.get("data", msg)
    mint = safe_get(data, "mint") or safe_get(data, "token", "mint")
    name = safe_get(data, "name") or safe_get(data, "token", "name")
    symbol = safe_get(data, "symbol") or safe_get(data, "token", "symbol")
    creator = safe_get(data, "creator") or safe_get(data, "token", "creator")
    signature = safe_get(data, "signature")
    created_at = safe_get(data, "timestamp") or safe_get(data, "createdAt")

    print(f"[{ts()}] NEW   | {name or '?'} ({symbol or '?'}) mint={mint or '?'} creator={creator or '?'} sig={signature or '?'} ts={created_at}")


def print_trade(msg):
    data = msg.get("data", msg)
    mint = safe_get(data, "mint")
    side = (safe_get(data, "side") or safe_get(data, "takerSide") or "?").upper()
    amount = safe_get(data, "amount") or safe_get(data, "tokenAmount")
    sol = safe_get(data, "solAmount") or safe_get(data, "priceSol") or safe_get(data, "nativeAmount")
    price = safe_get(data, "price") or safe_get(data, "uiPrice")
    buyer = safe_get(data, "buyer") or safe_get(data, "maker") or safe_get(data, "trader")
    seller = safe_get(data, "seller")
    sig = safe_get(data, "signature") or safe_get(data, "sig")

    parts = [
        f"[{ts()}] TRADE",
        f"{side:>4}",
        f"mint={mint or '?'}",
    ]
    if amount is not None:
        parts.append(f"amt={format_number(amount)}")
    if sol is not None:
        parts.append(f"sol={format_number(sol)}")
    if price is not None:
        parts.append(f"px={format_number(price)}")
    if buyer:
        parts.append(f"buyer={buyer}")
    if seller:
        parts.append(f"seller={seller}")
    if sig:
        parts.append(f"sig={sig}")

    print(" | ".join(parts))


# --- websocket logic ---------------------------------------------------------

async def subscribe(ws, mints, accounts, include_new_tokens):
    # subscribe to new tokens (firehose)
    if include_new_tokens:
        await ws.send(json.dumps({"method": "subscribeNewToken"}))

    # subscribe to trades for mints
    if mints:
        await ws.send(json.dumps({"method": "subscribeTokenTrade", "keys": mints}))

    # subscribe to account trades
    if accounts:
        await ws.send(json.dumps({"method": "subscribeAccountTrade", "keys": accounts}))


async def handle_messages(ws):
    async for raw in ws:
        try:
            msg = json.loads(raw)
        except Exception:
            print(f"[{ts()}] RAW  | {raw}")
            continue

        method = msg.get("method") or msg.get("type")
        if method == "newToken" or method == "subscribeNewToken":
            print_new_token(msg)
        elif method in ("tokenTrade", "subscribeTokenTrade", "accountTrade", "subscribeAccountTrade"):
            print_trade(msg)
        else:
            # unknown / heartbeat / misc
            print(f"[{ts()}] MISC  | {method} | {msg}")


async def connect_and_run(mints, accounts, include_new_tokens=True):
    backoff = 1
    while True:
        try:
            print(f"[{ts()}] Connecting -> {WS_ENDPOINT}")
            async with websockets.connect(WS_ENDPOINT, ping_interval=25, ping_timeout=20, max_queue=2048) as ws:
                print(f"[{ts()}] Connected.")
                await subscribe(ws, mints, accounts, include_new_tokens)
                backoff = 1  # reset
                await handle_messages(ws)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"[{ts()}] Disconnected ({e.__class__.__name__}: {e}). Reconnecting in {backoff}s...")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30)


# --- CLI --------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="PumpPortal real-time listener")
    p.add_argument("--mint", action="append", default=[], help="SPL token mint address to monitor for trades (can repeat)")
    p.add_argument("--account", action="append", default=[], help="Wallet/public key to monitor (can repeat)")
    p.add_argument("--no-new", action="store_true", help="Do NOT subscribe to the global new-token firehose")
    return p.parse_args()


async def amain():
    args = parse_args()

    # allow env comma separated too (MINTS and ACCOUNTS)
    env_mints = [m.strip() for m in os.getenv("MINTS", "").split(",") if m.strip()]
    env_accts = [a.strip() for a in os.getenv("ACCOUNTS", "").split(",") if a.strip()]
    mints = list(dict.fromkeys([*args.mint, *env_mints]))
    accounts = list(dict.fromkeys([*args.account, *env_accts]))

    include_new = not args.no_new

    # graceful shutdown on Ctrl-C
    loop = asyncio.get_running_loop()
    stop = asyncio.Future()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop.set_result, None)
        except NotImplementedError:
            # Windows + asyncio quirk
            pass

    runner = asyncio.create_task(connect_and_run(mints, accounts, include_new))
    await stop
    runner.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await runner


if __name__ == "__main__":
    import contextlib
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        pass

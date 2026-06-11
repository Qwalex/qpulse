import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MarketType } from '@prisma/client';
import { marketTypeToBybitCategory } from './price-watch.mapper';

const BYBIT_WS: Record<'spot' | 'linear', string> = {
  spot: 'wss://stream.bybit.com/v5/public/spot',
  linear: 'wss://stream.bybit.com/v5/public/linear',
};

const RECONNECT_MS = 5000;
const PING_INTERVAL_MS = 20_000;

export interface BybitTickerUpdate {
  symbol: string;
  marketType: MarketType;
  price: number;
  change24hPct: number | null;
  updatedAt: Date;
}

type TickHandler = (update: BybitTickerUpdate) => void;

interface CategoryState {
  ws: WebSocket | null;
  subscribed: Set<string>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  pingTimer: ReturnType<typeof setInterval> | null;
}

@Injectable()
export class BybitPriceFeedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BybitPriceFeedService.name);
  private readonly categories: Record<'spot' | 'linear', CategoryState> = {
    spot: { ws: null, subscribed: new Set(), reconnectTimer: null, pingTimer: null },
    linear: { ws: null, subscribed: new Set(), reconnectTimer: null, pingTimer: null },
  };
  private tickHandler: TickHandler | null = null;
  private alive = true;

  onModuleInit() {
    this.connectCategory('spot');
    this.connectCategory('linear');
  }

  onModuleDestroy() {
    this.alive = false;
    for (const category of ['spot', 'linear'] as const) {
      this.teardownCategory(category);
    }
  }

  setTickHandler(handler: TickHandler) {
    this.tickHandler = handler;
  }

  async resyncSubscriptions(
    entries: Array<{ symbol: string; marketType: MarketType }>,
  ): Promise<void> {
    const next: Record<'spot' | 'linear', Set<string>> = {
      spot: new Set(),
      linear: new Set(),
    };

    for (const entry of entries) {
      const category = marketTypeToBybitCategory(entry.marketType);
      next[category].add(entry.symbol.toUpperCase());
    }

    for (const category of ['spot', 'linear'] as const) {
      const state = this.categories[category];
      const prev = new Set(state.subscribed);
      state.subscribed = next[category];

      const toSubscribe = [...state.subscribed].filter((s) => !prev.has(s));
      const toUnsubscribe = [...prev].filter((s) => !state.subscribed.has(s));

      if (state.ws?.readyState === WebSocket.OPEN) {
        if (toUnsubscribe.length > 0) {
          this.sendOp(state.ws, 'unsubscribe', toUnsubscribe.map((s) => `tickers.${s}`));
        }
        if (toSubscribe.length > 0) {
          this.sendOp(state.ws, 'subscribe', toSubscribe.map((s) => `tickers.${s}`));
        }
      } else if (state.subscribed.size > 0) {
        this.connectCategory(category);
      }
    }
  }

  async fetchLastPrice(symbol: string, marketType: MarketType): Promise<number | null> {
    const category = marketTypeToBybitCategory(marketType);
    const base =
      category === 'spot'
        ? 'https://api.bybit.com/v5/market/tickers?category=spot'
        : 'https://api.bybit.com/v5/market/tickers?category=linear';
    const url = `${base}&symbol=${encodeURIComponent(symbol.toUpperCase())}`;
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const json = (await response.json()) as {
        result?: { list?: Array<{ lastPrice?: string }> };
      };
      const lastPrice = json.result?.list?.[0]?.lastPrice;
      if (lastPrice == null) return null;
      const parsed = Number(lastPrice);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private connectCategory(category: 'spot' | 'linear') {
    const state = this.categories[category];
    this.teardownCategory(category, false);

    if (!this.alive) return;

    const ws = new WebSocket(BYBIT_WS[category]);
    state.ws = ws;

    ws.onopen = () => {
      this.logger.log(`Bybit ${category} WS connected`);
      if (state.subscribed.size > 0) {
        this.sendOp(ws, 'subscribe', [...state.subscribed].map((s) => `tickers.${s}`));
      }
      state.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      this.handleMessage(category, event.data);
    };

    ws.onerror = () => {
      this.logger.warn(`Bybit ${category} WS error`);
    };

    ws.onclose = () => {
      if (state.pingTimer) {
        clearInterval(state.pingTimer);
        state.pingTimer = null;
      }
      state.ws = null;
      if (this.alive) {
        state.reconnectTimer = setTimeout(() => this.connectCategory(category), RECONNECT_MS);
      }
    };
  }

  private teardownCategory(category: 'spot' | 'linear', clearSubscribed = true) {
    const state = this.categories[category];
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }
    if (state.pingTimer) {
      clearInterval(state.pingTimer);
      state.pingTimer = null;
    }
    if (state.ws) {
      state.ws.onopen = null;
      state.ws.onmessage = null;
      state.ws.onerror = null;
      state.ws.onclose = null;
      state.ws.close();
      state.ws = null;
    }
    if (clearSubscribed) {
      state.subscribed.clear();
    }
  }

  private sendOp(ws: WebSocket, op: 'subscribe' | 'unsubscribe', args: string[]) {
    if (args.length === 0) return;
    ws.send(JSON.stringify({ op, args }));
  }

  private handleMessage(category: 'spot' | 'linear', raw: unknown) {
    let payload: {
      topic?: string;
      data?: { symbol?: string; lastPrice?: string; price24hPcnt?: string };
    };
    try {
      payload = JSON.parse(String(raw)) as typeof payload;
    } catch {
      return;
    }

    if (!payload.topic?.startsWith('tickers.') || !payload.data?.symbol) {
      return;
    }

    const price = Number(payload.data.lastPrice);
    if (!Number.isFinite(price)) return;

    const changeRaw = payload.data.price24hPcnt;
    const change24hPct = changeRaw == null ? null : Number(changeRaw) * 100;

    const marketType = category === 'spot' ? MarketType.SPOT : MarketType.FUTURES;
    this.tickHandler?.({
      symbol: payload.data.symbol.toUpperCase(),
      marketType,
      price,
      change24hPct: Number.isFinite(change24hPct ?? NaN) ? change24hPct : null,
      updatedAt: new Date(),
    });
  }
}

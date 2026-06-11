import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { PriceTickerDto, PriceWatchStateDto } from '@qpulse/shared';
import { priceDeviceChannel } from '@qpulse/shared';
import { getRealtimeUrl } from '@/lib/api';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

function patchTicker(state: PriceWatchStateDto | undefined, ticker: PriceTickerDto): PriceWatchStateDto {
  if (!state) {
    return { watchlist: [], alerts: [], tickers: [ticker] };
  }
  const key = `${ticker.marketType}:${ticker.symbol}`;
  const tickers = [...state.tickers];
  const index = tickers.findIndex((row) => `${row.marketType}:${row.symbol}` === key);
  if (index === -1) {
    tickers.push(ticker);
  } else {
    tickers[index] = ticker;
  }
  return { ...state, tickers };
}

export function usePriceRealtime(deviceId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    let disposed = false;
    const queryKey = ['price-watch', deviceId] as const;

    const scheduleReconnect = () => {
      if (disposed) return;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;

      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();

      const socket = io(getRealtimeUrl(), {
        path: '/api/v1/realtime',
        transports: ['websocket'],
        autoConnect: true,
        reconnection: false,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        reconnectAttemptRef.current = 0;
        socket.emit('subscribe', { channels: [priceDeviceChannel(deviceId)] });
      });

      socket.on('connect_error', () => {
        socket.disconnect();
        scheduleReconnect();
      });

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect' || reason === 'transport close') {
          scheduleReconnect();
        }
      });

      socket.on('price:ticker', (payload: PriceTickerDto) => {
        queryClient.setQueryData<PriceWatchStateDto>(queryKey, (old) =>
          patchTicker(old, payload),
        );
      });
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [deviceId, queryClient]);
}

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { io, type Socket } from 'socket.io-client';

import type { SignalDto } from '@qpulse/shared';

import { MarketType } from '@qpulse/shared';

import { getRealtimeUrl } from '@/lib/api';



const REALTIME_CHANNELS = ['signals:all', 'signals:spot', 'signals:futures'];

const RECONNECT_BASE_MS = 1000;

const RECONNECT_MAX_MS = 30000;



function patchSignalList(

  old: SignalDto[] | undefined,

  updated: SignalDto,

): SignalDto[] {

  if (!old) return [updated];

  const index = old.findIndex((s) => s.id === updated.id);

  if (index === -1) return [updated, ...old];

  const next = [...old];

  next[index] = updated;

  return next;

}



function removeSignalFromList(old: SignalDto[] | undefined, signalId: string): SignalDto[] {

  if (!old) return [];

  return old.filter((s) => s.id !== signalId);

}



function isLiveSignal(signal: SignalDto): boolean {

  return signal.status === 'OPEN' || signal.status === 'ACTIVE';

}



function queryKeysForMarket(marketType: MarketType) {

  return [['signals', marketType, 'live']] as const;

}



export function useSignalRealtime() {

  const queryClient = useQueryClient();

  const socketRef = useRef<Socket | null>(null);

  const reconnectAttemptRef = useRef(0);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  useEffect(() => {

    let disposed = false;



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

        socket.emit('subscribe', { channels: REALTIME_CHANNELS });

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



      socket.on('signal:updated', (payload: SignalDto) => {

        const market = payload.marketType as MarketType;

        for (const key of queryKeysForMarket(market)) {

          queryClient.setQueryData<SignalDto[]>(key, (old) => {

            if (!isLiveSignal(payload)) {

              return removeSignalFromList(old, payload.id);

            }

            return patchSignalList(old, payload);

          });

        }

        queryClient.setQueryData(['signal', payload.id], payload);

        queryClient.invalidateQueries({ queryKey: ['results'] });

      });



      socket.on('signal:deleted', (payload: { signalId: string }) => {

        for (const market of [MarketType.SPOT, MarketType.FUTURES]) {

          for (const key of queryKeysForMarket(market)) {

            queryClient.setQueryData<SignalDto[]>(key, (old) =>

              removeSignalFromList(old, payload.signalId),

            );

          }

        }

        queryClient.removeQueries({ queryKey: ['signal', payload.signalId] });

        queryClient.invalidateQueries({ queryKey: ['results'] });

      });



      socket.on('signal:event', () => {

        queryClient.invalidateQueries({ queryKey: ['signals'] });

        queryClient.invalidateQueries({ queryKey: ['results'] });

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

  }, [queryClient]);

}


import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEntryAlertFromSignal,
  fetchPriceWatchState,
} from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import { usePriceRealtime } from '@/hooks/usePriceRealtime';

export function useDevicePriceWatch() {
  const queryClient = useQueryClient();

  const deviceIdQuery = useQuery({
    queryKey: ['device-id'],
    queryFn: getDeviceId,
    staleTime: Infinity,
  });

  const deviceId = deviceIdQuery.data ?? null;

  const priceWatchQuery = useQuery({
    queryKey: ['price-watch', deviceId],
    queryFn: () => fetchPriceWatchState(deviceId!),
    enabled: Boolean(deviceId),
    staleTime: 30_000,
  });

  usePriceRealtime(deviceId);

  const trackedSignalIds = new Set(
    (priceWatchQuery.data?.alerts ?? [])
      .filter((alert) => alert.isActive && alert.signalId)
      .map((alert) => alert.signalId as string),
  );

  const trackSignalEntry = async (signalId: string) => {
    if (!deviceId) return;
    await createEntryAlertFromSignal(deviceId, signalId);
    await queryClient.invalidateQueries({ queryKey: ['price-watch', deviceId] });
  };

  return {
    deviceId,
    priceWatchQuery,
    trackedSignalIds,
    trackSignalEntry,
  };
}

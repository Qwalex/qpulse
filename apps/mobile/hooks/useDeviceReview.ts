import { useCallback, useEffect, useState } from 'react';
import type { ReviewDto } from '@qpulse/shared';
import { fetchMyReview, submitReview } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import { getLocalReview, saveLocalReview, type LocalReviewState } from '@/lib/reviewStorage';

export function useDeviceReview() {
  const [review, setReview] = useState<LocalReviewState | null>(null);
  const [ready, setReady] = useState(false);

  const syncFromServer = useCallback(async (): Promise<LocalReviewState | null> => {
    const deviceId = await getDeviceId();
    const { review: remote } = await fetchMyReview(deviceId);
    if (!remote) return null;
    return saveLocalReview(remote);
  }, []);

  const hydrate = useCallback(async () => {
    const local = await getLocalReview();
    if (local) {
      setReview(local);
      setReady(true);
      try {
        const synced = await syncFromServer();
        if (synced) setReview(synced);
      } catch {
        // keep local cache when offline
      }
      return;
    }

    try {
      const synced = await syncFromServer();
      if (synced) setReview(synced);
    } catch {
      // no review yet or offline
    } finally {
      setReady(true);
    }
  }, [syncFromServer]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const saveReview = useCallback(
    async (rating: number, comment?: string) => {
      const deviceId = await getDeviceId();
      const saved: ReviewDto = await submitReview({ rating, comment, deviceId });
      const local = await saveLocalReview(saved);
      setReview(local);
      return local;
    },
    [],
  );

  return {
    ready,
    hasReview: review != null,
    review,
    refresh: hydrate,
    saveReview,
  };
}

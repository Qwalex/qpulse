import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReviewDto } from '@qpulse/shared';

const REVIEW_STATE_KEY = 'qpulse_review_state';

export interface LocalReviewState {
  reviewId: string;
  rating: number;
  comment?: string;
  updatedAt: string;
}

export async function getLocalReview(): Promise<LocalReviewState | null> {
  const raw = await AsyncStorage.getItem(REVIEW_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalReviewState;
  } catch {
    return null;
  }
}

export async function saveLocalReview(review: ReviewDto): Promise<LocalReviewState> {
  const state: LocalReviewState = {
    reviewId: review.id,
    rating: review.rating,
    comment: review.comment ?? undefined,
    updatedAt: review.updatedAt,
  };
  await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
  return state;
}

export async function clearLocalReview(): Promise<void> {
  await AsyncStorage.removeItem(REVIEW_STATE_KEY);
}

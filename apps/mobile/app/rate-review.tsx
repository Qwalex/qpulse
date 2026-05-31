import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceReview } from '@/hooks/useDeviceReview';
import { useAppStore } from '@/store/useAppStore';
import { radii, spacing } from '@/constants/theme';

export default function RateReviewScreen() {
  const themeColors = useAppStore((s) => s.colors);
  const navigation = useNavigation();
  const { ready, hasReview, review, saveReview } = useDeviceReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !review) return;
    setRating(review.rating);
    setComment(review.comment ?? '');
  }, [ready, review]);

  useEffect(() => {
    navigation.setOptions({
      title: hasReview ? 'Edit review' : 'Rate app',
    });
  }, [hasReview, navigation]);

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert('Rating', 'Please select a rating from 1 to 5');
      return;
    }

    setSubmitting(true);
    try {
      await saveReview(rating, comment.trim() || undefined);
      Alert.alert('Thank you!', hasReview ? 'Review updated' : 'Your review has been submitted');
    } catch {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator color={themeColors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        {hasReview ? 'Your review' : 'How do you like QPulse?'}
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        {hasReview
          ? 'You can update your rating and comment at any time'
          : 'Your rating helps us improve the app'}
      </Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)} accessibilityRole="button">
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? themeColors.warning : themeColors.textMuted}
            />
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.cardBorder,
            color: themeColors.text,
          },
        ]}
        placeholder="Comment (optional)"
        placeholderTextColor={themeColors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.button, { backgroundColor: themeColors.accent }, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={themeColors.text} />
        ) : (
          <Text style={[styles.buttonText, { color: themeColors.text }]}>
            {hasReview ? 'Save changes' : 'Submit'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

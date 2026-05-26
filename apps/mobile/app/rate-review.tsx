import { useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  Pressable,

  StyleSheet,

  Text,

  TextInput,

  View,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { submitReview } from '@/lib/api';

import { getDeviceId } from '@/lib/deviceId';

import { useAppStore } from '@/store/useAppStore';

import { radii, spacing } from '@/constants/theme';



export default function RateReviewScreen() {

  const themeColors = useAppStore((s) => s.colors);

  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);



  const handleSubmit = async () => {

    if (rating < 1) {

      Alert.alert('Оценка', 'Пожалуйста, выберите оценку от 1 до 5');

      return;

    }



    setSubmitting(true);

    try {

      const deviceId = await getDeviceId();

      await submitReview({ rating, comment: comment.trim() || undefined, deviceId });

      Alert.alert('Спасибо!', 'Ваш отзыв отправлен');

      setRating(0);

      setComment('');

    } catch {

      Alert.alert('Ошибка', 'Не удалось отправить отзыв');

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <Text style={[styles.title, { color: themeColors.text }]}>Как вам QPulse?</Text>

      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>

        Ваша оценка помогает нам улучшать приложение

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

        placeholder="Комментарий (необязательно)"

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

          <Text style={[styles.buttonText, { color: themeColors.text }]}>Отправить</Text>

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



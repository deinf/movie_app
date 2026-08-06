import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Scrim, Spacing } from '@/constants/theme';

export interface RatingBadgeProps {
  value: number;
  variant?: 'overlay' | 'inline';
  align?: 'left' | 'right';
  style?: ViewStyle;
}

export function RatingBadge({ value, variant = 'overlay', align = 'left', style }: RatingBadgeProps) {
  if (!value || value <= 0) return null;

  const score = value.toFixed(1);

  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]}>
        <Ionicons name="star" size={14} color={Colors.rating} />
        <AppText variant="bodyStrong">{score}</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.overlay, align === 'right' ? styles.overlayRight : styles.overlayLeft, style]}>
      <AppText variant="micro" style={styles.mark}>
        TMDB
      </AppText>
      <AppText variant="micro">{score}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Scrim.badge,
  },
  overlayLeft: { left: Spacing.sm },
  overlayRight: { right: Spacing.sm },
  mark: {
    color: Colors.rating,
    letterSpacing: 0.4,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});

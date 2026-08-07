import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Spacing } from '@/constants/theme';

export interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  actionLabel?: string;
}

export function SectionHeader({ title, onSeeAll, actionLabel = 'See all' }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="section">{title}</AppText>
      {onSeeAll ? (
        <PressableScale
          onPress={onSeeAll}
          scaleTo={0.94}
          tapSize={{ height: 25 }}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}, ${title}`}
          style={styles.action}>
          <AppText variant="caption" tone="accent">
            {actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={Colors.primaryLight} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
});

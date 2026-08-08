import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/buttons';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <Ionicons name={icon} size={30} color={Colors.primaryLight} />
      </View>
      <AppText variant="section" style={styles.centered}>
        {title}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Something went wrong"
      message={error.message}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.huge,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  centered: { textAlign: 'center' },
  action: { marginTop: Spacing.md, minWidth: 180 },
});

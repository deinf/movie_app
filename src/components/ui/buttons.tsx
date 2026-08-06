import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface PrimaryButtonProps {
  label: string;
  icon?: IoniconName;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({ label, icon, onPress, style, disabled }: PrimaryButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      haptic={!disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={[styles.primaryWrapper, disabled && styles.disabled, style]}>
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryFill}>
        {icon ? <Ionicons name={icon} size={20} color={Colors.text} /> : null}
        <AppText variant="subtitle">{label}</AppText>
      </LinearGradient>
    </PressableScale>
  );
}

export interface IconButtonProps {
  icon: IoniconName;
  onPress?: () => void;
  label: string;
  active?: boolean;
  toggle?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  label,
  active = false,
  toggle = false,
  size = 44,
  style,
}: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      haptic={toggle}
      tapSize={{ width: size, height: size }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        active && styles.iconButtonActive,
        style,
      ]}>
      <Ionicons name={icon} size={size * 0.45} color={active ? Colors.primaryLight : Colors.textSecondary} />
    </PressableScale>
  );
}

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const content = (
    <AppText variant="caption" tone={selected ? 'accent' : 'secondary'} numberOfLines={1}>
      {label}
    </AppText>
  );

  if (!onPress) {
    return <View style={[styles.chip, selected && styles.chipSelected]}>{content}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      haptic
      tapSize={{ height: CHIP_HEIGHT }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}>
      {content}
    </PressableScale>
  );
}

const CHIP_HEIGHT = 31;

const styles = StyleSheet.create({
  primaryWrapper: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  disabled: { opacity: 0.5 },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  iconButtonActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    // floor it, a horizontal list will otherwise squash the pill and clip the label
    minHeight: CHIP_HEIGHT,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  chipSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
});

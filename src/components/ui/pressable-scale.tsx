import * as Haptics from 'expo-haptics';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { TapTarget } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  tapSize?: { width?: number; height?: number };
}

function slopFor(size: PressableScaleProps['tapSize']) {
  if (!size) return undefined;
  const horizontal = Math.max(0, (TapTarget - (size.width ?? TapTarget)) / 2);
  const vertical = Math.max(0, (TapTarget - (size.height ?? TapTarget)) / 2);
  if (!horizontal && !vertical) return undefined;
  return { left: horizontal, right: horizontal, top: vertical, bottom: vertical };
}

export function PressableScale({
  style,
  scaleTo = 0.96,
  haptic = false,
  tapSize,
  hitSlop,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      hitSlop={hitSlop ?? slopFor(tapSize)}
      onPressIn={(event) => {
        scale.set(withSpring(scaleTo, { damping: 18, stiffness: 320 }));
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 18, stiffness: 320 }));
        onPressOut?.(event);
      }}
      {...rest}
    />
  );
}

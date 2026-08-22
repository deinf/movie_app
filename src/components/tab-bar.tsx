import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Scrim, Spacing, TabBarHeight } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  explore: { active: 'compass', inactive: 'compass-outline' },
  'my-list': { active: 'bookmark', inactive: 'bookmark-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
      pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = (options.title ?? route.name) as string;
          const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (focused || event.defaultPrevented) return;
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync().catch(() => {});
            }
            navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}>
              <TabItem focused={focused} icon={focused ? icon.active : icon.inactive} label={label} />
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

function TabItem({ focused, icon, label }: { focused: boolean; icon: IoniconName; label: string }) {
  const progress = useSharedValue(focused ? 1 : 0);
  const lift = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(focused ? 1 : 0, { duration: 180 }));
    lift.set(withSpring(focused ? 1 : 0, { damping: 16, stiffness: 240 }));
  }, [focused, progress, lift]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * lift.get() }, { scale: 1 + 0.08 * lift.get() }],
  }));

  return (
    <View style={styles.itemInner}>
      <Animated.View style={[styles.pill, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons name={icon} size={22} color={focused ? Colors.primaryLight : Colors.textTertiary} />
      </Animated.View>
      <AppText variant="micro" tone={focused ? 'accent' : 'tertiary'} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TabBarHeight,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    // blur alone is too transparent over bright posters to keep the labels readable
    backgroundColor: Scrim.panel,
  },
  item: { flex: 1, height: '100%' },
  itemInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: Spacing.sm,
    right: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
  },
});

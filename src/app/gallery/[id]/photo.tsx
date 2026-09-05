import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { imageUrl, ImageSize, tmdb, type MediaType, type MovieDetail } from '@/api/tmdb';
import { ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { usePreferences } from '@/store/preferences';
import { Colors, Radius, Scrim, Spacing } from '@/constants/theme';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export default function PhotoViewerScreen() {
  const { id, type, index } = useLocalSearchParams<{ id: string; type?: MediaType; index?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { preferences } = usePreferences();

  const mediaType: MediaType = type === 'tv' ? 'tv' : 'movie';
  const numericId = Number(id);
  const startIndex = Math.max(0, Number(index) || 0);

  const { data, loading, error, refetch } = useAsync<MovieDetail>(
    () => (mediaType === 'tv' ? tmdb.tv(numericId) : tmdb.movie(numericId)),
    [numericId, mediaType],
  );

  const stills = data?.images?.backdrops ?? [];
  const [current, setCurrent] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  return (
    <View style={styles.screen}>
      {error && !stills.length ? (
        <View style={styles.centeredBlock}>
          <ErrorState error={error} onRetry={refetch} />
        </View>
      ) : loading && !stills.length ? (
        <ActivityIndicator color={Colors.primaryLight} style={styles.centered} />
      ) : !stills.length ? (
        <AppText variant="body" tone="tertiary" style={styles.centered}>
          No images for this title.
        </AppText>
      ) : (
        <FlatList
          data={stills}
          keyExtractor={(still) => still.file_path}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <ZoomableImage
              uri={imageUrl(
                item.file_path,
                preferences.dataSaver ? ImageSize.backdropLarge : ImageSize.original,
              )}
              width={width}
              height={height}
              zoomed={zoomed}
              onZoomChange={setZoomed}
            />
          )}
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <PressableScale
          onPress={() => router.back()}
          scaleTo={0.88}
          tapSize={{ width: 40, height: 40 }}
          accessibilityRole="button"
          accessibilityLabel="Close image"
          style={styles.closeButton}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </PressableScale>

        {stills.length > 1 ? (
          <View style={styles.counter}>
            <AppText variant="caption">
              {current + 1} / {stills.length}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ZoomableImage({
  uri,
  width,
  height,
  zoomed,
  onZoomChange,
}: {
  uri: string | null;
  width: number;
  height: number;
  zoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const gesture = useMemo(() => {
    const reset = () => {
      'worklet';
      scale.set(withTiming(1));
      savedScale.set(1);
      translateX.set(withTiming(0));
      translateY.set(withTiming(0));
      savedX.set(0);
      savedY.set(0);
      runOnJS(onZoomChange)(false);
    };

    const pinch = Gesture.Pinch()
      .onUpdate((event) => {
        scale.set(Math.min(Math.max(savedScale.get() * event.scale, 1), MAX_SCALE));
      })
      .onEnd(() => {
        if (scale.get() <= 1.01) {
          reset();
          return;
        }
        savedScale.set(scale.get());
        runOnJS(onZoomChange)(true);
      });

    const pan = Gesture.Pan()
      // only while zoomed, otherwise it beats the pager to the swipe
      .enabled(zoomed)
      .averageTouches(true)
      .onUpdate((event) => {
        const currentScale = scale.get();
        if (currentScale <= 1) return;
        const boundX = (width * (currentScale - 1)) / 2;
        const boundY = (height * (currentScale - 1)) / 2;
        translateX.set(Math.min(Math.max(savedX.get() + event.translationX, -boundX), boundX));
        translateY.set(Math.min(Math.max(savedY.get() + event.translationY, -boundY), boundY));
      })
      .onEnd(() => {
        savedX.set(translateX.get());
        savedY.set(translateY.get());
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        if (scale.get() > 1) {
          reset();
          return;
        }
        scale.set(withTiming(DOUBLE_TAP_SCALE));
        savedScale.set(DOUBLE_TAP_SCALE);
        runOnJS(onZoomChange)(true);
      });

    return Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [zoomed, width, height, onZoomChange, scale, savedScale, translateX, translateY, savedX, savedY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, styles.page, animatedStyle]}>
        {uri ? (
          <Image source={uri} style={{ width, height }} contentFit="contain" transition={200} />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignSelf: 'center', textAlign: 'center', marginTop: '60%' },
  centeredBlock: { flex: 1, justifyContent: 'center' },
  page: { alignItems: 'center', justifyContent: 'center' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Scrim.control,
  },
  counter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: Scrim.control,
  },
});

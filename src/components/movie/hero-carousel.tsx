import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { imageUrl, ImageSize, mediaTitle, mediaYear, type Genre, type Media } from '@/api/tmdb';
import { Chip, IconButton, PrimaryButton } from '@/components/ui/buttons';
import { RatingBadge } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useMyList } from '@/store/my-list';
import { usePreferences } from '@/store/preferences';
import { AbsoluteFill, Colors, Gradients, Radius, Scrim, Spacing } from '@/constants/theme';

const HERO_MAX_HEIGHT = 560;

export interface HeroCarouselProps {
  items: Media[] | undefined;
  loading?: boolean;
  genres?: Genre[];
}

export function HeroCarousel({ items, loading, genres = [] }: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Media>>(null);
  const featured = items?.slice(0, 5) ?? [];
  const height = Math.min(Math.round(width * 1.15), HERO_MAX_HEIGHT);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  if (loading && !featured.length) {
    return (
      <View style={[styles.container, { height }]}>
        <Skeleton width="100%" height={height} radius={0} />
      </View>
    );
  }

  if (!featured.length) return null;

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={listRef}
        data={featured}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <HeroSlide item={item} genres={genres} height={height} width={width} />
        )}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={styles.dots} pointerEvents="none">
        {featured.map((item, i) => (
          <View key={item.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function HeroSlide({
  item,
  genres,
  height,
  width,
}: {
  item: Media;
  genres: Genre[];
  height: number;
  width: number;
}) {
  const router = useRouter();
  const { has, toggle } = useMyList();
  const saved = has(item.id);
  const { preferences } = usePreferences();
  const backdrop = imageUrl(
    item.backdrop_path ?? item.poster_path,
    preferences.dataSaver ? ImageSize.backdrop : ImageSize.backdropLarge,
  );
  const type = item.media_type === 'tv' ? 'tv' : 'movie';

  // list endpoints give ids only
  const genreNames = (item.genre_ids ?? [])
    .map((id) => genres.find((genre) => genre.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  const open = () => router.push(`/movie/${item.id}?type=${type}`);
  const play = () => router.push(`/movie/${item.id}?type=${type}&play=1`);

  return (
    <View style={{ width, height }}>
      <PressableScale onPress={open} scaleTo={1} style={styles.slideArtwork}>
        {backdrop ? (
          <Image source={backdrop} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroFallback]} />
        )}
      </PressableScale>

      <LinearGradient
        colors={Gradients.heroFade}
        locations={[0, 0.45, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient colors={Gradients.heroTop} style={styles.topScrim} pointerEvents="none" />

      <View style={styles.slideContent}>
        <AppText variant="display" numberOfLines={2} style={styles.heroTitle}>
          {mediaTitle(item)}
        </AppText>

        <View style={styles.metaRow}>
          <RatingBadge value={item.vote_average} variant="inline" />
          {mediaYear(item) ? (
            <>
              <View style={styles.metaDot} />
              <AppText variant="caption" tone="secondary">
                {mediaYear(item)}
              </AppText>
            </>
          ) : null}
        </View>

        {genreNames.length ? (
          <View style={styles.genreRow}>
            {genreNames.map((name) => (
              <Chip key={name} label={name} />
            ))}
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <PrimaryButton label="Play" icon="play" onPress={play} style={styles.playButton} />
          <IconButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? 'Remove from My List' : 'Add to My List'}
            active={saved}
            toggle
            size={52}
            onPress={() => toggle(item, type)}
          />
          <IconButton icon="information-circle-outline" label="Details" size={52} onPress={open} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  slideArtwork: { ...AbsoluteFill },
  heroFallback: { backgroundColor: Colors.surfaceElevated },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  slideContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  heroTitle: {
    textShadowColor: Scrim.textShadow,
    textShadowRadius: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
  },
  genreRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  playButton: { flex: 1 },
  dots: {
    position: 'absolute',
    bottom: Spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.textTertiary,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primaryLight,
  },
});

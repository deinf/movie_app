import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { imageUrl, ImageSize, mediaTitle, mediaYear, type Media } from '@/api/tmdb';
import { RatingBadge } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { usePreferences } from '@/store/preferences';
import { AbsoluteFill, Colors, Radius, Spacing } from '@/constants/theme';

export const POSTER_WIDTH = 124;
export const POSTER_HEIGHT = 186;

export interface PosterCardProps {
  item: Media;
  width?: number;
  showCaption?: boolean;
}

export function PosterCard({ item, width = POSTER_WIDTH, showCaption = true }: PosterCardProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const height = Math.round(width * 1.5);
  const posterSize = preferences.dataSaver
    ? ImageSize.posterSmall
    : width > 150
      ? ImageSize.posterLarge
      : ImageSize.poster;
  const poster = imageUrl(item.poster_path, posterSize);
  const title = mediaTitle(item);
  const year = mediaYear(item);
  const type = item.media_type === 'tv' ? 'tv' : 'movie';

  return (
    <PressableScale
      onPress={() => router.push(`/movie/${item.id}?type=${type}`)}
      accessibilityRole="button"
      accessibilityLabel={year ? `${title}, ${year}` : title}
      style={{ width }}>
      <View style={[styles.artwork, { width, height }]}>
        {poster ? (
          <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
        ) : (
          <PosterFallback title={title} />
        )}
        <RatingBadge value={item.vote_average} />
      </View>

      {showCaption ? (
        <View style={styles.caption}>
          <AppText variant="caption" numberOfLines={2}>
            {title}
          </AppText>
          {year ? (
            <AppText variant="micro" tone="tertiary">
              {year}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

export function PosterFallback({ title }: { title?: string }) {
  return (
    <View style={styles.fallback}>
      <Ionicons name="film-outline" size={26} color={Colors.textTertiary} />
      {title ? (
        <AppText variant="micro" tone="tertiary" numberOfLines={2} style={styles.fallbackTitle}>
          {title}
        </AppText>
      ) : null}
    </View>
  );
}

export function PosterSkeleton({ width = POSTER_WIDTH }: { width?: number }) {
  return (
    <View style={{ width, gap: Spacing.sm }}>
      <Skeleton width={width} height={Math.round(width * 1.5)} radius={Radius.lg} />
      <Skeleton width="85%" height={11} />
      <Skeleton width="45%" height={9} />
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
  },
  caption: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  fallback: {
    ...AbsoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  fallbackTitle: { textAlign: 'center' },
});

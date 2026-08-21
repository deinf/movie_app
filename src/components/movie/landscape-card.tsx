import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { imageUrl, ImageSize, mediaTitle, mediaYear, type Media } from '@/api/tmdb';
import { RatingBadge } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Glass, Gradients, Radius, Spacing } from '@/constants/theme';

export const LANDSCAPE_WIDTH = 220;
const LANDSCAPE_HEIGHT = Math.round((LANDSCAPE_WIDTH * 9) / 16);

export function LandscapeCard({ item }: { item: Media }) {
  const router = useRouter();
  const backdrop = imageUrl(item.backdrop_path ?? item.poster_path, ImageSize.backdrop);
  const title = mediaTitle(item);
  const airDate = mediaYear(item);

  return (
    <PressableScale
      onPress={() => router.push(`/movie/${item.id}?type=tv`)}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{ width: LANDSCAPE_WIDTH }}>
      <View style={styles.artwork}>
        {backdrop ? (
          <Image source={backdrop} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="tv-outline" size={24} color={Colors.textTertiary} />
          </View>
        )}

        <LinearGradient colors={Gradients.card} style={StyleSheet.absoluteFill} pointerEvents="none" />

        <View style={styles.playOrb}>
          <Ionicons name="play" size={16} color={Colors.text} />
        </View>

        <RatingBadge value={item.vote_average} align="right" />
      </View>

      <View style={styles.caption}>
        <AppText variant="caption" numberOfLines={1}>
          {title}
        </AppText>
        {airDate ? (
          <AppText variant="micro" tone="tertiary">
            Series since {airDate}
          </AppText>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function LandscapeSkeleton() {
  return (
    <View style={{ width: LANDSCAPE_WIDTH, gap: Spacing.sm }}>
      <Skeleton width={LANDSCAPE_WIDTH} height={LANDSCAPE_HEIGHT} radius={Radius.lg} />
      <Skeleton width="70%" height={11} />
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: {
    width: LANDSCAPE_WIDTH,
    height: LANDSCAPE_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  playOrb: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Glass.fill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
    paddingLeft: 2,
  },
  caption: { marginTop: Spacing.sm, gap: 2 },
});

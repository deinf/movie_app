import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { imageUrl, ImageSize, mediaDate, tmdb, type Media, type PersonDetail } from '@/api/tmdb';
import { PosterCard, PosterSkeleton } from '@/components/movie/poster-card';
import { ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { usePosterGrid } from '@/hooks/use-poster-grid';
import { AbsoluteFill, Colors, Gradients, MaxContentWidth, Radius, Scrim, Spacing } from '@/constants/theme';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tileWidth, gutter } = usePosterGrid();
  const [expanded, setExpanded] = useState(false);

  const { data, loading, error, refetch } = useAsync<PersonDetail>(() => tmdb.person(Number(id)), [id]);

  const credits = useMemo(() => {
    const cast = data?.combined_credits?.cast ?? [];
    const unique = new Map<number, Media>();
    for (const item of cast) {
      if (item.poster_path && !unique.has(item.id)) unique.set(item.id, item);
    }
    return [...unique.values()]
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 18);
  }, [data]);

  if (error) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ErrorState error={error} onRetry={refetch} />
        <BackButton top={insets.top + Spacing.sm} onPress={() => router.back()} />
      </View>
    );
  }

  const photo = imageUrl(data?.profile_path, ImageSize.posterLarge);
  const born = data?.birthday ? new Date(data.birthday).getFullYear() : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.huge }}>
        <View style={styles.header}>
          {photo ? (
            <Image source={photo} style={styles.headerImage} contentFit="cover" transition={300} />
          ) : (
            <View style={[styles.headerImage, styles.headerFallback]}>
              <Ionicons name="person" size={40} color={Colors.textTertiary} />
            </View>
          )}
          <LinearGradient
            colors={Gradients.heroFade}
            locations={[0, 0.5, 0.8, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient colors={Gradients.heroTop} style={styles.topScrim} pointerEvents="none" />

          <View style={styles.headerCaption}>
            {loading && !data ? (
              <AppText variant="title">Loading…</AppText>
            ) : (
              <>
                <AppText variant="title">{data?.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {[data?.known_for_department, born ? `Born ${born}` : null, data?.place_of_birth]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </>
            )}
          </View>
        </View>

        {data?.biography ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <AppText variant="section">Biography</AppText>
            <AppText variant="body" tone="secondary" numberOfLines={expanded ? undefined : 5}>
              {data.biography}
            </AppText>
            <PressableScale
              onPress={() => setExpanded((current) => !current)}
              scaleTo={0.97}
              tapSize={{ height: 25 }}
              accessibilityRole="button"
              style={styles.viewMore}>
              <AppText variant="caption" tone="accent">
                {expanded ? 'View Less' : 'View More'}
              </AppText>
            </PressableScale>
          </View>
        ) : null}

        {loading && !data ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <AppText variant="section">Known For</AppText>
            <View style={styles.grid}>
              {Array.from({ length: 6 }, (_, index) => (
                <PosterSkeleton key={index} width={tileWidth} />
              ))}
            </View>
          </View>
        ) : credits.length ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <AppText variant="section">Known For</AppText>
            <View style={styles.grid}>
              {credits.map((item) => (
                <PosterCard key={`${item.id}-${mediaDate(item)}`} item={item} width={tileWidth} />
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <AppText variant="section">Known For</AppText>
            <AppText variant="body" tone="tertiary">
              TMDB lists no credits with artwork for {data?.name ?? 'this person'} yet.
            </AppText>
          </View>
        )}
      </ScrollView>

      <BackButton top={insets.top + Spacing.sm} onPress={() => router.back()} />
    </View>
  );
}

function BackButton({ top, onPress }: { top: number; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      tapSize={{ width: 40, height: 40 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={[styles.backButton, { top }]}>
      <Ionicons name="chevron-back" size={22} color={Colors.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center' },
  header: { height: 420, justifyContent: 'flex-end' },
  headerImage: { ...AbsoluteFill, backgroundColor: Colors.surfaceElevated },
  headerFallback: { alignItems: 'center', justifyContent: 'center' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  headerCaption: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xs },
  backButton: {
    position: 'absolute',
    left: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Scrim.control,
  },
  section: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingTop: Spacing.xl, gap: Spacing.md },
  viewMore: { alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: Spacing.xl },
});

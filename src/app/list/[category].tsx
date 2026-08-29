import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tmdb, type Media, type Paged } from '@/api/tmdb';
import { PosterCard, PosterSkeleton } from '@/components/movie/poster-card';
import { ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { usePagedList } from '@/hooks/use-paged-list';
import { usePosterGrid } from '@/hooks/use-poster-grid';
import { Colors, Radius, Spacing } from '@/constants/theme';

const CATEGORIES = {
  popular: { title: 'Popular', fetch: tmdb.popular },
  top_rated: { title: 'Top Rated', fetch: tmdb.topRated },
  upcoming: { title: 'Coming Soon', fetch: tmdb.upcoming },
  now_playing: { title: 'In Theaters Now', fetch: tmdb.nowPlaying },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

const isCategory = (value: string | undefined): value is CategoryKey =>
  value !== undefined && value in CATEGORIES;

const EMPTY_PAGE: Paged<Media> = { page: 1, results: [], total_pages: 0, total_results: 0 };

export default function CategoryListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { columns, tileWidth, gutter } = usePosterGrid();

  const config = isCategory(category) ? CATEGORIES[category] : undefined;

  const fetchPage = useCallback(
    (page: number) => (config ? config.fetch(page) : Promise.resolve(EMPTY_PAGE)),
    [config],
  );

  const { items, loading, initialLoading, error, loadMore, retry } = usePagedList<Media>(
    fetchPage,
    category ?? '',
  );

  if (!config) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <AppText variant="section">Unknown category</AppText>
        <PressableScale onPress={() => router.back()} style={styles.linkBack} accessibilityRole="button">
          <AppText variant="caption" tone="accent">
            Go back
          </AppText>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <PressableScale
          onPress={() => router.back()}
          scaleTo={0.88}
          tapSize={{ width: 40, height: 40 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </PressableScale>
        <AppText variant="section">{config.title}</AppText>
        <View style={styles.backButton} />
      </View>

      {error && !items.length ? (
        <ErrorState error={error} onRetry={retry} />
      ) : initialLoading ? (
        <View style={[styles.skeletonGrid, { paddingHorizontal: gutter }]}>
          {Array.from({ length: columns * 3 }, (_, index) => (
            <PosterSkeleton key={index} width={tileWidth} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          key={columns}
          renderItem={({ item }) => <PosterCard item={item} width={tileWidth} />}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + Spacing.huge, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loading ? <ActivityIndicator color={Colors.primaryLight} style={styles.spinner} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  linkBack: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  grid: { gap: Spacing.xl },
  column: { gap: Spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  spinner: { marginVertical: Spacing.xl },
});

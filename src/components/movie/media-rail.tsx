import { FlatList, StyleSheet, View } from 'react-native';

import type { Media } from '@/api/tmdb';
import { POSTER_WIDTH, PosterCard, PosterSkeleton } from '@/components/movie/poster-card';
import { SectionHeader } from '@/components/ui/section-header';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

export interface MediaRailProps {
  title: string;
  items: Media[] | undefined;
  loading?: boolean;
  error?: Error;
  onSeeAll?: () => void;
  posterWidth?: number;
}

export function MediaRail({
  title,
  items,
  loading = false,
  error,
  onSeeAll,
  posterWidth = POSTER_WIDTH,
}: MediaRailProps) {
  if (error && !items?.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} onSeeAll={items?.length ? onSeeAll : undefined} />

      {loading && !items?.length ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2, 3].map((key) => (
            <PosterSkeleton key={key} width={posterWidth} />
          ))}
        </View>
      ) : items?.length ? (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PosterCard item={item} width={posterWidth} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
          initialNumToRender={6}
        />
      ) : (
        <AppText variant="caption" tone="tertiary" style={styles.empty}>
          Nothing to show here yet.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.xxl },
  listContent: { paddingHorizontal: Spacing.xl },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  empty: { paddingHorizontal: Spacing.xl },
});

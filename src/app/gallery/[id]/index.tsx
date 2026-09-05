import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { imageUrl, ImageSize, mediaTitle, tmdb, type MediaType, type MovieDetail } from '@/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { useStillGrid } from '@/hooks/use-poster-grid';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function GalleryGridScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: MediaType }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { columns, tileWidth, gutter } = useStillGrid();

  const mediaType: MediaType = type === 'tv' ? 'tv' : 'movie';
  const numericId = Number(id);

  const { data, loading, error, refetch } = useAsync<MovieDetail>(
    () => (mediaType === 'tv' ? tmdb.tv(numericId) : tmdb.movie(numericId)),
    [numericId, mediaType],
  );

  const stills = data?.images?.backdrops ?? [];

  const tileHeight = Math.round((tileWidth * 9) / 16);

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

        <View style={styles.headerText}>
          <AppText variant="section">Gallery</AppText>
          {data ? (
            <AppText variant="micro" tone="tertiary" numberOfLines={1}>
              {mediaTitle(data)}
              {stills.length ? ` · ${stills.length} images` : ''}
            </AppText>
          ) : null}
        </View>

        <View style={styles.backButton} />
      </View>

      {error && !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading && !data ? (
        <View style={[styles.skeletonGrid, { paddingHorizontal: gutter }]}>
          {Array.from({ length: columns * 4 }, (_, index) => (
            <Skeleton key={index} width={tileWidth} height={tileHeight} radius={Radius.md} />
          ))}
        </View>
      ) : !stills.length ? (
        <EmptyState
          icon="images-outline"
          title="No images"
          message="TMDB has no gallery artwork for this title yet."
        />
      ) : (
        <FlatList
          data={stills}
          keyExtractor={(still) => still.file_path}
          numColumns={columns}
          key={columns}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + Spacing.huge, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <PressableScale
              onPress={() =>
                router.push(`/gallery/${numericId}/photo?type=${mediaType}&index=${index}`)
              }
              scaleTo={0.96}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Open image ${index + 1} of ${stills.length} full screen`}
              style={{ width: tileWidth }}>
              <Image
                source={imageUrl(item.file_path, ImageSize.backdrop)}
                style={{ width: tileWidth, height: tileHeight, borderRadius: Radius.md }}
                contentFit="cover"
                transition={200}
              />
            </PressableScale>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  headerText: { flex: 1, alignItems: 'center', gap: 2 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  grid: { gap: Spacing.md },
  column: { gap: Spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});

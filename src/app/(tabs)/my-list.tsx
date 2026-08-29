import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Media } from '@/api/tmdb';
import { PosterCard } from '@/components/movie/poster-card';
import { EmptyState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { usePosterGrid } from '@/hooks/use-poster-grid';
import { useMyList, type SavedItem } from '@/store/my-list';
import { Colors, Radius, Scrim, Spacing, TabBarHeight } from '@/constants/theme';

function toMedia(item: SavedItem): Media {
  return {
    id: item.id,
    title: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: '',
    vote_average: item.vote_average,
    release_date: item.date,
    media_type: item.mediaType,
  };
}

export default function MyListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { columns, tileWidth, gutter } = usePosterGrid();
  const { items, ready, remove, clear } = useMyList();

  const confirmClear = () => {
    Alert.alert('Clear My List?', `This removes all ${items.length} saved titles.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <View>
          <AppText variant="title">My List</AppText>
          <AppText variant="caption" tone="secondary">
            {items.length === 0
              ? 'Saved titles land here'
              : `${items.length} title${items.length === 1 ? '' : 's'} saved`}
          </AppText>
        </View>

        {items.length > 0 ? (
          <PressableScale
            onPress={confirmClear}
            scaleTo={0.94}
            haptic
            tapSize={{ height: 33 }}
            accessibilityRole="button"
            accessibilityLabel="Clear all saved titles"
            style={styles.clearAll}>
            <AppText variant="caption" tone="accent">
              Clear all
            </AppText>
          </PressableScale>
        ) : null}
      </View>

      {!ready ? null : items.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Your list is empty"
          message="Tap the bookmark on any title to keep it here for later."
          actionLabel="Browse movies"
          onAction={() => router.push('/explore')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          numColumns={columns}
          key={columns}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: TabBarHeight + insets.bottom + Spacing.xxl, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View>
              <PosterCard item={toMedia(item)} width={tileWidth} />
              <PressableScale
                onPress={() => remove(item.id)}
                scaleTo={0.85}
                haptic
                tapSize={{ width: 28, height: 28 }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from My List`}
                style={styles.removeButton}>
                <Ionicons name="close" size={14} color={Colors.text} />
              </PressableScale>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  clearAll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  grid: { gap: Spacing.xl },
  column: { gap: Spacing.md },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Scrim.badge,
  },
});

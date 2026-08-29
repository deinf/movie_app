import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SORT_OPTIONS, tmdb, type DiscoverFilters, type Genre, type Media } from '@/api/tmdb';
import { FilterSheet } from '@/components/filter-sheet';
import { PosterCard, PosterSkeleton } from '@/components/movie/poster-card';
import { Chip } from '@/components/ui/buttons';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagedList } from '@/hooks/use-paged-list';
import { usePosterGrid } from '@/hooks/use-poster-grid';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { Colors, Radius, Spacing, TabBarHeight } from '@/constants/theme';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { columns, tileWidth, gutter } = usePosterGrid();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  const debouncedQuery = useDebounce(query.trim());
  const searching = debouncedQuery.length > 1;

  const genres = useAsync(() => tmdb.genres(), []);
  const recent = useRecentSearches();

  const fetchPage = useCallback(
    (page: number) => (searching ? tmdb.search(debouncedQuery, page) : tmdb.discover(filters, page)),
    [searching, debouncedQuery, filters],
  );

  const resetKey = searching ? `q:${debouncedQuery}` : `d:${JSON.stringify(filters)}`;
  const list = usePagedList<Media>(fetchPage, resetKey);

  const pending = list.loading || query.trim() !== debouncedQuery;

  const activeFilterCount = [filters.genreId, filters.minRating, filters.year, filters.sortBy].filter(
    (value) => value !== undefined,
  ).length;

  const submitSearch = () => {
    Keyboard.dismiss();
    if (searching) recent.remember(debouncedQuery);
  };

  const runRecentSearch = (term: string) => {
    setQuery(term);
    recent.remember(term);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={[styles.headerBlock, { paddingHorizontal: gutter }]}>
        <AppText variant="title">Explore</AppText>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={submitSearch}
              placeholder="Movies, series, people…"
              placeholderTextColor={Colors.textTertiary}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              selectionColor={Colors.primaryLight}
              accessibilityLabel="Search movies and series"
            />
            {query.length > 0 ? (
              <PressableScale
                onPress={() => setQuery('')}
                scaleTo={0.85}
                tapSize={{ width: 22, height: 22 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.clearButton}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </PressableScale>
            ) : null}
          </View>

          {!searching ? (
            <PressableScale
              onPress={() => setSheetOpen(true)}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel={
                activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'
              }
              style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}>
              <Ionicons
                name="options-outline"
                size={20}
                color={activeFilterCount ? Colors.primaryLight : Colors.textSecondary}
              />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <AppText variant="micro">{activeFilterCount}</AppText>
                </View>
              ) : null}
            </PressableScale>
          ) : null}
        </View>
      </View>

      {!searching ? (
        <ActiveFilterStrip
          filters={filters}
          genres={genres.data ?? []}
          onChange={setFilters}
          onOpenSheet={() => setSheetOpen(true)}
          gutter={gutter}
        />
      ) : null}

      {!searching && query.length === 0 && recent.searches.length > 0 ? (
        <RecentSearches
          gutter={gutter}
          searches={recent.searches}
          onSelect={runRecentSearch}
          onRemove={recent.remove}
          onClear={recent.clear}
        />
      ) : null}

      <ResultsGrid
        items={list.items}
        loading={pending}
        initialLoading={list.initialLoading || (pending && list.items.length === 0)}
        error={list.error}
        onRetry={list.retry}
        onEndReached={list.loadMore}
        columns={columns}
        tileWidth={tileWidth}
        gutter={gutter}
        searching={searching}
        query={debouncedQuery}
        bottomInset={TabBarHeight + insets.bottom + Spacing.xxl}
      />

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        genres={genres.data ?? []}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

function ActiveFilterStrip({
  filters,
  genres,
  onChange,
  onOpenSheet,
  gutter,
}: {
  filters: DiscoverFilters;
  genres: Genre[];
  onChange: (filters: DiscoverFilters) => void;
  onOpenSheet: () => void;
  gutter: number;
}) {
  const sortLabel = SORT_OPTIONS.find((option) => option.key === (filters.sortBy ?? 'popularity.desc'))?.label;
  const genreName = genres.find((genre) => genre.id === filters.genreId)?.name;

  return (
    <FlatList
      horizontal
      data={genres}
      keyExtractor={(genre) => String(genre.id)}
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={[styles.stripContent, { paddingHorizontal: gutter }]}
      ItemSeparatorComponent={() => <View style={styles.gapSm} />}
      ListHeaderComponent={
        <View style={styles.stripHeader}>
          <Chip label={sortLabel ?? 'Most popular'} selected onPress={onOpenSheet} />
          {genreName ? (
            <Chip label={genreName} selected onPress={() => onChange({ ...filters, genreId: undefined })} />
          ) : null}
          {filters.minRating ? (
            <Chip
              label={`${filters.minRating}+`}
              selected
              onPress={() => onChange({ ...filters, minRating: undefined })}
            />
          ) : null}
          {filters.year ? (
            <Chip
              label={String(filters.year)}
              selected
              onPress={() => onChange({ ...filters, year: undefined })}
            />
          ) : null}
        </View>
      }
      renderItem={({ item }) =>
        item.id === filters.genreId ? null : (
          <Chip label={item.name} onPress={() => onChange({ ...filters, genreId: item.id })} />
        )
      }
    />
  );
}

function RecentSearches({
  gutter,
  searches,
  onSelect,
  onRemove,
  onClear,
}: {
  gutter: number;
  searches: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}) {
  return (
    <View style={[styles.recentBlock, { paddingHorizontal: gutter }]}>
      <View style={styles.recentHeader}>
        <AppText variant="caption" tone="tertiary">
          Recent searches
        </AppText>
        <PressableScale
          onPress={onClear}
          scaleTo={0.94}
          tapSize={{ height: 17 }}
          accessibilityRole="button"
          accessibilityLabel="Clear recent searches">
          <AppText variant="caption" tone="accent">
            Clear
          </AppText>
        </PressableScale>
      </View>

      <View style={styles.recentItems}>
        {searches.map((term) => (
          <View key={term} style={styles.recentChip}>
            <PressableScale
              onPress={() => onSelect(term)}
              scaleTo={0.96}
              tapSize={{ height: 31 }}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${term}`}
              style={styles.recentChipLabel}>
              <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
              <AppText variant="caption" tone="secondary" numberOfLines={1}>
                {term}
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={() => onRemove(term)}
              scaleTo={0.8}
              tapSize={{ width: 20, height: 20 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${term} from recent searches`}
              style={styles.recentRemove}>
              <Ionicons name="close" size={12} color={Colors.textTertiary} />
            </PressableScale>
          </View>
        ))}
      </View>
    </View>
  );
}

interface ResultsGridProps {
  items: Media[];
  loading: boolean;
  initialLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  onEndReached: () => void;
  columns: number;
  tileWidth: number;
  gutter: number;
  searching: boolean;
  query: string;
  bottomInset: number;
}

function ResultsGrid({
  items,
  loading,
  initialLoading,
  error,
  onRetry,
  onEndReached,
  columns,
  tileWidth,
  gutter,
  searching,
  query,
  bottomInset,
}: ResultsGridProps) {
  if (error && items.length === 0) return <ErrorState error={error} onRetry={onRetry} />;

  if (initialLoading) {
    return (
      <View style={[styles.skeletonGrid, { paddingHorizontal: gutter }]}>
        {Array.from({ length: columns * 3 }, (_, index) => (
          <PosterSkeleton key={index} width={tileWidth} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return searching ? (
      <EmptyState
        icon="search-outline"
        title="No matches"
        message={`Nothing came back for “${query}”. Try a different title or spelling.`}
      />
    ) : (
      <EmptyState
        icon="film-outline"
        title="No titles match"
        message="Loosen a filter or two and there will be more to look at."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.media_type ?? 'movie'}-${item.id}`}
      numColumns={columns}
      // remount on a column change, FlatList can't re-flow in place
      key={columns}
      renderItem={({ item }) => <PosterCard item={item} width={tileWidth} />}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[styles.grid, { paddingBottom: bottomInset, paddingHorizontal: gutter }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        loading ? <ActivityIndicator color={Colors.primaryLight} style={styles.footerSpinner} /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { gap: Spacing.lg, marginBottom: Spacing.lg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    // android adds its own padding to inputs and breaks the fixed row height
    paddingVertical: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfacePressed,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  filterButtonActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryStrong,
  },
  strip: { flexGrow: 0, marginBottom: Spacing.lg },
  stripContent: { alignItems: 'center' },
  stripHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginRight: Spacing.sm },
  gapSm: { width: Spacing.sm },
  recentBlock: { gap: Spacing.md, marginBottom: Spacing.xl },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentItems: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingRight: Spacing.xs,
  },
  recentChipLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs + 3,
    maxWidth: 190,
  },
  recentRemove: {
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { gap: Spacing.xl },
  column: { gap: Spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  footerSpinner: { marginVertical: Spacing.xl },
});

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tmdb, type Genre, type Media, type Paged } from '@/api/tmdb';
import { HeroCarousel } from '@/components/movie/hero-carousel';
import { LandscapeCard, LandscapeSkeleton } from '@/components/movie/landscape-card';
import { MediaRail } from '@/components/movie/media-rail';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { AbsoluteFill, Colors, Radius, Scrim, Spacing, TabBarHeight } from '@/constants/theme';

interface HomeData {
  trending: Media[];
  popular: Media[];
  topRated: Media[];
  upcoming: Media[];
  nowPlaying: Media[];
  onTv: Media[];
  genres: Genre[];
}

const rail = (promise: Promise<Paged<Media>>): Promise<Media[]> =>
  promise.then((paged) => paged.results).catch(() => []);

const soft = <T,>(promise: Promise<T[]>): Promise<T[]> => promise.catch(() => []);

async function loadHome(): Promise<HomeData> {
  // awaited on its own: without a hero there is no screen, so this one failing is a real error
  const trending = await tmdb.trending().then((paged) => paged.results);
  const [popular, topRated, upcoming, nowPlaying, onTv, genres] = await Promise.all([
    rail(tmdb.popular()),
    rail(tmdb.topRated()),
    rail(tmdb.upcoming()),
    rail(tmdb.nowPlaying()),
    rail(tmdb.onTheAir()),
    soft(tmdb.genres()),
  ]);
  return { trending, popular, topRated, upcoming, nowPlaying, onTv, genres };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, error, refetch } = useAsync(loadHome, []);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  if (error && !data) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <ErrorState error={error} onRetry={refetch} />
      </View>
    );
  }

  const anyContent =
    !!data &&
    [data.trending, data.popular, data.topRated, data.upcoming, data.nowPlaying, data.onTv].some(
      (list) => list.length > 0,
    );

  if (data && !anyContent) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Nothing to show"
          message="TMDB returned no titles just now. This is usually temporary."
          actionLabel="Try again"
          onAction={refetch}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TabBarHeight + insets.bottom + Spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={refetch}
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.surface}
          />
        }>
        <HeroCarousel items={data?.trending} loading={loading} genres={data?.genres} />

        <MediaRail
          title="Recommendation for You"
          items={data?.popular}
          loading={loading}
          onSeeAll={() => router.push('/list/popular')}
        />

        <OnTvRail items={data?.onTv} loading={loading} />

        <MediaRail
          title="Top Rated"
          items={data?.topRated}
          loading={loading}
          onSeeAll={() => router.push('/list/top_rated')}
        />

        <MediaRail
          title="In Theaters Now"
          items={data?.nowPlaying}
          loading={loading}
          onSeeAll={() => router.push('/list/now_playing')}
        />

        <MediaRail
          title="Coming Soon"
          items={data?.upcoming}
          loading={loading}
          onSeeAll={() => router.push('/list/upcoming')}
        />
      </Animated.ScrollView>

      <HomeHeader scrollY={scrollY} />
    </View>
  );
}

function HomeHeader({ scrollY }: { scrollY: SharedValue<number> }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const greetingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 70], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [0, 70], [0, -8], Extrapolation.CLAMP) }],
  }));

  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [70, 130], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [70, 130], [8, 0], Extrapolation.CLAMP) }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [60, 130], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View
      style={[styles.header, { paddingTop: insets.top + Spacing.sm, minHeight: insets.top + 64 }]}
      pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]} pointerEvents="none">
        <BlurView intensity={40} tint="dark" style={styles.headerBackdrop} />
      </Animated.View>

      <View style={styles.headerRow} pointerEvents="box-none">
        <View style={styles.headerTitles} pointerEvents="none">
          <Animated.View style={greetingStyle}>
            <AppText variant="micro" tone="secondary">
              What&apos;s on tonight
            </AppText>
            <AppText variant="section">Discover</AppText>
          </Animated.View>

          <Animated.View style={[styles.headerCompact, compactStyle]}>
            <AppText variant="subtitle">Discover</AppText>
          </Animated.View>
        </View>

        <PressableScale
          onPress={() => router.push('/explore')}
          scaleTo={0.9}
          tapSize={{ width: 42, height: 42 }}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={styles.headerButton}>
          <Ionicons name="search" size={20} color={Colors.text} />
        </PressableScale>
      </View>
    </View>
  );
}

function OnTvRail({ items, loading }: { items: Media[] | undefined; loading: boolean }) {
  if (!loading && !items?.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="On TV" />
      {loading && !items?.length ? (
        <View style={styles.skeletonRow}>
          <LandscapeSkeleton />
          <LandscapeSkeleton />
        </View>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <LandscapeCard item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerBackdrop: {
    flex: 1,
    backgroundColor: Scrim.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  headerTitles: { flexShrink: 1, justifyContent: 'center', paddingVertical: Spacing.xs },
  headerCompact: {
    ...AbsoluteFill,
    justifyContent: 'center',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Scrim.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  section: { marginBottom: Spacing.xxl },
  listContent: { paddingHorizontal: Spacing.xl },
  skeletonRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl },
});

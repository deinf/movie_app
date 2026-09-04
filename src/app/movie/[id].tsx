import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Share, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatRuntime,
  imageUrl,
  ImageSize,
  mediaTitle,
  mediaYear,
  pickTrailer,
  providersForRegion,
  sortVideos,
  tmdb,
  type MediaType,
  type MovieDetail,
} from '@/api/tmdb';
import { deviceRegion } from '@/api/region';
import { CollectionRow } from '@/components/movie/collection-row';
import { CastCard, FactRow, ReviewCard, TrailerRow } from '@/components/movie/detail-parts';
import { EpisodesTab } from '@/components/movie/episodes';
import { WatchProviders } from '@/components/movie/providers';
import { PosterCard } from '@/components/movie/poster-card';
import { Chip, IconButton, PrimaryButton } from '@/components/ui/buttons';
import { RatingBadge } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/state-views';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useAsync } from '@/hooks/use-async';
import { usePosterGrid } from '@/hooks/use-poster-grid';
import { useMyList } from '@/store/my-list';
import { usePreferences } from '@/store/preferences';
import { Colors, Glass, Gradients, MaxContentWidth, Radius, Scrim, Spacing } from '@/constants/theme';

const HERO_HEIGHT = Math.round(Dimensions.get('window').width * 1.05);

type DetailTab = 'episodes' | 'similar' | 'about' | 'comments';

const watchHref = (key: string, title: string) =>
  `/watch/${key}?title=${encodeURIComponent(title)}` as const;

function tabsFor(mediaType: MediaType): { key: DetailTab; label: string }[] {
  return [
    ...(mediaType === 'tv' ? [{ key: 'episodes' as const, label: 'Episodes' }] : []),
    { key: 'similar', label: 'More Like This' },
    { key: 'about', label: 'About' },
    { key: 'comments', label: 'Comments' },
  ];
}

export default function MovieDetailScreen() {
  const { id, type, play } = useLocalSearchParams<{ id: string; type?: MediaType; play?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mediaType: MediaType = type === 'tv' ? 'tv' : 'movie';
  const numericId = Number(id);

  const { data, loading, error, refetch } = useAsync<MovieDetail>(
    () => (mediaType === 'tv' ? tmdb.tv(numericId) : tmdb.movie(numericId)),
    [numericId, mediaType],
  );

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const autoPlayed = useRef(false);
  useEffect(() => {
    if (play !== '1' || autoPlayed.current || !data) return;
    const trailer = pickTrailer(data.videos?.results);
    if (!trailer) return;
    autoPlayed.current = true;
    router.push(watchHref(trailer.key, trailer.name));
  }, [play, data, router]);

  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [HERO_HEIGHT * 0.45, HERO_HEIGHT * 0.75],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  if (error) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ErrorState error={error} onRetry={refetch} />
        <BackButton top={insets.top + Spacing.sm} onPress={() => router.back()} />
      </View>
    );
  }

  if (loading && !data) return <DetailSkeleton />;
  if (!data) return null;

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.huge }}>
        <Hero detail={data} scrollY={scrollY} mediaType={mediaType} />
        <DetailBody detail={data} mediaType={mediaType} />
      </Animated.ScrollView>

      <Animated.View
        style={[styles.topBar, { paddingTop: insets.top, height: insets.top + 56 }, topBarStyle]}
        pointerEvents="none">
        <AppText variant="subtitle" numberOfLines={1} style={styles.topBarTitle}>
          {mediaTitle(data)}
        </AppText>
      </Animated.View>

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

function Hero({
  detail,
  scrollY,
  mediaType,
}: {
  detail: MovieDetail;
  scrollY: SharedValue<number>;
  mediaType: MediaType;
}) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const backdrop = imageUrl(
    detail.backdrop_path ?? detail.poster_path,
    preferences.dataSaver ? ImageSize.backdrop : ImageSize.backdropLarge,
  );
  const trailer = pickTrailer(detail.videos?.results);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.get(),
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.5],
        ),
      },
      { scale: interpolate(scrollY.get(), [-HERO_HEIGHT, 0], [2.2, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.hero}>
      <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
        {backdrop ? (
          <Image source={backdrop} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroFallback]} />
        )}
      </Animated.View>

      <LinearGradient
        colors={Gradients.heroFade}
        locations={[0, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient colors={Gradients.heroTop} style={styles.heroTopScrim} pointerEvents="none" />

      {trailer ? (
        <PressableScale
          onPress={() => router.push(watchHref(trailer.key, trailer.name))}
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Play trailer: ${trailer.name}`}
          style={styles.playOrb}>
          <Ionicons name="play" size={28} color={Colors.text} style={styles.playGlyph} />
        </PressableScale>
      ) : null}

      <View style={styles.heroCaption}>
        <AppText variant="title" style={styles.heroTitle}>
          {mediaTitle(detail)}
        </AppText>
        {detail.tagline ? (
          <AppText variant="caption" tone="secondary" style={styles.heroTagline} numberOfLines={2}>
            {detail.tagline}
          </AppText>
        ) : null}
        <ActionRow detail={detail} mediaType={mediaType} />
      </View>
    </View>
  );
}

function ActionRow({ detail, mediaType }: { detail: MovieDetail; mediaType: MediaType }) {
  const { has, toggle } = useMyList();
  const saved = has(detail.id);
  const path = mediaType === 'tv' ? 'tv' : 'movie';

  const share = () => {
    const title = mediaTitle(detail);
    // share the tmdb page, a movieapp:// link is dead for anyone without the app
    const url = `https://www.themoviedb.org/${path}/${detail.id}`;
    Share.share(
      {
        title,
        url,
        message: `${title}${detail.tagline ? `: ${detail.tagline}` : ''}\n${url}`,
      },
      { subject: title, dialogTitle: `Share ${title}` },
    ).catch(() => {});
  };

  return (
    <View style={styles.actionRow}>
      <IconButton
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        label={saved ? 'Remove from My List' : 'Add to My List'}
        active={saved}
        toggle
        onPress={() => toggle(detail, mediaType)}
      />
      <IconButton icon="share-social-outline" label="Share" onPress={share} />
      <IconButton
        icon="open-outline"
        label="Open on TMDB"
        onPress={() => WebBrowser.openBrowserAsync(`https://www.themoviedb.org/${path}/${detail.id}`)}
      />
    </View>
  );
}

function DetailBody({ detail, mediaType }: { detail: MovieDetail; mediaType: MediaType }) {
  const router = useRouter();
  const tabs = tabsFor(mediaType);
  const [tab, setTab] = useState<DetailTab>(tabs[0].key);
  const [expanded, setExpanded] = useState(false);

  const region = deviceRegion();
  const { offers, link } = providersForRegion(detail['watch/providers']?.results, region);

  const runtime = formatRuntime(detail.runtime ?? detail.episode_run_time?.[0]);
  const year = mediaYear(detail);
  const country = detail.production_countries?.[0]?.name;
  const trailers = sortVideos(detail.videos?.results).slice(0, 3);

  return (
    <View style={styles.body}>
      <View style={styles.metaRow}>
        <RatingBadge value={detail.vote_average} variant="inline" />
        {runtime ? (
          <>
            <Dot />
            <AppText variant="caption" tone="secondary">
              {runtime}
            </AppText>
          </>
        ) : null}
        {detail.genres?.length ? (
          <>
            <Dot />
            <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.flexShrink}>
              {detail.genres.map((genre) => genre.name).join(', ')}
            </AppText>
          </>
        ) : null}
      </View>

      <View style={styles.tagRow}>
        {detail.genres?.[0] ? <Chip label={detail.genres[0].name} /> : null}
        {year ? <Chip label={year} /> : null}
        {country ? <Chip label={country} /> : null}
      </View>

      {detail.overview ? (
        <View style={styles.overviewBlock}>
          <AppText variant="body" tone="secondary" numberOfLines={expanded ? undefined : 4}>
            {detail.overview}
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

      <WatchProviders offers={offers} link={link} region={region} />

      {trailers.length ? (
        <View style={styles.trailerList}>
          {trailers.map((video) => (
            <TrailerRow
              key={video.id}
              video={video}
              onPress={() => router.push(watchHref(video.key, video.name))}
            />
          ))}
        </View>
      ) : null}

      {detail.belongs_to_collection ? (
        <CollectionRow collection={detail.belongs_to_collection} currentId={detail.id} />
      ) : null}

      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'episodes' ? <EpisodesTab tvId={detail.id} seasons={detail.seasons ?? []} /> : null}
      {tab === 'similar' ? <SimilarTab detail={detail} /> : null}
      {tab === 'about' ? <AboutTab detail={detail} mediaType={mediaType} /> : null}
      {tab === 'comments' ? <CommentsTab detail={detail} mediaType={mediaType} /> : null}
    </View>
  );
}

function SegmentedTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: DetailTab; label: string }[];
  value: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <View style={styles.segmented}>
      {tabs.map((item) => {
        const active = item.key === value;
        return (
          <PressableScale
            key={item.key}
            onPress={() => onChange(item.key)}
            scaleTo={0.96}
            haptic
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}>
            <AppText variant="caption" tone={active ? 'primary' : 'tertiary'}>
              {item.label}
            </AppText>
            <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
          </PressableScale>
        );
      })}
    </View>
  );
}

function SimilarTab({ detail }: { detail: MovieDetail }) {
  const { tileWidth } = usePosterGrid(150, 260);
  const items = (
    detail.recommendations?.results?.length ? detail.recommendations.results : detail.similar?.results ?? []
  ).slice(0, 12);

  if (!items.length) return <TabEmpty message="No related titles yet." />;

  return (
    <View style={styles.similarGrid}>
      {items.map((item) => (
        <PosterCard key={item.id} item={item} width={tileWidth} />
      ))}
    </View>
  );
}

function AboutTab({ detail, mediaType }: { detail: MovieDetail; mediaType: MediaType }) {
  const router = useRouter();
  const languages = detail.spoken_languages?.map((language) => language.english_name).join(', ');
  const countries = detail.production_countries?.map((country) => country.name).join(', ');
  const cast = detail.credits?.cast?.slice(0, 12) ?? [];
  const directors = detail.credits?.crew?.filter((member) => member.job === 'Director') ?? [];
  const allStills = detail.images?.backdrops ?? [];
  const stills = allStills.slice(0, 6);

  const money = (value: number) => (value > 0 ? `$${value.toLocaleString('en-US')}` : null);
  const budget = money(detail.budget);
  const revenue = money(detail.revenue);

  return (
    <View style={styles.tabContent}>
      <View style={styles.factList}>
        {detail.status ? <FactRow label="Status" value={detail.status} /> : null}
        {directors.length ? (
          <FactRow label="Director" value={directors.map((person) => person.name).join(', ')} />
        ) : null}
        {languages ? <FactRow label="Audio track" value={languages} /> : null}
        {countries ? <FactRow label="Country" value={countries} /> : null}
        {mediaType === 'tv' && detail.number_of_seasons ? (
          <FactRow
            label="Seasons"
            value={`${detail.number_of_seasons} season${detail.number_of_seasons === 1 ? '' : 's'}, ${detail.number_of_episodes ?? 0} episodes`}
          />
        ) : null}
        {mediaType === 'movie' && budget ? <FactRow label="Budget" value={budget} /> : null}
        {mediaType === 'movie' && revenue ? <FactRow label="Revenue" value={revenue} /> : null}
      </View>

      {cast.length ? (
        <View style={styles.subSection}>
          <AppText variant="subtitle">Cast and Crew</AppText>
          <FlatList
            horizontal
            data={cast}
            keyExtractor={(member) => `${member.id}-${member.order}`}
            renderItem={({ item }) => <CastCard member={item} />}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gapMd} />}
          />
        </View>
      ) : null}

      {stills.length ? (
        <View style={styles.subSection}>
          <PressableScale
            onPress={() => router.push(`/gallery/${detail.id}?type=${mediaType}`)}
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={`Gallery, ${allStills.length} images`}
            style={styles.galleryHeader}>
            <AppText variant="subtitle">Gallery</AppText>
            <View style={styles.galleryCount}>
              <AppText variant="caption" tone="accent">
                {allStills.length}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={Colors.primaryLight} />
            </View>
          </PressableScale>
          <FlatList
            horizontal
            data={stills}
            keyExtractor={(still) => still.file_path}
            renderItem={({ item, index }) => (
              <PressableScale
                onPress={() =>
                  router.push(`/gallery/${detail.id}/photo?type=${mediaType}&index=${index}`)
                }
                scaleTo={0.96}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Open image ${index + 1} of ${allStills.length} full screen`}>
                <Image
                  source={imageUrl(item.file_path, ImageSize.backdrop)}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={220}
                />
              </PressableScale>
            )}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gapMd} />}
          />
        </View>
      ) : null}
    </View>
  );
}

function CommentsTab({ detail, mediaType }: { detail: MovieDetail; mediaType: MediaType }) {
  const reviews = detail.reviews?.results ?? [];
  const path = mediaType === 'tv' ? 'tv' : 'movie';

  if (!reviews.length) {
    return <TabEmpty message="No reviews have been written for this title yet." />;
  }

  return (
    <View style={styles.tabContent}>
      {reviews.slice(0, 5).map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      <PrimaryButton
        label="Read all on TMDB"
        icon="chatbubble-ellipses-outline"
        onPress={() =>
          WebBrowser.openBrowserAsync(`https://www.themoviedb.org/${path}/${detail.id}/reviews`)
        }
      />
    </View>
  );
}

function TabEmpty({ message }: { message: string }) {
  return (
    <View style={styles.tabEmpty}>
      <AppText variant="body" tone="tertiary" style={styles.centerText}>
        {message}
      </AppText>
    </View>
  );
}

function Dot() {
  return <View style={styles.dot} />;
}

function DetailSkeleton() {
  return (
    <View style={styles.screen}>
      <Skeleton width="100%" height={HERO_HEIGHT} radius={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={24} />
        <Skeleton width="45%" height={14} />
        <Skeleton width="100%" height={72} />
        <Skeleton width="100%" height={66} radius={Radius.lg} />
        <Skeleton width="100%" height={66} radius={Radius.lg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  gapMd: { width: Spacing.md },

  hero: { height: HERO_HEIGHT, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroFallback: { backgroundColor: Colors.surfaceElevated },
  heroTopScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  playOrb: {
    width: 68,
    height: 68,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Glass.accentFill,
    borderWidth: 1,
    borderColor: Glass.border,
  },
  playGlyph: { marginLeft: 3 },
  heroCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.lg,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTitle: { textAlign: 'center', textShadowColor: Scrim.textShadow, textShadowRadius: 12 },
  heroTagline: { textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },

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
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.huge + Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  topBarTitle: { textAlign: 'center' },

  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flexShrink: { flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textTertiary },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  overviewBlock: { gap: Spacing.xs },
  viewMore: { alignSelf: 'flex-start', paddingVertical: Spacing.xs },
  trailerList: { gap: Spacing.md },

  segmented: {
    flexDirection: 'row',
    gap: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginTop: Spacing.sm,
  },
  segment: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  segmentUnderline: { height: 2, width: '100%', borderRadius: 2, backgroundColor: 'transparent' },
  segmentUnderlineActive: { backgroundColor: Colors.primary },

  tabContent: { gap: Spacing.xl },
  tabEmpty: { paddingVertical: Spacing.huge, alignItems: 'center' },
  similarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  factList: { gap: Spacing.xs },
  subSection: { gap: Spacing.md },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryCount: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  galleryImage: {
    width: 200,
    height: 112,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
  },
});

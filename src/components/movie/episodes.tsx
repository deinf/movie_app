import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import {
  formatRuntime,
  imageUrl,
  ImageSize,
  tmdb,
  type Episode,
  type SeasonSummary,
} from '@/api/tmdb';
import { Chip } from '@/components/ui/buttons';
import { Skeleton } from '@/components/ui/skeleton';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { Colors, Radius, Scrim, Spacing } from '@/constants/theme';

export interface EpisodesTabProps {
  tvId: number;
  seasons: SeasonSummary[];
}

export function EpisodesTab({ tvId, seasons }: EpisodesTabProps) {
  const browsable = seasons.filter((season) => season.season_number > 0 && season.episode_count > 0);
  const [selected, setSelected] = useState(browsable[0]?.season_number ?? 1);

  const { data, loading, error } = useAsync(() => tmdb.season(tvId, selected), [tvId, selected]);

  if (!browsable.length) {
    return (
      <View style={styles.empty}>
        <AppText variant="body" tone="tertiary" style={styles.centerText}>
          No season information yet.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={browsable}
        keyExtractor={(season) => String(season.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.seasonStrip}
        ItemSeparatorComponent={() => <View style={styles.gapSm} />}
        renderItem={({ item }) => (
          <Chip
            label={item.name}
            selected={item.season_number === selected}
            onPress={() => setSelected(item.season_number)}
          />
        )}
      />

      {error ? (
        <AppText variant="body" tone="tertiary" style={styles.centerText}>
          Couldn&apos;t load this season.
        </AppText>
      ) : loading && !data ? (
        <View style={styles.list}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={styles.row}>
              <Skeleton width={116} height={66} radius={Radius.md} />
              <View style={styles.rowBody}>
                <Skeleton width="70%" height={13} />
                <Skeleton width="40%" height={10} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {(data?.episodes ?? []).map((episode) => (
            <EpisodeRow key={episode.id} episode={episode} />
          ))}
        </View>
      )}
    </View>
  );
}

function EpisodeRow({ episode }: { episode: Episode }) {
  const still = imageUrl(episode.still_path, ImageSize.still);
  const runtime = formatRuntime(episode.runtime);
  const aired = episode.air_date
    ? new Date(`${episode.air_date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.row}>
      <View style={styles.still}>
        {still ? (
          <Image source={still} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="tv-outline" size={20} color={Colors.textTertiary} />
        )}
        <View style={styles.numberTag}>
          <AppText variant="micro">{episode.episode_number}</AppText>
        </View>
      </View>

      <View style={styles.rowBody}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {episode.name}
        </AppText>
        <AppText variant="micro" tone="tertiary">
          {[aired, runtime].filter(Boolean).join(' · ') || 'Air date unknown'}
        </AppText>
        {episode.overview ? (
          <AppText variant="caption" tone="secondary" numberOfLines={2}>
            {episode.overview}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  seasonStrip: { paddingRight: Spacing.xl, alignItems: 'center' },
  gapSm: { width: Spacing.sm },
  list: { gap: Spacing.md },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  still: {
    width: 116,
    height: 66,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberTag: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Scrim.badge,
    borderTopRightRadius: Radius.sm,
  },
  rowBody: { flex: 1, gap: 3, justifyContent: 'center' },
  empty: { paddingVertical: Spacing.huge, alignItems: 'center' },
  centerText: { textAlign: 'center' },
});

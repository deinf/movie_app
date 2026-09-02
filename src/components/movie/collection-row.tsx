import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { imageUrl, ImageSize, tmdb, type CollectionRef } from '@/api/tmdb';
import { PosterCard } from '@/components/movie/poster-card';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { AbsoluteFill, Colors, Radius, Scrim, Spacing } from '@/constants/theme';

export function CollectionRow({ collection, currentId }: { collection: CollectionRef; currentId: number }) {
  const { data } = useAsync(() => tmdb.collection(collection.id), [collection.id]);

  const parts = (data?.parts ?? [])
    .filter((part) => part.id !== currentId && part.poster_path)
    .sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''));

  if (!parts.length) return null;

  const banner = imageUrl(collection.backdrop_path, ImageSize.backdrop);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {banner ? (
          <Image source={banner} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
        ) : null}
        <View style={styles.headerScrim} />
        <AppText variant="subtitle" numberOfLines={2} style={styles.headerTitle}>
          {collection.name}
        </AppText>
      </View>

      <View style={styles.parts}>
        {parts.map((part) => (
          <PosterCard key={part.id} item={part} width={96} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: {
    height: 88,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  headerScrim: { ...AbsoluteFill, backgroundColor: Scrim.banner },
  headerTitle: { textShadowColor: Scrim.textShadow, textShadowRadius: 8 },
  parts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});

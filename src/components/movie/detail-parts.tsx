import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  imageUrl,
  ImageSize,
  youtubeThumb,
  type CastMember,
  type Review,
  type Video,
} from '@/api/tmdb';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AbsoluteFill, Colors, Glass, Radius, Scrim, Spacing } from '@/constants/theme';

export function CastCard({ member }: { member: CastMember }) {
  const router = useRouter();
  const photo = imageUrl(member.profile_path, ImageSize.profile);
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  return (
    <PressableScale
      onPress={() => router.push(`/person/${member.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${member.name} as ${member.character}`}
      style={styles.castCard}>
      <View style={styles.avatar}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
        ) : (
          <AppText variant="subtitle" tone="tertiary">
            {initials}
          </AppText>
        )}
      </View>
      <AppText variant="micro" numberOfLines={1} style={styles.castText}>
        {member.name}
      </AppText>
      {member.character ? (
        <AppText variant="micro" tone="tertiary" numberOfLines={1} style={styles.castText}>
          {member.character}
        </AppText>
      ) : null}
    </PressableScale>
  );
}

export function TrailerRow({ video, onPress }: { video: Video; onPress: () => void }) {
  const published = video.published_at ? new Date(video.published_at) : null;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.name}`}
      style={styles.trailerRow}>
      <View style={styles.trailerThumb}>
        <Image
          source={youtubeThumb(video.key)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
        />
        <View style={styles.trailerScrim} />
        <View style={styles.playOrbSmall}>
          <Ionicons name="play" size={14} color={Colors.text} />
        </View>
        {video.official ? (
          <View style={styles.officialTag}>
            <AppText variant="micro">OFFICIAL</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.trailerMeta}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {video.name}
        </AppText>
        <AppText variant="micro" tone="tertiary">
          {video.type}
          {published ? ` · ${published.getFullYear()}` : ''}
        </AppText>
      </View>

      <Ionicons name="logo-youtube" size={20} color={Colors.textTertiary} />
    </PressableScale>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function ReviewCard({ review }: { review: Review }) {
  const raw = review.author_details.avatar_path;
  // some avatar_path values are a full gravatar url with a leading slash
  const avatar = raw?.startsWith('/http') ? raw.slice(1) : imageUrl(raw, ImageSize.profile);
  const rating = review.author_details.rating;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          {avatar ? (
            <Image source={avatar} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
          ) : (
            <Ionicons name="person" size={16} color={Colors.textTertiary} />
          )}
        </View>
        <View style={styles.reviewIdentity}>
          <AppText variant="bodyStrong">{review.author}</AppText>
          <AppText variant="micro" tone="tertiary">
            {timeAgo(review.created_at)}
          </AppText>
        </View>
        {rating ? (
          <View style={styles.reviewScore}>
            <Ionicons name="star" size={12} color={Colors.rating} />
            <AppText variant="micro">{rating.toFixed(1)}</AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="body" tone="secondary" numberOfLines={6}>
        {review.content.trim()}
      </AppText>
    </View>
  );
}

export function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <AppText variant="body" tone="tertiary" style={styles.factLabel}>
        {label}
      </AppText>
      <AppText variant="body" style={styles.factValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  castCard: { width: 76, gap: Spacing.xs, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  castText: { textAlign: 'center' },

  trailerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  trailerThumb: {
    width: 116,
    height: 66,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailerScrim: { ...AbsoluteFill, backgroundColor: Scrim.thumb },
  playOrbSmall: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Glass.fill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
    paddingLeft: 2,
  },
  officialTag: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    backgroundColor: Scrim.badge,
    borderTopRightRadius: Radius.sm,
  },
  trailerMeta: { flex: 1, gap: 2 },

  reviewCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewIdentity: { flex: 1, gap: 2 },
  reviewScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
  },

  factRow: { flexDirection: 'row', gap: Spacing.lg, paddingVertical: Spacing.sm },
  factLabel: { width: 108 },
  factValue: { flex: 1 },
});

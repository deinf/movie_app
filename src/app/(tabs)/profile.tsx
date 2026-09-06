import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { clearCache } from '@/api/cache';
import { usePreferences } from '@/store/preferences';
import { countPendingReleases, requestReminderPermission, REMINDERS_SUPPORTED } from '@/store/reminders';
import { useMyList } from '@/store/my-list';
import { Colors, Radius, Spacing, TabBarHeight } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { items } = useMyList();
  const { preferences, toggle } = usePreferences();
  const [clearing, setClearing] = useState(false);

  const pendingReleases = countPendingReleases(items);

  const clearCachedData = async () => {
    setClearing(true);
    try {
      await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache(), clearCache()]);
      Alert.alert('Cache cleared', 'Artwork and listings will be fetched again as you browse.');
    } catch {
      Alert.alert('Could not clear cache', 'Try again in a moment.');
    } finally {
      setClearing(false);
    }
  };

  const toggleNotifications = async () => {
    if (preferences.notifications) {
      toggle('notifications');
      return;
    }
    // expo go can't schedule these at all, so say that instead of sending them to settings
    if (!REMINDERS_SUPPORTED) {
      Alert.alert(
        'Not available in Expo Go',
        'Release reminders need a development or production build. Run `npm run ios` or `npm run android` to try them.',
      );
      return;
    }
    const granted = await requestReminderPermission();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Enable notifications for this app in Settings to get release-day reminders.',
      );
      return;
    }
    toggle('notifications');
  };

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: TabBarHeight + insets.bottom + Spacing.xxl },
      ]}>
      <AppText variant="title">Profile</AppText>

      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color={Colors.primaryLight} />
        </View>
        <View style={styles.identityText}>
          <AppText variant="subtitle">Guest</AppText>
          <AppText variant="caption" tone="secondary">
            Browsing without an account
          </AppText>
        </View>
        <View style={styles.savedCount}>
          <AppText variant="subtitle" tone="accent">
            {items.length}
          </AppText>
          <AppText variant="micro" tone="tertiary">
            saved
          </AppText>
        </View>
      </View>

      <Section title="Preferences">
        <ToggleRow
          icon="notifications-outline"
          label="Release reminders"
          description={
            !REMINDERS_SUPPORTED
              ? 'Needs a development build, unavailable in Expo Go'
              : preferences.notifications && pendingReleases > 0
                ? `${pendingReleases} upcoming title${pendingReleases === 1 ? '' : 's'} in My List`
                : 'Get told when a saved title comes out'
          }
          value={REMINDERS_SUPPORTED && preferences.notifications}
          onToggle={toggleNotifications}
        />
        <ToggleRow
          icon="play-circle-outline"
          label="Autoplay trailers"
          description="Start trailers as soon as they open"
          value={preferences.autoplayTrailers}
          onToggle={() => toggle('autoplayTrailers')}
        />
        <ToggleRow
          icon="cellular-outline"
          label="Data saver"
          description="Load lower-resolution artwork"
          value={preferences.dataSaver}
          onToggle={() => toggle('dataSaver')}
          last
        />
      </Section>

      <Section title="Storage">
        <ActionRow
          icon="trash-outline"
          label={clearing ? 'Clearing…' : 'Clear cached data'}
          description="Free up space used by artwork and saved listings"
          onPress={clearCachedData}
          last
        />
      </Section>

      <Section title="About">
        <ActionRow
          icon="information-circle-outline"
          label="Powered by TMDB"
          description="Browse the full database on themoviedb.org"
          onPress={() => WebBrowser.openBrowserAsync('https://www.themoviedb.org/')}
        />
        <ActionRow
          icon="document-text-outline"
          label="TMDB terms of use"
          onPress={() => WebBrowser.openBrowserAsync('https://www.themoviedb.org/terms-of-use')}
          last
        />
      </Section>

      <AppText variant="micro" tone="tertiary" style={styles.attribution}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </AppText>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" tone="tertiary" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface RowProps {
  icon: IoniconName;
  label: string;
  description?: string;
  last?: boolean;
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onToggle,
  last,
}: RowProps & { value: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <RowIcon icon={icon} />
      <RowText label={label} description={description} />
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.surfacePressed, true: Colors.primary }}
        thumbColor={Colors.text}
        ios_backgroundColor={Colors.surfacePressed}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ActionRow({ icon, label, description, onPress, last }: RowProps & { onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.row, !last && styles.rowDivider]}>
      <RowIcon icon={icon} />
      <RowText label={label} description={description} />
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </PressableScale>
  );
}

function RowIcon({ icon }: { icon: IoniconName }) {
  return (
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={Colors.primaryLight} />
    </View>
  );
}

function RowText({ label, description }: { label: string; description?: string }) {
  return (
    <View style={styles.rowText}>
      <AppText variant="bodyStrong">{label}</AppText>
      {description ? (
        <AppText variant="micro" tone="tertiary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  identityText: { flex: 1, gap: 2 },
  savedCount: { alignItems: 'center' },
  section: { gap: Spacing.sm },
  sectionTitle: { paddingLeft: Spacing.xs },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  rowText: { flex: 1, gap: 2 },
  attribution: { textAlign: 'center', paddingHorizontal: Spacing.lg },
});

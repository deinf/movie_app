import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { imageUrl, ImageSize, type ProviderOffer } from '@/api/tmdb';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/constants/theme';

const KIND_LABEL: Record<ProviderOffer['kind'], string> = {
  stream: 'Stream',
  free: 'Free',
  rent: 'Rent',
  buy: 'Buy',
};

export interface WatchProvidersProps {
  offers: ProviderOffer[];
  link?: string;
  region: string;
}

export function WatchProviders({ offers, link, region }: WatchProvidersProps) {
  if (!offers.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="subtitle">Where to watch</AppText>
        <AppText variant="micro" tone="tertiary">
          {region}
        </AppText>
      </View>

      <View style={styles.grid}>
        {offers.slice(0, 8).map(({ provider, kind }) => {
          const logo = imageUrl(provider.logo_path, ImageSize.logo);
          return (
            <PressableScale
              key={provider.provider_id}
              onPress={() => (link ? WebBrowser.openBrowserAsync(link) : undefined)}
              disabled={!link}
              scaleTo={0.94}
              accessibilityRole="button"
              accessibilityLabel={`${provider.provider_name}, ${KIND_LABEL[kind]}`}
              style={styles.provider}>
              <View style={styles.logo}>
                {logo ? (
                  <Image source={logo} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                ) : (
                  <AppText variant="micro" tone="tertiary">
                    {provider.provider_name.slice(0, 2)}
                  </AppText>
                )}
              </View>
              <AppText variant="micro" tone="tertiary" numberOfLines={1} style={styles.providerLabel}>
                {KIND_LABEL[kind]}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <AppText variant="micro" tone="tertiary">
        Availability data by JustWatch
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  provider: { width: 56, alignItems: 'center', gap: Spacing.xs },
  logo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLabel: { textAlign: 'center' },
});

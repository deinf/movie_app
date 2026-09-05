import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { youtubeUrl } from '@/api/tmdb';
import { PrimaryButton } from '@/components/ui/buttons';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { usePreferences } from '@/store/preferences';
import { AbsoluteFill, Colors, Radius, Spacing } from '@/constants/theme';

type Status = 'loading' | 'ready' | 'error';

// youtube refuses embeds with no Referer since jul 2025 (error 153), and wkwebview sends none
const EMBED_REFERER = 'https://movie-app.local/';

const PROBE = `
(function () {
  setTimeout(function () {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: document.querySelector('.ytp-error') ? 'error' : 'ready' })
    );
  }, 1800);
})();
true;
`;

export default function WatchScreen() {
  const { videoKey, title } = useLocalSearchParams<{ videoKey: string; title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openOnYouTube = () => WebBrowser.openBrowserAsync(youtubeUrl(videoKey)).catch(() => {});

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          scaleTo={0.88}
          tapSize={{ width: 40, height: 40 }}
          accessibilityRole="button"
          accessibilityLabel="Close player"
          style={styles.headerButton}>
          <Ionicons name="chevron-down" size={22} color={Colors.text} />
        </PressableScale>

        <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.headerTitle}>
          {title ?? 'Trailer'}
        </AppText>

        <PressableScale
          onPress={openOnYouTube}
          scaleTo={0.88}
          tapSize={{ width: 40, height: 40 }}
          accessibilityRole="button"
          accessibilityLabel="Open on YouTube"
          style={styles.headerButton}>
          <Ionicons name="logo-youtube" size={20} color={Colors.textSecondary} />
        </PressableScale>
      </View>

      <Player key={videoKey} videoKey={videoKey} title={title} onOpenYouTube={openOnYouTube} />
    </View>
  );
}

function Player({
  videoKey,
  title,
  onOpenYouTube,
}: {
  videoKey: string;
  title?: string;
  onOpenYouTube: () => void;
}) {
  const { width } = useWindowDimensions();
  const { preferences } = usePreferences();
  const [status, setStatus] = useState<Status>('loading');

  const embedUrl =
    `https://www.youtube.com/embed/${videoKey}` +
    `?playsinline=1&rel=0&modestbranding=1&autoplay=${preferences.autoplayTrailers ? 1 : 0}`;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: Status };
      if (message.type === 'ready' || message.type === 'error') setStatus(message.type);
    } catch {}
  };

  return (
    <>
      <View style={[styles.stage, { height: Math.round((width * 9) / 16) }]}>
        <WebView
          source={{ uri: embedUrl, headers: { Referer: EMBED_REFERER } }}
          style={styles.webview}
          // both of these or ios won't start playback inline
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={PROBE}
          onMessage={onMessage}
          onError={() => setStatus('error')}
          onHttpError={() => setStatus('error')}
          scrollEnabled={false}
          bounces={false}
        />

        {status === 'loading' ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={Colors.primaryLight} />
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.overlay}>
            <Ionicons name="videocam-off-outline" size={26} color={Colors.textTertiary} />
            <AppText variant="caption" tone="secondary" style={styles.errorText}>
              This video can&apos;t be played here.
            </AppText>
          </View>
        ) : null}
      </View>

      {title ? (
        <AppText variant="subtitle" numberOfLines={2} style={styles.caption}>
          {title}
        </AppText>
      ) : null}

      {status === 'error' ? (
        <PrimaryButton
          label="Watch on YouTube"
          icon="logo-youtube"
          onPress={onOpenYouTube}
          style={styles.fallbackButton}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  stage: { width: '100%', backgroundColor: '#000', justifyContent: 'center' },
  webview: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...AbsoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#000',
  },
  errorText: { textAlign: 'center', paddingHorizontal: Spacing.xxl },
  caption: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  fallbackButton: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl },
});

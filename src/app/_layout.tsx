import { Stack, ThemeProvider, DarkTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MyListProvider } from '@/store/my-list';
import { PreferencesProvider } from '@/store/preferences';
import { useReleaseReminders } from '@/store/reminders';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <MyListProvider>
            <ThemeProvider value={navigationTheme}>
              <StatusBar style="light" />
              <ReleaseReminders />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'slide_from_right',
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="movie/[id]" />
                <Stack.Screen name="person/[id]" />
                <Stack.Screen name="list/[category]" />
                <Stack.Screen
                  name="watch/[videoKey]"
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="gallery/[id]" />
                <Stack.Screen
                  name="gallery/[id]/photo"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    contentStyle: { backgroundColor: '#000' },
                  }}
                />
              </Stack>
            </ThemeProvider>
          </MyListProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ReleaseReminders() {
  useReleaseReminders();
  return null;
}

const styles = { root: { flex: 1, backgroundColor: Colors.background } } as const;

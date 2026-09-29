import '@/global.css';

import { ToastProvider } from '@/components/ui/toast';
import { NAV_THEME } from '@/lib/theme';
import { PortalHost } from '@rn-primitives/portal';
import {
  Geist_400Regular,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  // Loading is kicked off but never gates the render tree — `fontsLoaded` starts false on every
  // render (web included) and, unlike a native app briefly showing a splash screen, this app is
  // statically exported for GitHub Pages: blocking on it would ship a permanently blank page,
  // since there's no server standing by to re-render once the async font load resolves.
  useFonts({
    Geist_400Regular,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    // Gesture handler needs a root view for gestures anywhere below (drag-to-reorder lists).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

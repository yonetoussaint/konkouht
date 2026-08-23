import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.konkouht.app',
  appName: 'KonkouHT',
  webDir: 'dist',
  backgroundColor: '#111',
  // Loosen scroll/zoom behavior so the WebView feels like a native screen
  // instead of a mobile browser tab (no rubber-band overscroll bleeding
  // into a "pull to refresh", no pinch-zoom, no long-press callouts).
  ios: {
    contentInset: 'never',
    backgroundColor: '#111',
  },
  android: {
    backgroundColor: '#111',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#111',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#111',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.konkouht.app',
  appName: 'KonkouHT',
  webDir: 'dist',
  backgroundColor: '#F2F2F0',
  // Loosen scroll/zoom behavior so the WebView feels like a native screen
  // instead of a mobile browser tab (no rubber-band overscroll bleeding
  // into a "pull to refresh", no pinch-zoom, no long-press callouts).
  ios: {
    contentInset: 'never',
    backgroundColor: '#F2F2F0',
  },
  android: {
    backgroundColor: '#F2F2F0',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#F2F2F0',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#F2F2F0',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

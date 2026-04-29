import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lynxai.app',
  appName: 'Lynx AI',
  webDir: 'dist',
  android: {
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0f',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

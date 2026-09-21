import { defineCapacitorConfig } from '@quasar/app-vite/capacitor';

const devServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

export default defineCapacitorConfig({
  appId: 'org.capacitor.quasar.app',
  appName: 'mediaPlayer MultiPlatform',
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: devServerUrl.startsWith('http://')
        }
      }
    : {})
});

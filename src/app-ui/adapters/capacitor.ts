import type { MediaPlatformAdapter } from './types';
import { webAdapter } from './web';

export const capacitorAdapter: MediaPlatformAdapter = {
  ...webAdapter,
  platform: 'capacitor'
};

import type { MediaPlatformAdapter } from './types';
import { capacitorAdapter } from './capacitor';
import { electronAdapter } from './electron';
import { webAdapter } from './web';

export const getPlatformAdapter = (): MediaPlatformAdapter => {
  if (typeof window !== 'undefined' && window.api) return electronAdapter;
  if (typeof window !== 'undefined' && Boolean(window.Capacitor)) return capacitorAdapter;
  return webAdapter;
};

export type { MediaPlatformAdapter, VideoDownloadProbeResult, VideoDownloadResult } from './types';

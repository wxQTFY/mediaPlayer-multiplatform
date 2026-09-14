export type PlatformKind = 'web' | 'electron' | 'capacitor';

export interface MediaItem {
  id: string;
  title: string;
  source: string;
  sourceType: 'local' | 'network';
  format: 'mp4' | 'hls' | 'dash' | 'unknown';
  durationLabel?: string;
  fileName?: string;
  qualityLabel?: string;
  locationLabel?: string;
  downloadable?: boolean;
  createdAt: number;
  posterTone?: 'teal' | 'gold' | 'blue';
}

export type PlaybackStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'loading' | 'ended' | 'error';

export type DownloadStatus = 'downloading' | 'paused' | 'finished' | 'failed';

export interface DownloadItem {
  id: string;
  title: string;
  status: DownloadStatus;
  progress: number;
  speedLabel?: string;
  sizeLabel?: string;
  targetLabel: string;
  finishedAt?: string;
  sourceUrl?: string;
  errorMessage?: string;
}

export interface PlatformCapability {
  key: string;
  label: string;
  status: 'ready' | 'adapter' | 'planned' | 'limited';
  note: string;
}

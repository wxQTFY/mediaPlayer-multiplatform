export type PlatformKind = 'web' | 'electron' | 'capacitor';

export interface MediaItem {
  id: string;
  title: string;
  source: string;
  sourceType: 'local' | 'network';
  format: 'mp4' | 'hls' | 'dash' | 'unknown';
  durationLabel?: string;
}

export interface PlatformCapability {
  key: string;
  label: string;
  status: 'ready' | 'adapter' | 'planned' | 'limited';
  note: string;
}

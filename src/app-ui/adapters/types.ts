import type { VideoItem } from '@/app-ui/common/types';

export interface VideoDownloadProbeResult {
  downloadable: boolean;
  downloadKind?: 'file' | 'hls';
  fileName?: string;
  contentLength?: number;
  reason?: string;
}

export interface VideoDownloadResult {
  canceled: boolean;
  filePath?: string;
  entryPath?: string;
  outputDir?: string;
  segmentCount?: number;
}

export interface MediaPlatformAdapter {
  readonly platform: 'electron' | 'capacitor' | 'web';
  window: {
    minimize: () => void | Promise<void>;
    maximize: () => void | Promise<void>;
    close: () => void | Promise<void>;
  };
  media: {
    openFiles: (currentList: VideoItem[]) => Promise<VideoItem[]>;
    getPathForFile: (file: File) => string;
    importDroppedFiles: (filePaths: string[], currentList: VideoItem[]) => Promise<VideoItem[]>;
    prepareFile: (id: string) => Promise<{ url: string }>;
    prepareStream: (id: string, duration: number) => Promise<{ url: string }>;
    removeTranscodeCaches: (ids: string[]) => Promise<void>;
    probeDownload: (url: string) => Promise<VideoDownloadProbeResult>;
    downloadUrl: (url: string, suggestedName?: string) => Promise<VideoDownloadResult>;
  };
  storage: {
    getVideoList: () => Promise<VideoItem[]>;
    setVideoList: (videoList: VideoItem[]) => Promise<void>;
  };
}

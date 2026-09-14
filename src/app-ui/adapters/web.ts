import type { MediaPlatformAdapter, VideoDownloadProbeResult, VideoDownloadResult } from './types';
import type { VideoItem } from '@/app-ui/common/types';

const storageKey = 'pc-video-list';

const unsupported = async <T>(message: string): Promise<T> => {
  throw new Error(message);
};

export const webAdapter: MediaPlatformAdapter = {
  platform: 'web',
  window: {
    minimize: () => undefined,
    maximize: () => undefined,
    close: () => undefined
  },
  media: {
    openFiles: async () => [],
    getPathForFile: () => '',
    importDroppedFiles: async () => [],
    prepareFile: (id) => unsupported<{ url: string }>(`当前平台不支持本地文件服务: ${id}`),
    prepareStream: (id) => unsupported<{ url: string }>(`当前平台不支持转码服务: ${id}`),
    removeTranscodeCaches: async () => undefined,
    probeDownload: async (): Promise<VideoDownloadProbeResult> => ({
      downloadable: false,
      reason: '当前平台不支持本地保存下载'
    }),
    downloadUrl: () => unsupported<VideoDownloadResult>('当前平台不支持本地保存下载')
  },
  storage: {
    getVideoList: async () => {
      const rawValue = window.localStorage.getItem(storageKey);
      return rawValue ? (JSON.parse(rawValue) as VideoItem[]) : [];
    },
    setVideoList: async (videoList) => {
      window.localStorage.setItem(storageKey, JSON.stringify(videoList));
    }
  }
};

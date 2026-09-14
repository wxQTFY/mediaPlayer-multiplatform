import type { MediaPlatformAdapter } from './types';
import type { VideoItem } from '@/app-ui/common/types';

const storageKey = 'pc-video-list';

export const electronAdapter: MediaPlatformAdapter = {
  platform: 'electron',
  window: {
    minimize: () => window.api.window.minimize(),
    maximize: () => window.api.window.maximize(),
    close: () => window.api.window.close()
  },
  media: {
    openFiles: async (currentList) => (await window.api.media.openFiles(currentList)) as VideoItem[],
    getPathForFile: (file) => window.api.media.getPathForFile(file),
    importDroppedFiles: async (filePaths, currentList) =>
      (await window.api.media.importDroppedFiles(filePaths, currentList)) as VideoItem[],
    prepareFile: (id) => window.api.media.prepareFile(id),
    prepareStream: (id, duration) => window.api.media.prepareStream(id, duration),
    removeTranscodeCaches: (ids) => window.api.media.removeTranscodeCaches(ids),
    probeDownload: (url) => window.api.media.probeDownload(url),
    downloadUrl: (url, suggestedName) => window.api.media.downloadUrl(url, suggestedName)
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

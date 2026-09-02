import { defineStore, acceptHMRUpdate } from 'pinia';
import { detectPlatform } from '@/adapters/platform';
import type { DownloadItem, MediaItem, PlatformKind, PlaybackStatus } from '@/types/media';

function inferMediaFormat(file: File): MediaItem['format'] {
  const name = file.name.toLowerCase();

  if (file.type === 'video/mp4' || name.endsWith('.mp4') || name.endsWith('.m4v')) return 'mp4';
  if (name.endsWith('.m3u8')) return 'hls';
  if (name.endsWith('.mpd')) return 'dash';
  return 'unknown';
}

function inferMediaFormatFromName(name: string): MediaItem['format'] {
  const lowerName = name.toLowerCase();

  if (/\.(mp4|m4v|mov|webm|ogg|ogv)(\?|#|$)/i.test(lowerName)) return 'mp4';
  if (/\.m3u8(\?|#|$)/i.test(lowerName)) return 'hls';
  if (/\.mpd(\?|#|$)/i.test(lowerName)) return 'dash';
  return 'unknown';
}

function buildNetworkTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const lastPath = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '');
    return lastPath || parsed.hostname || '网络视频';
  } catch {
    return '网络视频';
  }
}

function isSingleFileVideo(url: string): boolean {
  return /\.(mp4|m4v|mov|webm|ogg|ogv)(\?|#|$)/i.test(url);
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    platform: detectPlatform() as PlatformKind,
    currentId: 'demo-city-night',
    playlist: [
      {
        id: 'demo-city-night',
        title: '夜色城市旅行指南.mp4',
        fileName: '夜色城市旅行指南.mp4',
        source: '',
        sourceType: 'local',
        format: 'mp4',
        durationLabel: '29:32',
        qualityLabel: '1080P',
        locationLabel: '本地文件',
        downloadable: true,
        createdAt: Date.now() - 3 * 60 * 60 * 1000,
        posterTone: 'teal'
      },
      {
        id: 'demo-hls',
        title: '直播回放片段.m3u8',
        fileName: '直播回放片段.m3u8',
        source: '',
        sourceType: 'network',
        format: 'hls',
        durationLabel: '41:08',
        qualityLabel: '自动',
        locationLabel: '流媒体',
        downloadable: false,
        createdAt: Date.now() - 2 * 60 * 60 * 1000,
        posterTone: 'gold'
      },
      {
        id: 'demo-product',
        title: '产品演示短片.mp4',
        fileName: '产品演示短片.mp4',
        source: '',
        sourceType: 'network',
        format: 'mp4',
        durationLabel: '12:20',
        qualityLabel: '720P',
        locationLabel: '网络地址',
        downloadable: true,
        createdAt: Date.now() - 75 * 60 * 1000,
        posterTone: 'blue'
      }
    ] as MediaItem[],
    downloads: [
      {
        id: 'download-city',
        title: '夜色城市旅行指南.mp4',
        status: 'downloading',
        progress: 68,
        speedLabel: '2.4MB/s',
        targetLabel: '保存到 /Movies/Downloads'
      },
      {
        id: 'download-product',
        title: '产品演示短片.mp4',
        status: 'downloading',
        progress: 34,
        speedLabel: '1.1MB/s',
        targetLabel: '剩余 01:12'
      },
      {
        id: 'finished-city',
        title: 'x36xfzz_1080p',
        status: 'finished',
        progress: 100,
        sizeLabel: '约 184 MB',
        targetLabel: '本地下载',
        finishedAt: '2026-09-01 21:32'
      },
      {
        id: 'finished-course',
        title: 'demo_course_hls',
        status: 'finished',
        progress: 100,
        sizeLabel: '92 MB',
        targetLabel: 'HLS 包',
        finishedAt: '2026-09-01 20:18'
      }
    ] as DownloadItem[],
    localObjectUrl: null as string | null,
    playbackStatus: 'idle' as PlaybackStatus,
    currentTime: 0,
    duration: 0,
    errorMessage: ''
  }),

  getters: {
    currentMedia(state): MediaItem | undefined {
      return state.playlist.find((item) => item.id === state.currentId);
    },
    downloadingItems(state): DownloadItem[] {
      return state.downloads.filter((item) => item.status !== 'finished');
    },
    finishedDownloads(state): DownloadItem[] {
      return state.downloads.filter((item) => item.status === 'finished');
    },
    isPadLayout(): boolean {
      return typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;
    }
  },

  actions: {
    setCurrentMedia(id: string) {
      this.currentId = id;
      this.resetPlaybackState();
    },
    setPlatform(platform: PlatformKind) {
      this.platform = platform;
    },
    loadLocalFile(file: File) {
      this.releaseLocalObjectUrl();

      const source = URL.createObjectURL(file);
      this.localObjectUrl = source;

      const media: MediaItem = {
        id: `local-${file.name}-${file.lastModified}-${file.size}`,
        title: file.name,
        fileName: file.name,
        source,
        sourceType: 'local',
        format: inferMediaFormat(file),
        durationLabel: '待读取',
        qualityLabel: '本地',
        locationLabel: '本地文件',
        downloadable: true,
        createdAt: Date.now(),
        posterTone: 'teal'
      };

      this.addMedia(media);
      this.currentId = media.id;
      this.resetPlaybackState();
      this.playbackStatus = 'ready';
    },
    loadNetworkUrl(url: string) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;

      const title = buildNetworkTitle(trimmedUrl);
      const format = inferMediaFormatFromName(trimmedUrl);
      const media: MediaItem = {
        id: `network-${Date.now()}`,
        title,
        fileName: title,
        source: trimmedUrl,
        sourceType: 'network',
        format,
        durationLabel: '00:00',
        qualityLabel: format === 'hls' ? '自动' : '在线',
        locationLabel: '输入地址',
        downloadable: isSingleFileVideo(trimmedUrl),
        createdAt: Date.now(),
        posterTone: format === 'hls' ? 'gold' : 'blue'
      };

      this.addMedia(media);
      this.currentId = media.id;
      this.resetPlaybackState();
      this.playbackStatus = 'ready';
    },
    addMedia(media: MediaItem) {
      const existingIndex = this.playlist.findIndex((item) => {
        if (media.source && item.source === media.source) return true;
        return item.fileName === media.fileName && item.sourceType === media.sourceType;
      });

      if (existingIndex >= 0) {
        this.playlist.splice(existingIndex, 1, media);
      } else {
        this.playlist.unshift(media);
      }
    },
    removeMedia(id: string) {
      this.playlist = this.playlist.filter((item) => item.id !== id);
      if (this.currentId === id) {
        this.currentId = this.playlist[0]?.id ?? '';
        this.resetPlaybackState();
      }
    },
    clearPlaylist() {
      this.releaseLocalObjectUrl();
      this.playlist = [];
      this.currentId = '';
      this.resetPlaybackState();
    },
    toggleSortByDate() {
      this.playlist = [...this.playlist].sort((a, b) => b.createdAt - a.createdAt);
    },
    addCurrentToDownloads() {
      const media = this.currentMedia;
      if (!media?.downloadable) return;

      const existing = this.downloads.find((item) => item.title === media.title && item.status !== 'finished');
      if (existing) return;

      this.downloads.unshift({
        id: `download-${Date.now()}`,
        title: media.title,
        status: 'downloading',
        progress: 0,
        speedLabel: '等待中',
        targetLabel: this.platform === 'capacitor' ? '保存到 /Movies/Downloads' : '保存到 Downloads'
      });
    },
    pauseAllDownloads() {
      this.downloads = this.downloads.map((item) => (
        item.status === 'downloading' ? { ...item, status: 'paused', speedLabel: '已暂停' } : item
      ));
    },
    startAllDownloads() {
      this.downloads = this.downloads.map((item) => (
        item.status === 'paused' ? { ...item, status: 'downloading', speedLabel: '等待中' } : item
      ));
    },
    clearActiveDownloads() {
      this.downloads = this.downloads.filter((item) => item.status === 'finished');
    },
    clearFinishedDownloads() {
      this.downloads = this.downloads.filter((item) => item.status !== 'finished');
    },
    removeDownload(id: string) {
      this.downloads = this.downloads.filter((item) => item.id !== id);
    },
    releaseLocalObjectUrl() {
      if (!this.localObjectUrl) return;

      URL.revokeObjectURL(this.localObjectUrl);
      this.localObjectUrl = null;
    },
    resetPlaybackState() {
      this.currentTime = 0;
      this.duration = 0;
      this.errorMessage = '';
      this.playbackStatus = this.currentMedia ? 'ready' : 'idle';
    },
    setPlaybackStatus(status: PlaybackStatus) {
      this.playbackStatus = status;
      if (status !== 'error') this.errorMessage = '';
    },
    setPlaybackProgress(currentTime: number, duration?: number) {
      const nextDuration = duration ?? this.duration;

      this.currentTime = Number.isFinite(currentTime) ? currentTime : 0;
      this.duration = Number.isFinite(nextDuration) ? nextDuration : 0;
    },
    setPlaybackError(message: string) {
      this.playbackStatus = 'error';
      this.errorMessage = message;
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStore, import.meta.hot));
}

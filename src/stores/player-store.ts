import { defineStore, acceptHMRUpdate } from 'pinia';
import { detectPlatform } from '@/adapters/platform';
import type { MediaItem, PlatformKind } from '@/types/media';

const demoPlaylist: MediaItem[] = [
  {
    id: 'network-mp4-demo',
    title: '网络 MP4 播放验证',
    source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    sourceType: 'network',
    format: 'mp4',
    durationLabel: '00:05'
  },
  {
    id: 'hls-placeholder',
    title: 'HLS 播放入口',
    source: 'https://example.com/video/index.m3u8',
    sourceType: 'network',
    format: 'hls',
    durationLabel: '待接入'
  },
  {
    id: 'dash-placeholder',
    title: 'DASH 播放入口',
    source: 'https://example.com/video/manifest.mpd',
    sourceType: 'network',
    format: 'dash',
    durationLabel: '待接入'
  }
];

export const usePlayerStore = defineStore('player', {
  state: () => ({
    platform: detectPlatform() as PlatformKind,
    currentId: demoPlaylist[0]?.id ?? '',
    playlist: demoPlaylist
  }),

  getters: {
    currentMedia(state): MediaItem | undefined {
      return state.playlist.find((item) => item.id === state.currentId);
    },
    isPadLayout(): boolean {
      return typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;
    }
  },

  actions: {
    setCurrentMedia(id: string) {
      this.currentId = id;
    },
    setPlatform(platform: PlatformKind) {
      this.platform = platform;
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStore, import.meta.hot));
}

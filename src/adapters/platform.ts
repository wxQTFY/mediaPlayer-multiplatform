import type { PlatformCapability, PlatformKind } from '@/types/media';

declare global {
  interface Window {
    Capacitor?: unknown;
  }
}

export interface MediaPlatformAdapter {
  kind: PlatformKind;
  label: string;
  capabilities: PlatformCapability[];
  selectLocalVideo(): Promise<void>;
  downloadCurrentVideo(): Promise<void>;
}

const commonCapabilities: PlatformCapability[] = [
  {
    key: 'network-playback',
    label: '网络视频播放',
    status: 'ready',
    note: '第一阶段使用 H5 video 验证播放入口，后续接播放器库'
  },
  {
    key: 'playlist',
    label: '播放列表',
    status: 'ready',
    note: '通过 Pinia 建立跨端共用状态'
  }
];

const adapters: Record<PlatformKind, MediaPlatformAdapter> = {
  web: {
    kind: 'web',
    label: 'H5 Web',
    capabilities: [
      ...commonCapabilities,
      {
        key: 'local-file',
        label: '本地文件',
        status: 'limited',
        note: '浏览器端只能通过文件选择器临时授权'
      },
      {
        key: 'download',
        label: '下载管理',
        status: 'limited',
        note: '受浏览器下载策略限制'
      }
    ],
    async selectLocalVideo() {
      throw new Error('H5 本地文件选择将在第二阶段接入');
    },
    async downloadCurrentVideo() {
      throw new Error('H5 下载能力受限，后续按场景降级');
    }
  },
  electron: {
    kind: 'electron',
    label: 'PC Electron',
    capabilities: [
      ...commonCapabilities,
      {
        key: 'local-file',
        label: '本地文件',
        status: 'adapter',
        note: '后续迁移现有 Electron 文件选择能力'
      },
      {
        key: 'download',
        label: '下载管理',
        status: 'adapter',
        note: '后续迁移现有主进程下载能力'
      },
      {
        key: 'ffmpeg',
        label: 'FFmpeg 转码',
        status: 'adapter',
        note: '保留在 PC 端平台适配层'
      }
    ],
    async selectLocalVideo() {
      throw new Error('Electron 文件选择 adapter 尚未接入');
    },
    async downloadCurrentVideo() {
      throw new Error('Electron 下载 adapter 尚未接入');
    }
  },
  capacitor: {
    kind: 'capacitor',
    label: 'Android / Pad',
    capabilities: [
      ...commonCapabilities,
      {
        key: 'local-file',
        label: '本地文件',
        status: 'adapter',
        note: '后续通过 Capacitor/Android 原生桥接'
      },
      {
        key: 'download',
        label: '下载管理',
        status: 'adapter',
        note: '后续接 Android DownloadManager 或原生下载模块'
      },
      {
        key: 'orientation',
        label: '横竖屏控制',
        status: 'planned',
        note: 'Pad 横屏布局和手机沉浸播放在后续阶段补齐'
      }
    ],
    async selectLocalVideo() {
      throw new Error('Android 文件选择 adapter 尚未接入');
    },
    async downloadCurrentVideo() {
      throw new Error('Android 下载 adapter 尚未接入');
    }
  }
};

export function detectPlatform(): PlatformKind {
  if (typeof window !== 'undefined' && window.Capacitor) return 'capacitor';
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) return 'electron';
  return 'web';
}

export function getPlatformAdapter(kind: PlatformKind = detectPlatform()): MediaPlatformAdapter {
  return adapters[kind];
}

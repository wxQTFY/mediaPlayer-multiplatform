export {};

declare global {
  interface VideoDownloadProbeResult {
    downloadable: boolean;
    downloadKind?: "file" | "hls";
    fileName?: string;
    contentLength?: number;
    reason?: string;
  }

  interface VideoDownloadResult {
    canceled: boolean;
    filePath?: string;
    entryPath?: string;
    outputDir?: string;
    segmentCount?: number;
  }

  interface Window {
    Capacitor?: unknown;
    electronWindow?: {
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<void>;
      close: () => Promise<void>;
    };
    electronMedia?: {
      probeDownload: (url: string) => Promise<VideoDownloadProbeResult>;
      downloadUrl: (url: string, suggestedName?: string) => Promise<VideoDownloadResult>;
    };
    api: {
      app: {
        versions: NodeJS.ProcessVersions;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      media: {
        openFiles: (currentList?: unknown[]) => Promise<unknown[]>;
        getPathForFile: (file: File) => string;
        importDroppedFiles: (filePaths: string[], currentList?: unknown[]) => Promise<unknown[]>;
        prepareFile: (id: string) => Promise<{ url: string }>;
        prepareStream: (id: string, duration: number) => Promise<{ url: string }>;
        removeTranscodeCaches: (ids: string[]) => Promise<void>;
        probeDownload: (url: string) => Promise<VideoDownloadProbeResult>;
        downloadUrl: (url: string, suggestedName?: string) => Promise<VideoDownloadResult>;
      };
    };
  }
}

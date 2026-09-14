import { getPlatformAdapter } from '@/app-ui/adapters';

export const transCodeUrl = (id: string, duration: number): Promise<{ url: string }> => {
  return getPlatformAdapter().media.prepareStream(id, duration)
}

export const localMediaUrl = (id: string): Promise<{ url: string }> => {
  return getPlatformAdapter().media.prepareFile(id)
}

export const removeTranscodeCaches = (ids: string[]): Promise<void> => {
  return getPlatformAdapter().media.removeTranscodeCaches(ids)
}

export const probeVideoDownload = (
  url: string
): Promise<{
  downloadable: boolean
  downloadKind?: 'file' | 'hls'
  fileName?: string
  contentLength?: number
  reason?: string
}> => {
  return getPlatformAdapter().media.probeDownload(url)
}

export const downloadVideoUrl = (
  url: string,
  suggestedName?: string
): Promise<{
  canceled: boolean
  filePath?: string
  entryPath?: string
  outputDir?: string
  segmentCount?: number
}> => {
  return getPlatformAdapter().media.downloadUrl(url, suggestedName)
}

import { computed, onBeforeMount, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import ArtPlayer from '@/app-ui/components/Artplayer/ArtPlayer.vue';
import { type VideoItem as PlayerVideoItem } from '@/app-ui/common/types';
import { downloadVideoUrl, probeVideoDownload } from '@/app-ui/services/api';
import { usePlayerStore } from '@/app-ui/stores/playerStory';

export { ArtPlayer };

export type DownloadTab = 'downloading' | 'finished';
export type DesktopView = 'video' | 'downloads';
export type MobilePage = 'home' | 'downloads' | 'player';
export type TaskStatus = 'downloading' | 'paused';

export interface DisplayVideo {
  id: string;
  title: string;
  source: '本地文件' | '网络地址' | '输入地址' | '流媒体' | '网络分片';
  duration: string;
  quality: string;
  downloadable: boolean;
  native?: PlayerVideoItem;
}

export interface DownloadTask {
  id: string;
  title: string;
  savePath: string;
  progress: number;
  speed?: string;
  remainingTime?: string;
  status: TaskStatus;
}

export interface FinishedRecord {
  id: string;
  title: string;
  size: string;
  completedAt: string;
  filePath?: string;
}

const sampleVideos: DisplayVideo[] = [
  {
    id: 'video-x36xfzz',
    title: 'x36xfzz.m3u8',
    source: '网络分片',
    duration: '00:10:34',
    quality: '自动',
    downloadable: false
  },
  {
    id: 'video-city-night',
    title: '夜色城市旅行指南.mp4',
    source: '本地文件',
    duration: '29:32',
    quality: '1080P',
    downloadable: true
  },
  {
    id: 'video-product-demo',
    title: '产品演示短片.mp4',
    source: '网络地址',
    duration: '12:20',
    quality: '720P',
    downloadable: true
  },
  {
    id: 'video-live-replay',
    title: '直播回放片段.m3u8',
    source: '流媒体',
    duration: '41:08',
    quality: '自动',
    downloadable: false
  }
];

export function usePlayerWorkspace() {
  const playerStore = usePlayerStore();

  const desktopView = ref<DesktopView>('video');
  const downloadTab = ref<DownloadTab>('downloading');
  const mobilePage = ref<MobilePage>('home');
  const previousMobilePage = ref<MobilePage>('home');
  const urlInput = ref('https://media.example.com/city-night.mp4');
  const searchKeyword = ref('');
  const selectedVideoId = ref('video-x36xfzz');
  const isDraggingFiles = ref(false);
  const homeSelecting = ref(false);
  const selectedHomeVideos = ref<Set<string>>(new Set());
  const selectedFinishedRecords = ref<Set<string>>(new Set());
  const isCheckingDownload = ref(false);
  const isDownloading = ref(false);
  const playerDownloadable = ref(false);
  const playerDownloadName = ref<string>();
  const scanPopoverOpen = ref(false);
  let dragDepth = 0;

  const scanState = reactive({
    path: '/storage/emulated/0/Movies',
    autoScan: true
  });

  const downloadTasks = ref<DownloadTask[]>([
    {
      id: 'download-city-night',
      title: '夜色城市旅行指南.mp4',
      savePath: 'D:\\Movies\\Downloads',
      progress: 68,
      speed: '2.4MB/s',
      status: 'downloading'
    },
    {
      id: 'download-product-demo',
      title: '产品演示短片.mp4',
      savePath: 'D:\\Movies\\Downloads',
      progress: 34,
      speed: '1.1MB/s',
      remainingTime: '01:12',
      status: 'downloading'
    }
  ]);

  const finishedRecords = ref<FinishedRecord[]>([
    {
      id: 'finished-x36xfzz',
      title: 'x36xfzz_1080p',
      size: '约 184 MB',
      completedAt: '2026-09-01 21:32',
      filePath: 'D:\\Movies\\Downloads\\x36xfzz_1080p.mp4'
    },
    {
      id: 'finished-demo-course',
      title: 'demo_course_hls',
      size: '92 MB',
      completedAt: '2026-09-01 20:18',
      filePath: 'D:\\Movies\\Downloads\\demo_course_hls.mp4'
    }
  ]);

  const videos = computed<DisplayVideo[]>(() => {
    const list = playerStore.sortedVideoList.map((item) => ({
      id: item.id,
      title: item.videoName,
      source: getVideoSource(item),
      duration: formatDuration(item.meta?.duration ?? 0),
      quality: item.meta?.resolution ?? '自动',
      downloadable: isDownloadablePath(item.realPath ?? item.videoPath ?? ''),
      native: item
    }));

    return list.length > 0 ? list : sampleVideos;
  });

  const filteredVideos = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) return videos.value;
    return videos.value.filter((video) => video.title.toLowerCase().includes(keyword));
  });

  const mobileVideos = computed(() => {
    if (playerStore.sortedVideoList.length > 0) return videos.value;
    return [
      sampleVideos.find((video) => video.id === 'video-city-night'),
      sampleVideos.find((video) => video.id === 'video-live-replay'),
      sampleVideos.find((video) => video.id === 'video-product-demo')
    ].filter((video): video is DisplayVideo => Boolean(video));
  });

  const selectedVideo = computed(() => videos.value.find((video) => video.id === selectedVideoId.value));
  const currentVideo = computed(() => playerStore.currentVideo);
  const hasPlayingVideo = computed(() => Boolean(currentVideo.value?.videoPath));
  const sidebarVideoCount = computed(() => Math.max(videos.value.length, 12));
  const activeFinishedCount = computed(() => selectedFinishedRecords.value.size);

  const finishedSelectAllLabel = computed(() => {
    const selectedCount = selectedFinishedRecords.value.size;
    return selectedCount > 0 && selectedCount === finishedRecords.value.length ? '取消全选' : '全选';
  });

  const showMobileDeleteBar = computed(() => {
    return (
      homeSelecting.value ||
      (mobilePage.value === 'downloads' &&
        downloadTab.value === 'finished' &&
        selectedFinishedRecords.value.size > 0)
    );
  });

  const downloadStateText = computed(() => {
    if (isCheckingDownload.value) return '正在探测：确认资源是否可保存到本地';
    if (playerDownloadable.value) return '已探测：单文件资源，可保存到本地';
    return '已探测：非单文件资源，不展示下载入口';
  });

  onBeforeMount(() => {
    void playerStore.initStore();
  });

  watch(
    () => playerStore.currentVideo,
    async (video) => {
      playerDownloadable.value = false;
      playerDownloadName.value = video?.videoName;
      if (!video?.realPath || !/^https?:\/\//i.test(video.realPath)) {
        playerDownloadable.value = Boolean(video?.realPath && isDownloadablePath(video.realPath));
        return;
      }

      isCheckingDownload.value = true;
      try {
        const result = await probeVideoDownload(video.realPath);
        if (playerStore.currentVideo?.id !== video.id) return;
        playerDownloadable.value = result.downloadable;
        playerDownloadName.value = result.fileName || video.videoName;
      } catch (error) {
        console.error('视频下载能力探测失败:', error);
        playerDownloadable.value = isDownloadablePath(video.realPath);
      } finally {
        if (playerStore.currentVideo?.id === video.id) isCheckingDownload.value = false;
      }
    },
    { immediate: true }
  );

  watch(
    () => [mobilePage.value, downloadTab.value] as const,
    ([page, tab]) => {
      if (page !== 'downloads' || tab !== 'finished') {
        selectedFinishedRecords.value = new Set();
      }
    }
  );

  function getVideoSource(video: PlayerVideoItem): DisplayVideo['source'] {
    const path = video.realPath ?? video.videoPath ?? '';
    if (/\.m3u8($|\?|#)/i.test(path)) return video.type === 'url' ? '流媒体' : '网络分片';
    if (video.type === 'url') return '网络地址';
    return '本地文件';
  }

  function isDownloadablePath(path: string): boolean {
    return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(path);
  }

  function formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getUrlTitle(url: string): string {
    try {
      return decodeURIComponent(new URL(url).pathname.split('/').pop() || '网络视频.mp4');
    } catch {
      return url.split('/').pop() || '网络视频.mp4';
    }
  }

  function getDisplayTitle(title?: string): string {
    return (title || '网络视频').replace(/\.(mp4|mov|webm|m4v|m3u8)$/i, '');
  }

  async function submitUrl(): Promise<void> {
    const url = urlInput.value.trim();
    if (!url) return;
    const title = getUrlTitle(url);
    selectedVideoId.value = `url-${Date.now()}`;
    await playerStore.handleOpenUrl(url);
    if (mobilePage.value !== 'player') previousMobilePage.value = mobilePage.value;
    openMobilePlayer({ title, source: '输入地址', downloadable: isDownloadablePath(url) });
  }

  async function openLocalFile(): Promise<void> {
    await playerStore.handleLocalFile();
    desktopView.value = 'video';
    if (playerStore.currentVideo) mobilePage.value = 'player';
  }

  async function playVideo(video: DisplayVideo): Promise<void> {
    selectedVideoId.value = video.id;
    desktopView.value = 'video';
    if (video.native) await playerStore.playVideo(video.native);
  }

  async function openMobilePlayer(video: DisplayVideo | Pick<DisplayVideo, 'title' | 'source' | 'downloadable'>): Promise<void> {
    previousMobilePage.value = mobilePage.value === 'player' ? previousMobilePage.value : mobilePage.value;
    if ('id' in video) await playVideo(video);
    playerDownloadable.value = video.downloadable;
    playerDownloadName.value = video.title;
    mobilePage.value = 'player';
  }

  function setMobilePage(page: MobilePage): void {
    mobilePage.value = page;
    if (page !== 'downloads') selectedFinishedRecords.value = new Set();
  }

  function backFromPlayer(): void {
    mobilePage.value = previousMobilePage.value;
  }

  function pauseAllDownloads(): void {
    downloadTasks.value = downloadTasks.value.map((task) => ({ ...task, status: 'paused' }));
  }

  function startAllDownloads(): void {
    downloadTasks.value = downloadTasks.value.map((task) => ({ ...task, status: 'downloading' }));
  }

  function deleteAllDownloads(): void {
    downloadTasks.value = [];
  }

  function toggleTaskStatus(id: string): void {
    downloadTasks.value = downloadTasks.value.map((task) =>
      task.id === id
        ? { ...task, status: task.status === 'downloading' ? 'paused' : 'downloading' }
        : task
    );
  }

  function deleteTask(id: string): void {
    downloadTasks.value = downloadTasks.value.filter((task) => task.id !== id);
  }

  function clearFinishedRecords(): void {
    finishedRecords.value = [];
    selectedFinishedRecords.value = new Set();
  }

  function clearFinishedRecord(id: string): void {
    finishedRecords.value = finishedRecords.value.filter((record) => record.id !== id);
    const next = new Set(selectedFinishedRecords.value);
    next.delete(id);
    selectedFinishedRecords.value = next;
  }

  function toggleFinishedRecord(id: string): void {
    const next = new Set(selectedFinishedRecords.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedFinishedRecords.value = next;
  }

  function toggleFinishedSelectAll(): void {
    const allSelected =
      finishedRecords.value.length > 0 && selectedFinishedRecords.value.size === finishedRecords.value.length;
    selectedFinishedRecords.value = allSelected
      ? new Set()
      : new Set(finishedRecords.value.map((record) => record.id));
  }

  function startHomeSelection(): void {
    homeSelecting.value = true;
    selectedHomeVideos.value = new Set();
  }

  function cancelHomeSelection(): void {
    homeSelecting.value = false;
    selectedHomeVideos.value = new Set();
  }

  function toggleHomeVideo(id: string): void {
    const next = new Set(selectedHomeVideos.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedHomeVideos.value = next;
  }

  function selectAllHomeVideos(): void {
    homeSelecting.value = true;
    selectedHomeVideos.value = new Set(mobileVideos.value.map((video) => video.id));
  }

  async function deleteSelectedMobileItems(): Promise<void> {
    if (mobilePage.value === 'downloads' && downloadTab.value === 'finished') {
      finishedRecords.value = finishedRecords.value.filter((record) => !selectedFinishedRecords.value.has(record.id));
      selectedFinishedRecords.value = new Set();
      return;
    }

    await Promise.all(
      Array.from(selectedHomeVideos.value).map(async (id) => {
        if (playerStore.videoList.some((video) => video.id === id)) {
          await playerStore.removeVideoById(id);
        }
      })
    );
    cancelHomeSelection();
  }

  async function handlePlayerDownload(): Promise<boolean> {
    const video = playerStore.currentVideo;
    if (!video?.realPath || !playerDownloadable.value || isDownloading.value) {
      desktopView.value = 'downloads';
      mobilePage.value = 'downloads';
      return false;
    }

    isDownloading.value = true;
    try {
      const result = await downloadVideoUrl(video.realPath, playerDownloadName.value || video.videoName);
      if (!result.canceled) {
        const savedPath = result.filePath || result.entryPath || result.outputDir;
        const nextRecord: FinishedRecord = {
          id: `finished-${Date.now()}`,
          title: playerDownloadName.value || video.videoName,
          size: result.segmentCount ? `${result.segmentCount} 个分片` : '已保存',
          completedAt: new Date().toLocaleString('zh-CN', { hour12: false })
        };
        if (savedPath) nextRecord.filePath = savedPath;
        finishedRecords.value.unshift(nextRecord);
      }
      desktopView.value = 'downloads';
      mobilePage.value = 'downloads';
      downloadTab.value = 'finished';
      return true;
    } catch (error) {
      console.error('视频下载失败:', error);
      return false;
    } finally {
      isDownloading.value = false;
    }
  }

  const hasFiles = (event: DragEvent): boolean => Array.from(event.dataTransfer?.types ?? []).includes('Files');

  function handleDragEnter(event: DragEvent): void {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    isDraggingFiles.value = true;
  }

  function handleDragOver(event: DragEvent): void {
    if (!hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event: DragEvent): void {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) isDraggingFiles.value = false;
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragDepth = 0;
    isDraggingFiles.value = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) void playerStore.handleDroppedFiles(files);
  }

  return {
    activeFinishedCount,
    backFromPlayer,
    cancelHomeSelection,
    clearFinishedRecord,
    clearFinishedRecords,
    currentVideo,
    deleteAllDownloads,
    deleteSelectedMobileItems,
    deleteTask,
    desktopView,
    downloadStateText,
    downloadTab,
    downloadTasks,
    filteredVideos,
    finishedRecords,
    finishedSelectAllLabel,
    getDisplayTitle,
    getUrlTitle,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePlayerDownload,
    hasPlayingVideo,
    homeSelecting,
    isCheckingDownload,
    isDownloading,
    isDraggingFiles,
    mobilePage,
    mobileVideos,
    openLocalFile,
    openMobilePlayer,
    pauseAllDownloads,
    playVideo,
    playerDownloadable,
    playerDownloadName,
    playerStore,
    scanPopoverOpen,
    scanState,
    searchKeyword,
    selectAllHomeVideos,
    selectedFinishedRecords,
    selectedHomeVideos,
    selectedVideo,
    selectedVideoId,
    setMobilePage,
    showMobileDeleteBar,
    sidebarVideoCount,
    startAllDownloads,
    startHomeSelection,
    submitUrl,
    toggleFinishedRecord,
    toggleFinishedSelectAll,
    toggleHomeVideo,
    toggleTaskStatus,
    urlInput,
    videos
  };
}

export type PlayerWorkspace = ReturnType<typeof usePlayerWorkspace>;
export type PlayerWorkspaceRef = Ref<PlayerWorkspace>;

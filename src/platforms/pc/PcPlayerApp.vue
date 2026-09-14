<script setup lang="ts">
import 'element-plus/dist/index.css';
import '@/app-ui/assets/port-utilities.css';

import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElConfigProvider, ElMessage } from 'element-plus';
import {
  Back,
  CaretRight,
  Close,
  Delete,
  Download,
  FolderOpened,
  FullScreen,
  House,
  Minus,
  MoreFilled,
  Plus,
  RefreshLeft,
  RefreshRight,
  Search,
  Sort,
  VideoPause
} from '@element-plus/icons-vue';
import ArtPlayer from '@/app-ui/components/Artplayer/ArtPlayer.vue';
import { usePlayerStore } from '@/app-ui/stores/playerStory';
import { downloadVideoUrl, probeVideoDownload } from '@/app-ui/services/api';
import { type VideoItem as PlayerVideoItem } from '@/app-ui/common/types';

type DownloadTab = 'downloading' | 'finished';
type DesktopView = 'video' | 'downloads';
type MobilePage = 'home' | 'downloads' | 'player';
type TaskStatus = 'downloading' | 'paused';

interface DisplayVideo {
  id: string;
  title: string;
  source: '本地文件' | '网络地址' | '输入地址' | '流媒体' | '网络分片';
  duration: string;
  quality: string;
  downloadable: boolean;
  native?: PlayerVideoItem;
}

interface DownloadTask {
  id: string;
  title: string;
  savePath: string;
  progress: number;
  speed?: string;
  remainingTime?: string;
  status: TaskStatus;
}

interface FinishedRecord {
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

const playerStore = usePlayerStore();

const desktopView = ref<DesktopView>('video');
const downloadTab = ref<DownloadTab>('downloading');
const mobilePage = ref<MobilePage>('home');
const previousMobilePage = ref<MobilePage>('home');
const urlInput = ref('https://media.example.com/city-night.mp4');
const searchKeyword = ref('');
const selectedVideoId = ref('video-x36xfzz');
const isMobileViewport = ref(false);
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

const selectedVideo = computed(() => videos.value.find((video) => video.id === selectedVideoId.value));
const currentVideo = computed(() => playerStore.currentVideo);
const hasPlayingVideo = computed(() => Boolean(currentVideo.value?.videoPath));
const sidebarVideoCount = computed(() => (playerStore.sortedVideoList.length > 0 ? videos.value.length : 12));

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

const updateViewport = (): void => {
  isMobileViewport.value = window.matchMedia('(max-width: 820px)').matches;
};

onBeforeMount(() => {
  void playerStore.initStore();
});

onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
  window.addEventListener('dragenter', handleDragEnter);
  window.addEventListener('dragover', handleDragOver);
  window.addEventListener('dragleave', handleDragLeave);
  window.addEventListener('drop', handleDrop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport);
  window.removeEventListener('dragenter', handleDragEnter);
  window.removeEventListener('dragover', handleDragOver);
  window.removeEventListener('dragleave', handleDragLeave);
  window.removeEventListener('drop', handleDrop);
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

function submitUrl(): void {
  const url = urlInput.value.trim();
  if (!url) return;
  const title = getUrlTitle(url);
  selectedVideoId.value = `url-${Date.now()}`;
  void playerStore.handleOpenUrl(url);
  if (isMobileViewport.value) openMobilePlayer({ title, source: '输入地址', downloadable: isDownloadablePath(url) });
}

function getUrlTitle(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || '网络视频.mp4');
  } catch {
    return url.split('/').pop() || '网络视频.mp4';
  }
}

async function openLocalFile(): Promise<void> {
  await playerStore.handleLocalFile();
  desktopView.value = 'video';
  if (isMobileViewport.value && playerStore.currentVideo) {
    mobilePage.value = 'player';
  }
}

async function playVideo(video: DisplayVideo): Promise<void> {
  selectedVideoId.value = video.id;
  desktopView.value = 'video';
  if (video.native) {
    await playerStore.playVideo(video.native);
  }
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
  if (page !== 'downloads') {
    selectedFinishedRecords.value = new Set();
  }
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
  selectedHomeVideos.value = new Set(videos.value.map((video) => video.id));
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

async function handlePlayerDownload(): Promise<void> {
  const video = playerStore.currentVideo;
  if (!video?.realPath || !playerDownloadable.value || isDownloading.value) {
    desktopView.value = 'downloads';
    mobilePage.value = 'downloads';
    return;
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
      ElMessage.success('视频已保存到本地');
    }
    desktopView.value = 'downloads';
    mobilePage.value = 'downloads';
    downloadTab.value = 'finished';
  } catch (error) {
    console.error('视频下载失败:', error);
    ElMessage.error('视频下载失败，请稍后重试');
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

const scanState = reactive({
  path: '/storage/emulated/0/Movies',
  autoScan: true
});
</script>

<template>
  <el-config-provider>
    <div class="v1-player-app">
      <section v-if="!isMobileViewport" class="desktop-window" aria-label="影音播放器桌面端">
        <header class="desktop-titlebar">
          <div class="brand">
            <div class="brand-mark"><el-icon><CaretRight /></el-icon></div>
            <strong>影音播放器</strong>
          </div>
          <div class="window-actions" aria-label="窗口控制">
            <button type="button" aria-label="最小化" title="最小化"><el-icon><Minus /></el-icon></button>
            <button type="button" aria-label="最大化" title="最大化"><el-icon><FullScreen /></el-icon></button>
            <button class="close" type="button" aria-label="关闭" title="关闭"><el-icon><Close /></el-icon></button>
          </div>
        </header>

        <div class="desktop-body">
          <aside class="desktop-sidebar">
            <nav class="view-tabs" aria-label="功能导航">
              <button
                type="button"
                :class="{ active: desktopView === 'video' }"
                @click="desktopView = 'video'"
              >
                视频
              </button>
              <button
                type="button"
                :class="{ active: desktopView === 'downloads' }"
                @click="desktopView = 'downloads'"
              >
                下载
              </button>
            </nav>

            <div class="library-row">
              <strong>共 {{ sidebarVideoCount }} 个视频</strong>
              <div class="sidebar-actions">
                <button type="button" aria-label="添加" title="添加" @click="openLocalFile">
                  <el-icon><Plus /></el-icon>
                </button>
                <button type="button" aria-label="删除" title="删除" @click="playerStore.deleteAllVideos">
                  <el-icon><Delete /></el-icon>
                </button>
                <button type="button" aria-label="排序" title="排序" @click="playerStore.toggleSortDate">
                  <el-icon><Sort /></el-icon>
                </button>
              </div>
            </div>

            <label class="sidebar-search">
              <el-icon><Search /></el-icon>
              <input v-model="searchKeyword" aria-label="搜索列表视频" placeholder="搜索列表视频" />
            </label>

            <div class="desktop-video-list" aria-label="视频列表">
              <button
                v-for="video in filteredVideos"
                :key="video.id"
                class="desktop-video-item"
                :class="{ active: selectedVideoId === video.id }"
                type="button"
                @click="playVideo(video)"
              >
                <span class="thumb" :data-time="video.duration"></span>
                <span class="video-meta">
                  <strong>{{ video.title }}</strong>
                  <span>{{ video.source }} · {{ video.quality }} · {{ video.downloadable ? '可下载' : '继续播放' }}</span>
                </span>
              </button>
            </div>
          </aside>

          <main class="desktop-main" aria-label="主区域">
            <section v-show="desktopView === 'video'" class="desktop-video-view">
              <div v-if="hasPlayingVideo" class="desktop-player-stage">
                <ArtPlayer
                  :key="currentVideo!.videoPath || 'desktop-player'"
                  :url="currentVideo!.videoPath!"
                  @get-duration="(duration) => playerStore.updateDuration(duration, currentVideo!)"
                  @playback-error="playerStore.fallbackToTranscode(currentVideo!)"
                />
                <button
                  v-if="playerDownloadable"
                  class="floating-download"
                  type="button"
                  aria-label="下载当前视频"
                  title="下载当前视频"
                  :disabled="isDownloading"
                  @click="handlePlayerDownload"
                >
                  <el-icon><Download /></el-icon>
                </button>
              </div>
              <div v-else class="desktop-home-card">
                <div class="hero-mark"><el-icon><CaretRight /></el-icon></div>
                <form class="url-form" @submit.prevent="submitUrl">
                  <label>
                    <span>视频地址</span>
                    <input v-model="urlInput" aria-label="输入视频地址" />
                  </label>
                </form>
                <button class="primary-action" type="button" @click="openLocalFile">
                  <el-icon><FolderOpened /></el-icon>
                  打开文件
                </button>
              </div>
            </section>

            <section v-show="desktopView === 'downloads'" class="downloads-view">
              <div class="download-tabs" role="group" aria-label="下载分类">
                <button
                  type="button"
                  :class="{ active: downloadTab === 'downloading' }"
                  @click="downloadTab = 'downloading'"
                >
                  下载中({{ downloadTasks.length }})
                </button>
                <button
                  type="button"
                  :class="{ active: downloadTab === 'finished' }"
                  @click="downloadTab = 'finished'"
                >
                  已完成({{ finishedRecords.length }})
                </button>
              </div>

              <div v-if="downloadTab === 'downloading'" class="bulk-actions">
                <button type="button" @click="pauseAllDownloads"><el-icon><VideoPause /></el-icon>全部暂停</button>
                <button type="button" @click="startAllDownloads"><el-icon><CaretRight /></el-icon>全部开始</button>
                <button class="danger" type="button" @click="deleteAllDownloads"><el-icon><Delete /></el-icon>全部删除</button>
              </div>

              <div v-else class="bulk-actions">
                <button class="danger" type="button" @click="clearFinishedRecords"><el-icon><Delete /></el-icon>清空全部记录</button>
              </div>

              <div v-if="downloadTab === 'downloading'" class="download-task-list">
                <article v-for="task in downloadTasks" :key="task.id" class="download-row">
                  <div class="download-meta">
                    <strong>{{ task.title }}</strong>
                    <span>{{ task.progress }}% · {{ task.speed || '已暂停' }} · 保存到 {{ task.savePath }}{{ task.remainingTime ? ` · 剩余 ${task.remainingTime}` : '' }}</span>
                    <div class="progress"><div :style="{ width: `${task.progress}%` }"></div></div>
                  </div>
                  <div class="row-actions">
                    <button type="button" :aria-label="task.status === 'paused' ? '开始' : '暂停'" :title="task.status === 'paused' ? '开始' : '暂停'" @click="toggleTaskStatus(task.id)">
                      <el-icon><component :is="task.status === 'paused' ? CaretRight : VideoPause" /></el-icon>
                    </button>
                    <button type="button" aria-label="删除" title="删除" @click="deleteTask(task.id)">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </article>
              </div>

              <div v-else class="finished-table" aria-label="已完成下载记录">
                <div class="finished-row header">
                  <span>名称</span>
                  <span>大小</span>
                  <span>完成时间</span>
                  <span>操作</span>
                </div>
                <div v-for="record in finishedRecords" :key="record.id" class="finished-row">
                  <span>{{ record.title }}</span>
                  <span>{{ record.size }}</span>
                  <span>{{ record.completedAt }}</span>
                  <div class="finished-actions">
                    <button type="button" aria-label="播放" title="播放"><el-icon><CaretRight /></el-icon></button>
                    <button type="button" aria-label="打开文件位置" title="打开文件位置"><el-icon><FolderOpened /></el-icon></button>
                    <button class="clear" type="button" aria-label="清除" title="清除" @click="clearFinishedRecord(record.id)">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>

      <section v-else class="mobile-wrap" aria-label="影音播放器移动端">
        <div class="phone">
          <div class="phone-screen">
            <div class="mobile-status" :class="{ hidden: mobilePage === 'player' }">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>

            <section v-show="mobilePage === 'home'" class="mobile-page">
              <header class="mobile-appbar">
                <div class="mobile-mark"><el-icon><CaretRight /></el-icon></div>
                <strong>首页</strong>
                <button type="button" aria-label="打开扫描功能" title="打开扫描功能" @click="scanPopoverOpen = !scanPopoverOpen">
                  <el-icon><Plus /></el-icon>
                </button>
                <div v-if="scanPopoverOpen" class="scan-popover">
                  <strong>扫描视频文件</strong>
                  <span>{{ scanState.path }}</span>
                  <div class="scan-actions">
                    <button type="button">选择目录</button>
                    <button type="button">立即扫描</button>
                  </div>
                </div>
              </header>

              <form class="mobile-url-row" @submit.prevent="submitUrl">
                <input v-model="urlInput" aria-label="输入视频地址" />
                <button type="submit" aria-label="搜索并播放"><el-icon><Search /></el-icon></button>
              </form>

              <div class="mobile-section-head">
                <span>视频列表</span>
                <span>{{ homeSelecting ? `已选 ${selectedHomeVideos.size} / ${videos.length}` : `${videos.length} 个文件` }}</span>
              </div>

              <div class="mobile-select-toolbar" :class="{ active: homeSelecting }">
                <button type="button" @click="startHomeSelection"><el-icon><Delete /></el-icon>批量删除</button>
                <button type="button" @click="selectAllHomeVideos">全选</button>
                <button type="button" @click="cancelHomeSelection">取消</button>
              </div>

              <div class="mobile-video-list">
                <article
                  v-for="video in videos"
                  :key="video.id"
                  class="mobile-video-card"
                  :class="{ selecting: homeSelecting }"
                  @click="homeSelecting ? toggleHomeVideo(video.id) : openMobilePlayer(video)"
                >
                  <input
                    v-if="homeSelecting"
                    type="checkbox"
                    :checked="selectedHomeVideos.has(video.id)"
                    aria-label="选择视频"
                    @click.stop="toggleHomeVideo(video.id)"
                  />
                  <span class="thumb" :data-time="video.duration"></span>
                  <span>
                    <strong>{{ video.title }}</strong>
                    <em>{{ video.source }} · {{ video.quality }} · {{ video.downloadable ? '单文件可下载' : '无下载入口' }}</em>
                  </span>
                </article>
              </div>
            </section>

            <section v-show="mobilePage === 'downloads'" class="mobile-page downloads-mobile">
              <header class="mobile-appbar">
                <div class="mobile-mark"><el-icon><CaretRight /></el-icon></div>
                <strong>下载</strong>
                <button type="button" aria-label="打开扫描功能" title="打开扫描功能" @click="scanPopoverOpen = !scanPopoverOpen">
                  <el-icon><Plus /></el-icon>
                </button>
              </header>

              <div class="mobile-download-tabs" role="group" aria-label="下载页面分类">
                <button type="button" :class="{ active: downloadTab === 'downloading' }" @click="downloadTab = 'downloading'">下载中</button>
                <button type="button" :class="{ active: downloadTab === 'finished' }" @click="downloadTab = 'finished'">已完成</button>
              </div>

              <div v-if="downloadTab === 'downloading'" class="mobile-bulk-actions">
                <button type="button" @click="pauseAllDownloads"><el-icon><VideoPause /></el-icon>全部暂停</button>
                <button type="button" @click="startAllDownloads"><el-icon><CaretRight /></el-icon>全部开始</button>
                <button class="danger" type="button" @click="deleteAllDownloads"><el-icon><Delete /></el-icon>全部删除</button>
              </div>

              <div v-if="downloadTab === 'downloading'" class="mobile-download-list">
                <article v-for="task in downloadTasks" :key="task.id" class="mobile-download-card">
                  <div class="download-card-top">
                    <strong>{{ task.title }}</strong>
                    <div class="row-actions">
                      <button type="button" aria-label="暂停下载" @click="toggleTaskStatus(task.id)"><el-icon><VideoPause /></el-icon></button>
                      <button type="button" aria-label="删除下载" @click="deleteTask(task.id)"><el-icon><Delete /></el-icon></button>
                    </div>
                  </div>
                  <span>{{ task.progress }}% · {{ task.speed || '已暂停' }} · {{ task.remainingTime ? `剩余 ${task.remainingTime}` : task.savePath }}</span>
                  <div class="mobile-progress"><div :style="{ width: `${task.progress}%` }"></div></div>
                </article>
              </div>

              <div v-else>
                <div class="finished-select-row">
                  <button class="danger" type="button" @click="clearFinishedRecords"><el-icon><Delete /></el-icon>清空记录</button>
                  <button type="button" @click="toggleFinishedSelectAll">{{ finishedSelectAllLabel }}</button>
                </div>
                <div class="mobile-finished-list">
                  <article
                    v-for="record in finishedRecords"
                    :key="record.id"
                    class="mobile-finished-card"
                    :class="{ selected: selectedFinishedRecords.has(record.id) }"
                    @click="toggleFinishedRecord(record.id)"
                  >
                    <span>
                      <strong>{{ record.title }}</strong>
                      <em>{{ record.size }} · {{ record.completedAt }}</em>
                    </span>
                    <input
                      type="checkbox"
                      :checked="selectedFinishedRecords.has(record.id)"
                      aria-label="选择完成记录"
                      @click.stop="toggleFinishedRecord(record.id)"
                    />
                  </article>
                </div>
              </div>
            </section>

            <section v-show="mobilePage === 'player'" class="mobile-player-page">
              <div class="mobile-player-hero">
                <div class="readable-bar">
                  <button type="button" aria-label="返回" @click="backFromPlayer"><el-icon><Back /></el-icon></button>
                  <span>
                    <em>{{ selectedVideo?.source || '输入地址' }}</em>
                    <strong>{{ currentVideo?.videoName || selectedVideo?.title || getUrlTitle(urlInput) }}</strong>
                  </span>
                  <button type="button" aria-label="更多"><el-icon><MoreFilled /></el-icon></button>
                </div>

                <button
                  v-if="playerDownloadable"
                  class="mobile-download-float"
                  type="button"
                  aria-label="下载当前视频"
                  @click="handlePlayerDownload"
                >
                  <el-icon><Download /></el-icon>
                  <span>可下载</span>
                </button>

                <ArtPlayer
                  v-if="currentVideo?.videoPath"
                  :key="currentVideo.videoPath || 'mobile-player'"
                  :url="currentVideo.videoPath"
                  @get-duration="(duration) => playerStore.updateDuration(duration, currentVideo!)"
                  @playback-error="playerStore.fallbackToTranscode(currentVideo!)"
                />
                <div v-else class="mock-player-controls">
                  <button type="button" aria-label="快退十秒"><el-icon><RefreshLeft /></el-icon></button>
                  <button class="play" type="button" aria-label="播放或暂停"><el-icon><VideoPause /></el-icon></button>
                  <button type="button" aria-label="快进十秒"><el-icon><RefreshRight /></el-icon></button>
                </div>
              </div>

              <div class="mobile-player-info">
                <div class="download-state">{{ downloadStateText }}</div>
                <h3>{{ currentVideo?.videoName || selectedVideo?.title || '网络视频' }}</h3>
                <p>播放页浮层使用深色半透明底和文字阴影，保证在亮色、暗色、复杂画面下都可读。</p>
              </div>
            </section>

            <nav v-if="!showMobileDeleteBar && mobilePage !== 'player'" class="bottom-nav" aria-label="底部导航">
              <button type="button" :class="{ active: mobilePage === 'home' }" @click="setMobilePage('home')">
                <el-icon><House /></el-icon><span>首页</span>
              </button>
              <button type="button" :class="{ active: mobilePage === 'downloads' }" @click="setMobilePage('downloads')">
                <el-icon><Download /></el-icon><span>下载</span>
              </button>
            </nav>

            <div v-if="showMobileDeleteBar" class="bottom-delete-bar">
              <button type="button" @click="deleteSelectedMobileItems"><el-icon><Delete /></el-icon>删除</button>
            </div>
          </div>
        </div>
      </section>

      <div v-if="isDraggingFiles" class="drop-overlay">
        <div class="drop-indicator">释放以播放视频</div>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.v1-player-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  color: #f4f8fb;
  background: #aebbc6;
  font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.desktop-window {
  display: grid;
  grid-template-rows: 61px minmax(0, 1fr);
  width: min(100vw - 8px, 1208px);
  height: min(100vh - 8px, 768px);
  margin: 4px auto;
  overflow: hidden;
  background: #11141a;
  border: 1px solid #27313d;
  border-radius: 6px;
  box-shadow: 0 18px 44px rgb(3 8 16 / 32%);
}

.desktop-titlebar,
.brand,
.window-actions,
.desktop-body,
.library-row,
.sidebar-actions,
.desktop-video-item,
.bulk-actions,
.download-row,
.finished-actions,
.mobile-appbar,
.mobile-section-head,
.mobile-video-card,
.download-card-top,
.mobile-finished-card,
.bottom-nav {
  display: flex;
  align-items: center;
}

.desktop-titlebar {
  justify-content: space-between;
  padding: 0 18px;
  background: #1d2028;
  border-bottom: 1px solid #222936;
  user-select: none;
  -webkit-app-region: drag;
}

.brand {
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
}

.brand-mark,
.hero-mark,
.mobile-mark {
  display: grid;
  place-items: center;
  color: #061d1b;
  background: #42d7ca;
}

.brand-mark {
  width: 39px;
  height: 39px;
  font-size: 17px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 7px rgb(6 29 27 / 10%);
}

.brand-mark .el-icon {
  padding: 3px;
  border: 2px solid currentColor;
  border-radius: 5px;
}

.window-actions {
  gap: 17px;
  -webkit-app-region: no-drag;
}

.window-actions button,
.sidebar-actions button,
.row-actions button,
.finished-actions button,
.mobile-appbar button,
.mobile-url-row button,
.readable-bar button,
.mock-player-controls button {
  display: grid;
  place-items: center;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
}

.window-actions button {
  width: 24px;
  height: 24px;
  color: #c6ccd6;
}

.window-actions .close:hover {
  color: white;
  background: #d94747;
  border-radius: 4px;
}

.desktop-body {
  min-height: 0;
}

.desktop-sidebar {
  display: grid;
  grid-template-rows: 63px 43px 55px minmax(0, 1fr);
  width: 260px;
  height: 100%;
  min-height: 0;
  background: #11141a;
  border-right: 1px solid #1f2732;
}

.view-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 12px 11px;
}

.view-tabs button,
.download-tabs button,
.mobile-download-tabs button {
  border: 0;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.view-tabs button {
  height: 34px;
  color: #fff;
  font-weight: 700;
  background: #272e3a;
  border: 1px solid #3a4250;
  border-radius: 7px;
}

.view-tabs button.active {
  color: #032229;
  background: #42d7ca;
  border-color: #42d7ca;
}

.library-row {
  justify-content: space-between;
  padding: 0 11px 0 12px;
  font-size: 14px;
}

.sidebar-actions {
  gap: 6px;
}

.sidebar-actions button {
  width: 34px;
  height: 32px;
  color: #f5f7fb;
  background: #272e3a;
  border: 1px solid #3a4250;
  border-radius: 7px;
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  margin: 9px 12px 14px;
  padding: 0 11px;
  color: #b5becc;
  background: #1d232d;
  border: 1px solid #363f4d;
  border-radius: 6px;
}

.sidebar-search input {
  width: 100%;
  min-width: 0;
  color: white;
  background: transparent;
  border: 0;
  outline: 0;
}

.desktop-video-list {
  min-height: 0;
  overflow: auto;
  padding: 0 0 10px;
}

.desktop-video-item {
  width: 100%;
  gap: 11px;
  padding: 9px 12px 9px 18px;
  color: white;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.desktop-video-item:hover,
.desktop-video-item.active {
  background: rgb(66 215 202 / 9%);
  border-color: #42d7ca;
}

.thumb {
  position: relative;
  flex: 0 0 auto;
  width: 72px;
  height: 46px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(66 215 202 / 85%), rgb(41 83 136 / 90%)),
    linear-gradient(135deg, #263341, #111826 68%);
  border-radius: 6px;
}

.desktop-video-item:nth-child(2n) .thumb,
.mobile-video-card:nth-child(2n) .thumb {
  background:
    linear-gradient(135deg, rgb(241 189 72 / 72%), rgb(39 65 126 / 86%)),
    linear-gradient(135deg, #263341, #111826 68%);
}

.thumb::after {
  position: absolute;
  right: 4px;
  bottom: 3px;
  padding: 1px 4px;
  color: white;
  font-size: 10px;
  content: attr(data-time);
  background: rgb(0 0 0 / 62%);
  border-radius: 3px;
}

.video-meta,
.mobile-video-card span,
.mobile-finished-card span {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.video-meta strong,
.mobile-video-card strong,
.mobile-finished-card strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta span,
.mobile-video-card em,
.mobile-finished-card em {
  overflow: hidden;
  color: #9ba7b5;
  font-size: 12px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desktop-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.desktop-video-view,
.desktop-player-stage,
.downloads-view {
  width: 100%;
  height: 100%;
}

.desktop-video-view {
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, rgb(7 10 18 / 18%), rgb(7 10 18 / 64%)),
    radial-gradient(circle at 54% 42%, rgb(66 215 202 / 24%), transparent 18%),
    linear-gradient(130deg, #2233a6 0%, #202997 30%, #14265d 58%, #101933 100%);
  position: relative;
  overflow: hidden;
}

.desktop-video-view::before {
  position: absolute;
  top: -22%;
  right: -18%;
  width: 74%;
  height: 134%;
  content: "";
  border: 1px solid rgb(66 215 202 / 34%);
  border-radius: 50%;
  box-shadow:
    inset 22px 0 0 rgb(66 215 202 / 4%),
    inset 44px 0 0 rgb(77 125 245 / 5%);
  transform: rotate(-14deg);
}

.desktop-video-view::after {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  opacity: 0.56;
  background: repeating-radial-gradient(circle at 78% 16%, transparent 0 13px, rgb(66 215 202 / 20%) 14px, transparent 15px);
}

.desktop-home-card {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  gap: 18px;
  width: min(720px, 84%);
  transform: translateY(-22px);
}

.hero-mark {
  width: 96px;
  height: 96px;
  color: #dffefa;
  font-size: 42px;
  background:
    radial-gradient(circle at 36% 28%, rgb(255 255 255 / 42%), transparent 22%),
    linear-gradient(145deg, #42d7ca, #426bf0 62%, #15214d);
  border-radius: 50%;
  box-shadow:
    0 20px 60px rgb(0 0 0 / 34%),
    0 0 0 8px rgb(255 255 255 / 8%);
}

.url-form {
  width: min(620px, 100%);
}

.url-form label {
  display: grid;
  grid-template-columns: 98px minmax(0, 1fr);
  align-items: center;
  height: 46px;
  overflow: hidden;
  color: #172033;
  background: white;
  border-radius: 7px;
}

.url-form span {
  height: 100%;
  display: grid;
  place-items: center;
  background: #eef3f8;
  border-right: 1px solid #d8e0ea;
}

.url-form input {
  width: 100%;
  padding: 0 14px;
  color: #172033;
  background: transparent;
  border: 0;
  outline: 0;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 25px;
  color: #061d1b;
  font-weight: 700;
  background: #42d7ca;
  border: 0;
  border-radius: 999px;
}

.desktop-player-stage {
  position: relative;
  background: #05070a;
}

.desktop-player-stage :deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}

.floating-download {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: white;
  background: rgb(0 0 0 / 48%);
  border: 0;
  border-radius: 8px;
}

.downloads-view {
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 18px;
  padding: 28px 34px;
  color: #172033;
  background: #f7fafc;
}

.download-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: fit-content;
  min-width: 260px;
  border-bottom: 0;
}

.download-tabs button {
  position: relative;
  min-height: 40px;
  padding: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 500;
  background: transparent;
  white-space: nowrap;
}

.download-tabs button.active {
  color: #1677ff;
}

.download-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 3px;
  content: "";
  background: #1677ff;
  border-radius: 999px;
  transform: translateX(-50%);
}

.bulk-actions {
  gap: 10px;
  margin: 0;
}

.bulk-actions button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  color: #5d9dfb;
  background: #edf5ff;
  border: 0;
  border-radius: 7px;
}

.bulk-actions .danger,
.danger {
  color: #d9444d;
}

.download-task-list {
  display: grid;
  align-content: start;
  gap: 0;
}

.download-row {
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #d8e0e8;
  border-radius: 0;
}

.download-meta {
  display: grid;
  flex: 1;
  gap: 8px;
  min-width: 0;
}

.download-meta span {
  color: #687385;
  font-size: 13px;
}

.progress,
.mobile-progress {
  height: 7px;
  overflow: hidden;
  background: rgb(255 255 255 / 10%);
  border-radius: 999px;
}

.progress div,
.mobile-progress div {
  height: 100%;
  background: linear-gradient(90deg, #42d7ca, #f4bf45);
  border-radius: inherit;
}

.row-actions {
  gap: 8px;
}

.row-actions button,
.finished-actions button {
  width: 36px;
  height: 36px;
  color: #f4f8fb;
  background: #292e39;
  border-radius: 7px;
}

.finished-table {
  display: grid;
  background: white;
  border: 1px solid #e4eaf3;
  border-radius: 8px;
}

.finished-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 120px 180px 132px;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f7;
}

.finished-row:last-child {
  border-bottom: 0;
}

.finished-row.header {
  min-height: 44px;
  color: #6a7486;
  font-weight: 700;
  background: #f6f8fb;
}

.finished-actions {
  gap: 6px;
}

.finished-actions .clear {
  color: #d9444d;
}

.mobile-wrap {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: #0d1219;
}

.phone {
  width: min(100vw, 430px);
  height: min(100vh, 900px);
  padding: 10px;
  background: #171a21;
  border-radius: 34px;
}

.phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: #f4f8fb;
  background: #11141a;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 26px;
}

.mobile-status {
  display: flex;
  justify-content: space-between;
  height: 36px;
  padding: 12px 20px 0;
  color: #cbd5e1;
  font-size: 12px;
}

.mobile-status.hidden {
  visibility: hidden;
}

.mobile-page {
  height: calc(100% - 36px);
  overflow: auto;
  padding: 12px 16px 92px;
}

.mobile-appbar {
  position: relative;
  justify-content: space-between;
  min-height: 42px;
}

.mobile-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.mobile-appbar strong {
  margin-right: auto;
  margin-left: 10px;
  font-size: 18px;
}

.mobile-appbar button,
.mobile-url-row button {
  width: 34px;
  height: 34px;
  color: #f4f8fb;
  background: #1d222b;
  border-radius: 10px;
}

.scan-popover {
  position: absolute;
  top: 46px;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 10px;
  width: 250px;
  padding: 14px;
  background: #1d222b;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  box-shadow: 0 16px 32px rgb(0 0 0 / 28%);
}

.scan-popover span {
  color: #9ba7b5;
  font-size: 12px;
}

.scan-actions {
  display: flex;
  gap: 8px;
}

.scan-actions button {
  width: auto;
  padding: 0 10px;
}

.mobile-url-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 8px;
  margin-top: 18px;
}

.mobile-url-row input {
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  color: white;
  background: #1d222b;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  outline: 0;
}

.mobile-url-row button {
  width: 42px;
  height: 42px;
  color: #061d1b;
  background: #42d7ca;
}

.mobile-section-head {
  justify-content: space-between;
  margin-top: 24px;
}

.mobile-section-head span:last-child {
  color: #9ba7b5;
  font-size: 12px;
}

.mobile-select-toolbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mobile-select-toolbar button,
.mobile-bulk-actions button,
.finished-select-row button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  color: #f4f8fb;
  background: #1d222b;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 999px;
}

.mobile-select-toolbar:not(.active) button:nth-child(n + 2) {
  display: none;
}

.mobile-video-list,
.mobile-download-list,
.mobile-finished-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.mobile-video-card,
.mobile-download-card,
.mobile-finished-card {
  gap: 10px;
  padding: 12px;
  background: #1d222b;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 14px;
}

.mobile-video-card input,
.mobile-finished-card input {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  accent-color: #42d7ca;
}

.downloads-mobile .mobile-download-tabs {
  margin-top: 22px;
}

.mobile-download-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mobile-download-tabs button {
  height: 36px;
  color: #9ba7b5;
  background: #1d222b;
  border-radius: 999px;
}

.mobile-download-tabs button.active {
  color: #061d1b;
  background: #42d7ca;
}

.mobile-bulk-actions,
.finished-select-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.mobile-download-card {
  display: grid;
  color: #9ba7b5;
  font-size: 12px;
}

.download-card-top {
  justify-content: space-between;
  color: #f4f8fb;
  font-size: 14px;
}

.mobile-finished-card {
  justify-content: space-between;
}

.mobile-finished-card.selected {
  border-color: #42d7ca;
  background: rgb(66 215 202 / 11%);
}

.mobile-player-page {
  height: 100%;
  overflow: auto;
  padding-bottom: 24px;
  background: #11141a;
}

.mobile-player-hero {
  position: relative;
  height: 56%;
  min-height: 380px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, rgb(66 215 202 / 30%), transparent 36%),
    linear-gradient(135deg, #1267c9, #043473);
}

.mobile-player-hero :deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}

.readable-bar {
  position: absolute;
  top: 14px;
  right: 12px;
  left: 12px;
  z-index: 30;
  justify-content: space-between;
  gap: 10px;
  padding: 8px;
  background: rgb(0 0 0 / 38%);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.readable-bar button {
  width: 34px;
  height: 34px;
  color: white;
  background: rgb(255 255 255 / 12%);
  border-radius: 10px;
}

.readable-bar span {
  display: grid;
  flex: 1;
  min-width: 0;
}

.readable-bar em {
  color: #cbd5e1;
  font-size: 11px;
  font-style: normal;
}

.readable-bar strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-download-float {
  position: absolute;
  top: 86px;
  right: 16px;
  z-index: 32;
  display: grid;
  place-items: center;
  gap: 4px;
  width: 58px;
  height: 58px;
  color: white;
  background: rgb(0 0 0 / 42%);
  border: 0;
  border-radius: 16px;
}

.mobile-download-float span {
  font-size: 11px;
}

.mock-player-controls {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.mock-player-controls button {
  width: 48px;
  height: 48px;
  color: white;
  background: rgb(0 0 0 / 38%);
  border-radius: 999px;
}

.mock-player-controls .play {
  width: 64px;
  height: 64px;
}

.mobile-player-info {
  display: grid;
  gap: 12px;
  padding: 18px 16px;
}

.download-state {
  padding: 9px 12px;
  color: #42d7ca;
  font-size: 12px;
  background: rgb(66 215 202 / 10%);
  border-radius: 10px;
}

.mobile-player-info h3 {
  margin: 0;
  font-size: 18px;
}

.mobile-player-info p {
  margin: 0;
  color: #9ba7b5;
  line-height: 1.6;
}

.bottom-nav,
.bottom-delete-bar {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 50;
  height: 62px;
  background: rgb(17 20 26 / 92%);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 18px;
  backdrop-filter: blur(12px);
}

.bottom-nav {
  justify-content: space-around;
}

.bottom-nav button,
.bottom-delete-bar button {
  display: grid;
  place-items: center;
  gap: 3px;
  color: #9ba7b5;
  background: transparent;
  border: 0;
}

.bottom-nav button.active {
  color: #42d7ca;
}

.bottom-delete-bar {
  display: grid;
  place-items: center;
}

.bottom-delete-bar button {
  display: inline-flex;
  grid-auto-flow: column;
  color: #ff6b72;
  font-weight: 700;
}

.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: rgb(0 0 0 / 55%);
  border: 3px dashed #42d7ca;
}

.drop-indicator {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}
</style>

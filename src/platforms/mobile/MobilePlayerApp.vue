<script setup lang="ts">
import { computed } from 'vue';
import {
  Button as VanButton,
  Checkbox as VanCheckbox,
  Field as VanField,
  Progress as VanProgress,
  Switch as VanSwitch,
  showToast
} from 'vant';
import 'vant/lib/index.css';
import { ArtPlayer } from '@/features/player/usePlayerWorkspace';
import { useProvidedPlayerWorkspace } from '@/features/player/workspaceContext';

const workspace = useProvidedPlayerWorkspace();

const iconPaths: Record<string, string> = {
  playSquare: '<rect x="3" y="3" width="18" height="18" rx="3"></rect><polygon points="10 8 16 12 10 16"></polygon>',
  plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4.2-4.2"></path>',
  trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
  checkSquare: '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="m8 12 3 3 5-6"></path>',
  close: '<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>',
  folder: '<path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  folderSearch: '<path d="M3 6h6l2 2h10v5"></path><path d="M3 10v8a2 2 0 0 0 2 2h8"></path><circle cx="17" cy="17" r="3"></circle><path d="m21 21-2-2"></path>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2"></path><path d="M17 4h2a1 1 0 0 1 1 1v2"></path><path d="M20 17v2a1 1 0 0 1-1 1h-2"></path><path d="M7 20H5a1 1 0 0 1-1-1v-2"></path><path d="M7 12h10"></path>',
  pause: '<path d="M8 5v14"></path><path d="M16 5v14"></path>',
  play: '<polygon points="8 5 19 12 8 19" data-fill="true"></polygon>',
  download: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
  home: '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>',
  back: '<path d="m15 18-6-6 6-6"></path>',
  more: '<circle cx="5" cy="12" r="1" data-fill="true"></circle><circle cx="12" cy="12" r="1" data-fill="true"></circle><circle cx="19" cy="12" r="1" data-fill="true"></circle>',
  rewind: '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path>',
  forward: '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>',
  shieldOff: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9.5 9.5 5 5"></path><path d="m14.5 9.5-5 5"></path>',
  like: '<path d="M7 10v10"></path><path d="M15 10l1-5a3 3 0 0 0-3-3l-4 8v10h8a3 3 0 0 0 3-2l2-6a2 2 0 0 0-2-2z"></path><path d="M3 10h4v10H3z"></path>',
  cast: '<path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12"></path><path d="M2 16a5 5 0 0 1 5 5"></path><path d="M2 20h.01"></path><path d="M2 12a9 9 0 0 1 9 9"></path>',
  fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2h-3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path>'
};

const playerTitle = computed(() => {
  return workspace.currentVideo.value?.videoName || workspace.selectedVideo.value?.title || workspace.getUrlTitle(workspace.urlInput.value);
});

const playerSource = computed(() => workspace.selectedVideo.value?.source || '输入地址');
const playerDuration = computed(() => workspace.selectedVideo.value?.duration || '29:32');
const isNativeMobileShell = typeof window !== 'undefined' && Boolean(window.Capacitor);

const icon = (name: keyof typeof iconPaths): string => {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;
};

const mobileVideoMeta = (video: { source: string; quality: string; downloadable: boolean }): string => {
  const source = video.source === '本地文件' ? '本地' : video.source === '流媒体' ? '网络' : video.source;
  const capability = video.source === '本地文件' ? '可继续播放' : video.downloadable ? '单文件可下载' : '无下载入口';
  return `${source} · ${video.quality} · ${capability}`;
};

const handleDownload = async (): Promise<void> => {
  const ok = await workspace.handlePlayerDownload();
  showToast(ok ? '已保存到本地' : '当前资源暂不可下载');
};
</script>

<template>
  <section class="mobile-player-shell" :class="{ 'native-shell': isNativeMobileShell }">
    <div v-if="!isNativeMobileShell" class="mobile-status" :class="{ 'on-video': workspace.mobilePage.value === 'player' }">
      <span>9:41</span>
      <span class="status-dots"><span></span><span></span></span>
    </div>

    <section v-show="workspace.mobilePage.value === 'home'" class="mobile-page">
      <header class="app-bar">
        <span class="logo-mark" v-html="icon('playSquare')"></span>
        <strong class="bar-title">首页</strong>
        <VanButton class="icon-btn" native-type="button" aria-label="打开扫描功能" @click="workspace.scanPopoverOpen.value = !workspace.scanPopoverOpen.value">
          <span v-html="icon('plus')"></span>
        </VanButton>
        <div v-if="workspace.scanPopoverOpen.value" class="scan-popover">
          <strong>扫描视频文件</strong>
          <div class="scan-path"><span v-html="icon('folder')"></span><span>{{ workspace.scanState.path }}</span></div>
          <div class="scan-actions">
            <VanButton class="text-btn" native-type="button"><span v-html="icon('folderSearch')"></span>选择目录</VanButton>
            <VanButton class="text-btn" native-type="button"><span v-html="icon('scan')"></span>立即扫描</VanButton>
          </div>
          <div class="switch-line"><span>自动扫描指定目录</span><VanSwitch v-model="workspace.scanState.autoScan" size="22px" active-color="#42d7ca" inactive-color="#4b5563" /></div>
        </div>
      </header>

      <form class="search-row" @submit.prevent="workspace.submitUrl">
        <VanField v-model="workspace.urlInput.value" class="url-input" aria-label="输入视频地址" placeholder="输入视频地址" />
        <VanButton class="icon-btn" native-type="submit" aria-label="搜索并播放"><span v-html="icon('search')"></span></VanButton>
      </form>

      <div class="section-head">
        <span>视频列表</span>
        <span class="small-muted">
          {{ workspace.homeSelecting.value ? `已选 ${workspace.selectedHomeVideos.value.size} / ${workspace.mobileVideos.value.length}` : `${workspace.mobileVideos.value.length} 个文件` }}
        </span>
      </div>

      <div class="select-toolbar" :class="{ active: workspace.homeSelecting.value }">
        <VanButton class="text-btn" native-type="button" @click="workspace.startHomeSelection"><span v-html="icon('trash')"></span>批量删除</VanButton>
        <VanButton v-if="workspace.homeSelecting.value" class="text-btn" native-type="button" @click="workspace.selectAllHomeVideos"><span v-html="icon('checkSquare')"></span>全选</VanButton>
        <VanButton v-if="workspace.homeSelecting.value" class="text-btn" native-type="button" @click="workspace.cancelHomeSelection"><span v-html="icon('close')"></span>取消</VanButton>
      </div>

      <div class="video-list">
        <article
          v-for="video in workspace.mobileVideos.value"
          :key="video.id"
          class="video-card"
          :class="{ selecting: workspace.homeSelecting.value }"
          @click="workspace.homeSelecting.value ? workspace.toggleHomeVideo(video.id) : workspace.openMobilePlayer(video)"
        >
          <VanCheckbox
            v-if="workspace.homeSelecting.value"
            class="video-check"
            :aria-label="`选择${video.title}`"
            :model-value="workspace.selectedHomeVideos.value.has(video.id)"
            @click.stop
            @update:model-value="workspace.toggleHomeVideo(video.id)"
          />
          <button class="video-open" type="button">
            <span class="thumb" :data-time="video.duration"></span>
            <span class="video-copy">
              <strong>{{ video.title }}</strong>
              <span>{{ mobileVideoMeta(video) }}</span>
            </span>
          </button>
        </article>
      </div>
    </section>

    <section v-show="workspace.mobilePage.value === 'downloads'" class="mobile-page">
      <header class="app-bar">
        <span class="logo-mark" v-html="icon('playSquare')"></span>
        <strong class="bar-title">下载</strong>
        <VanButton class="icon-btn" native-type="button" aria-label="打开扫描功能" @click="workspace.scanPopoverOpen.value = !workspace.scanPopoverOpen.value">
          <span v-html="icon('plus')"></span>
        </VanButton>
        <div v-if="workspace.scanPopoverOpen.value" class="scan-popover">
          <strong>扫描视频文件</strong>
          <div class="scan-path"><span v-html="icon('folder')"></span><span>/storage/emulated/0/Download</span></div>
          <div class="scan-actions">
            <VanButton class="text-btn" native-type="button"><span v-html="icon('folderSearch')"></span>选择目录</VanButton>
            <VanButton class="text-btn" native-type="button"><span v-html="icon('scan')"></span>立即扫描</VanButton>
          </div>
          <div class="switch-line"><span>自动扫描下载目录</span><VanSwitch v-model="workspace.scanState.autoScan" size="22px" active-color="#42d7ca" inactive-color="#4b5563" /></div>
        </div>
      </header>

      <div class="tab-strip" role="group" aria-label="下载页面分类">
        <button class="tab" :class="{ active: workspace.downloadTab.value === 'downloading' }" type="button" @click="workspace.downloadTab.value = 'downloading'">下载中</button>
        <button class="tab" :class="{ active: workspace.downloadTab.value === 'finished' }" type="button" @click="workspace.downloadTab.value = 'finished'">已完成</button>
      </div>

      <div v-if="workspace.downloadTab.value === 'downloading'">
        <div class="bulk-actions">
          <VanButton class="text-btn" native-type="button" @click="workspace.pauseAllDownloads"><span v-html="icon('pause')"></span>全部暂停</VanButton>
          <VanButton class="text-btn" native-type="button" @click="workspace.startAllDownloads"><span v-html="icon('play')"></span>全部开始</VanButton>
          <VanButton class="text-btn danger" native-type="button" @click="workspace.deleteAllDownloads"><span v-html="icon('trash')"></span>全部删除</VanButton>
        </div>

        <div class="download-list">
          <article v-for="task in workspace.downloadTasks.value" :key="task.id" class="download-card">
            <div class="download-top">
              <VanCheckbox class="check" :model-value="task.progress >= 60" :aria-label="`选择${task.title}`" />
              <div class="task-copy">
                <strong>{{ task.title }}</strong>
                <span>{{ task.remainingTime ? `剩余 ${task.remainingTime}` : `保存到 /Movies/Downloads` }}</span>
              </div>
              <div class="row-actions">
                <VanButton native-type="button" aria-label="暂停下载" @click="workspace.toggleTaskStatus(task.id)"><span v-html="icon(task.status === 'paused' ? 'play' : 'pause')"></span></VanButton>
                <VanButton native-type="button" aria-label="删除下载" @click="workspace.deleteTask(task.id)"><span v-html="icon('trash')"></span></VanButton>
              </div>
            </div>
            <div class="progress-row">
              <VanProgress class="local-progress" :percentage="task.progress" stroke-width="6" pivot-text="" color="#42d7ca" track-color="#292e39" />
              <span>{{ task.progress }}% · {{ task.speed || '已暂停' }}</span>
            </div>
          </article>
        </div>
      </div>

      <div v-else>
        <div class="finished-select-row">
          <VanButton class="text-btn danger clear-records" native-type="button" @click="workspace.clearFinishedRecords"><span v-html="icon('trash')"></span>清空记录</VanButton>
          <VanButton class="text-btn" native-type="button" @click="workspace.toggleFinishedSelectAll">{{ workspace.finishedSelectAllLabel.value }}</VanButton>
        </div>
        <div class="finished-list">
          <article
            v-for="record in workspace.finishedRecords.value"
            :key="record.id"
            class="finished-card"
            :class="{ selected: workspace.selectedFinishedRecords.value.has(record.id) }"
            @click="workspace.toggleFinishedRecord(record.id)"
          >
            <div>
              <strong>{{ record.title }}</strong>
              <span>{{ record.size }} · {{ record.completedAt }}</span>
            </div>
            <VanCheckbox
              class="finished-check"
              :aria-label="`选择${record.title}`"
              :model-value="workspace.selectedFinishedRecords.value.has(record.id)"
              @click.stop
              @update:model-value="workspace.toggleFinishedRecord(record.id)"
            />
          </article>
        </div>
      </div>
    </section>

    <section v-show="workspace.mobilePage.value === 'player'" class="mobile-page player-page">
      <div class="player-hero">
        <ArtPlayer
          v-if="workspace.currentVideo.value?.videoPath"
          :key="workspace.currentVideo.value.videoPath || 'mobile-player'"
          class="mobile-art-player"
          :url="workspace.currentVideo.value.videoPath"
          @get-duration="(duration) => workspace.playerStore.updateDuration(duration, workspace.currentVideo.value!)"
          @playback-error="workspace.playerStore.fallbackToTranscode(workspace.currentVideo.value!)"
        />

        <div class="readable-bar">
          <VanButton class="overlay-btn" native-type="button" aria-label="返回" @click="workspace.backFromPlayer"><span v-html="icon('back')"></span></VanButton>
          <div class="readable-title">
            <span>{{ playerSource }}</span>
            <strong>{{ playerTitle }}</strong>
          </div>
          <VanButton class="overlay-btn" native-type="button" aria-label="更多"><span v-html="icon('more')"></span></VanButton>
        </div>

        <div v-if="workspace.playerDownloadable.value" class="download-float">
          <VanButton class="overlay-btn" native-type="button" aria-label="下载当前视频" :disabled="workspace.isDownloading.value" @click="handleDownload"><span v-html="icon('download')"></span></VanButton>
          <span>可下载</span>
        </div>

        <div class="center-controls">
          <VanButton class="overlay-btn" native-type="button" aria-label="快退十秒"><span v-html="icon('rewind')"></span></VanButton>
          <VanButton class="overlay-btn play-main" native-type="button" aria-label="播放或暂停"><span v-html="icon('pause')"></span></VanButton>
          <VanButton class="overlay-btn" native-type="button" aria-label="快进十秒"><span v-html="icon('forward')"></span></VanButton>
        </div>

        <div class="player-bottom">
          <div class="progress-meta"><span>12:48</span><span>{{ playerDuration }}</span></div>
          <div class="bar"><div class="fill"></div></div>
        </div>
      </div>

      <div class="player-info">
        <div class="download-state">
          <span v-html="icon(workspace.playerDownloadable.value ? 'shield' : 'shieldOff')"></span>
          {{ workspace.downloadStateText.value }}
        </div>
        <h3>{{ workspace.getDisplayTitle(playerTitle) }}</h3>
        <p class="small-muted">播放页浮层使用深色半透明底和文字阴影，保证在亮色、暗色、复杂画面下都可读。</p>
        <div class="action-line">
          <VanButton class="pill-btn" native-type="button"><span v-html="icon('like')"></span>喜欢</VanButton>
          <VanButton class="pill-btn" native-type="button"><span v-html="icon('cast')"></span>投屏</VanButton>
          <VanButton class="pill-btn" native-type="button"><span v-html="icon('fullscreen')"></span>全屏</VanButton>
        </div>
      </div>
    </section>

    <nav v-if="!workspace.showMobileDeleteBar.value" class="bottom-nav" aria-label="底部导航">
      <button class="nav-btn" :class="{ active: workspace.mobilePage.value === 'home' }" type="button" @click="workspace.setMobilePage('home')">
        <span v-html="icon('home')"></span><span>首页</span>
      </button>
      <button class="nav-btn" :class="{ active: workspace.mobilePage.value === 'downloads' }" type="button" @click="workspace.setMobilePage('downloads')">
        <span v-html="icon('download')"></span><span>下载</span>
      </button>
    </nav>

    <div v-else class="bottom-delete-bar">
      <VanButton class="text-btn danger" native-type="button" @click="workspace.deleteSelectedMobileItems"><span v-html="icon('trash')"></span>删除</VanButton>
    </div>
  </section>
</template>

<style scoped>
.mobile-player-shell {
  --screen: #11141a;
  --surface: #1d222b;
  --surface-soft: #292e39;
  --text: #f4f8fb;
  --muted: #9ba7b5;
  --border: rgb(255 255 255 / 10%);
  --accent: #42d7ca;
  --accent-text: #061d1b;
  --danger: #ff6b72;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--text);
  background: var(--screen);
}

.mobile-player-shell :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mobile-player-shell :deep([data-fill]) {
  fill: currentColor;
  stroke: none;
}

.mobile-player-shell :deep(.van-button) {
  margin: 0;
  padding: 0;
  line-height: normal;
}

.mobile-player-shell :deep(.van-button::before) {
  display: none;
}

.mobile-player-shell :deep(.van-checkbox__icon) {
  font-size: 18px;
}

.mobile-player-shell :deep(.van-checkbox__icon--checked .van-icon) {
  color: var(--accent-text);
  background: var(--accent);
  border-color: var(--accent);
}

.mobile-status {
  position: absolute;
  inset: 0 0 auto;
  z-index: 40;
  display: flex;
  height: 34px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 17px 0;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.mobile-status.on-video {
  color: #f8fafc;
  text-shadow: 0 1px 8px rgb(0 0 0 / 80%);
}

.status-dots {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.status-dots span:first-child {
  width: 14px;
  height: 9px;
  border-top: 2px solid currentColor;
  border-radius: 999px 999px 0 0;
}

.status-dots span:last-child {
  width: 16px;
  height: 8px;
  border: 1.8px solid currentColor;
  border-radius: 2px;
}

.mobile-page {
  position: absolute;
  inset: 34px 0 64px;
  overflow: hidden;
  background: var(--screen);
}

.mobile-player-shell.native-shell .mobile-page {
  inset: 0 0 64px;
}

.app-bar {
  position: relative;
  z-index: 10;
  display: flex;
  height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 16px;
  background: rgb(29 32 40 / 92%);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
}

.logo-mark {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--accent-text);
  background: var(--accent);
  border-radius: 12px;
}

.bar-title {
  position: absolute;
  right: 68px;
  left: 68px;
  overflow: hidden;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.icon-btn,
.pill-btn,
.text-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
}

.icon-btn {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 12px;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 8px;
  margin: 4px 16px 12px;
}

.url-input {
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  outline-color: var(--accent);
}

.url-input :deep(.van-field__body) {
  height: 100%;
}

.url-input :deep(.van-field__control) {
  height: 100%;
  color: var(--text);
}

.url-input :deep(.van-field__control::placeholder) {
  color: var(--muted);
}

.scan-popover {
  position: absolute;
  top: 48px;
  right: 14px;
  z-index: 30;
  display: grid;
  width: min(300px, calc(100% - 28px));
  gap: 10px;
  padding: 12px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgb(31 42 58 / 34%);
}

.scan-popover strong {
  font-size: 13px;
  font-weight: 500;
}

.scan-path,
.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  color: var(--muted);
  font-size: 12px;
}

.scan-path {
  justify-content: flex-start;
}

.scan-path span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scan-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px 9px;
  font-size: 13px;
  font-weight: 500;
}

.small-muted {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.select-toolbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
  align-items: center;
  margin: 0 16px 10px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 13px;
}

.select-toolbar.active {
  grid-template-columns: repeat(3, 1fr);
}

.text-btn {
  min-height: 34px;
  gap: 5px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 10px;
}

.text-btn.danger {
  color: var(--danger);
}

.video-list,
.download-list,
.finished-list {
  display: grid;
  gap: 10px;
  max-height: calc(100% - 170px);
  padding: 0 16px 12px;
  overflow: hidden;
}

.video-card,
.download-card,
.finished-card {
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}

.video-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px;
}

.video-card.selecting {
  grid-template-columns: 24px 1fr;
}

.video-open {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
}

.video-check,
.check,
.finished-check {
  accent-color: var(--accent);
}

.video-check {
  width: 20px;
  height: 20px;
  justify-self: center;
}

.thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(66 215 202 / 78%), rgb(77 125 245 / 42%)),
    linear-gradient(90deg, #334155, #111827);
  border-radius: 10px;
}

.thumb::after {
  position: absolute;
  right: 5px;
  bottom: 5px;
  padding: 2px 5px;
  color: #fff;
  font-size: 10px;
  content: attr(data-time);
  background: rgb(2 6 23 / 78%);
  border-radius: 5px;
}

.video-copy,
.task-copy {
  min-width: 0;
}

.video-copy strong,
.download-card strong,
.finished-card strong {
  display: block;
  margin-bottom: 4px;
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-copy span,
.download-card span,
.finished-card span {
  display: block;
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-strip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  margin: 10px 16px 12px;
  padding: 4px;
  background: var(--surface-soft);
  border-radius: 999px;
}

.tab {
  min-height: 34px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  background: transparent;
  border: 0;
  border-radius: 999px;
}

.tab.active {
  color: var(--accent-text);
  background: var(--accent);
}

.bulk-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0 16px 12px;
}

.download-card {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.download-top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
}

.check {
  width: 20px;
  height: 20px;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.row-actions button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 9px;
}

.progress-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  color: var(--muted);
  font-size: 11px;
}

.local-progress {
  overflow: visible;
  background: transparent;
}

.finished-select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  margin: 0 16px 10px;
}

.finished-list {
  max-height: calc(100% - 150px);
}

.finished-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
}

.finished-card.selected {
  background: rgb(66 215 202 / 10%);
  border-color: rgb(66 215 202 / 70%);
}

.finished-check {
  width: 22px;
  height: 22px;
}

.player-page {
  inset: 0 0 64px;
  z-index: 20;
}

.player-hero {
  position: relative;
  height: 46%;
  min-height: 292px;
  overflow: hidden;
  color: #f8fafc;
  background:
    linear-gradient(180deg, rgb(2 6 23 / 88%), transparent 30%, transparent 55%, rgb(2 6 23 / 92%)),
    linear-gradient(125deg, #2131a2 0%, #202898 30%, #14245a 58%, #0f1731 100%);
}

.player-hero::before {
  position: absolute;
  right: -20%;
  bottom: 17%;
  width: 82%;
  height: 32%;
  content: "";
  background: rgb(255 255 255 / 24%);
  border-radius: 999px;
  filter: blur(28px);
  transform: rotate(-12deg);
}

.mobile-art-player {
  position: absolute;
  inset: 0;
  opacity: 0.72;
}

.readable-bar {
  position: absolute;
  top: 42px;
  right: 14px;
  left: 14px;
  z-index: 3;
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 6px;
  color: #f8fafc;
  text-shadow: 0 1px 8px rgb(0 0 0 / 72%);
  background: linear-gradient(90deg, rgb(2 6 23 / 76%), rgb(2 6 23 / 36%));
  border-radius: 18px;
  backdrop-filter: blur(16px);
}

.overlay-btn {
  display: inline-grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  color: #f8fafc;
  background: rgb(3 7 18 / 62%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 50%;
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  backdrop-filter: blur(16px);
}

.readable-title {
  flex: 1;
  min-width: 0;
}

.readable-title strong,
.readable-title span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readable-title strong {
  font-size: 13px;
  font-weight: 500;
}

.readable-title span {
  color: rgb(248 250 252 / 78%);
  font-size: 11px;
}

.download-float {
  position: absolute;
  top: 96px;
  right: 18px;
  z-index: 3;
  display: grid;
  gap: 5px;
  justify-items: center;
  color: #f8fafc;
  font-size: 10px;
  text-shadow: 0 1px 8px rgb(0 0 0 / 75%);
}

.center-controls {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}

.play-main {
  width: 64px;
  height: 64px;
  color: #0f172a;
  background: rgb(248 250 252 / 94%);
}

.player-bottom {
  position: absolute;
  right: 16px;
  bottom: 15px;
  left: 16px;
  z-index: 3;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  color: rgb(248 250 252 / 78%);
  font-size: 11px;
  text-shadow: 0 1px 8px rgb(0 0 0 / 75%);
}

.bar {
  height: 5px;
  overflow: hidden;
  background: rgb(248 250 252 / 26%);
  border-radius: 999px;
}

.fill {
  position: relative;
  width: 46%;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
}

.fill::after {
  position: absolute;
  top: 50%;
  right: -5px;
  width: 13px;
  height: 13px;
  content: "";
  background: #f8fafc;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(53 208 196 / 24%);
  transform: translateY(-50%);
}

.player-info {
  position: absolute;
  inset: 46% 0 0;
  padding: 16px;
  color: var(--text);
  background: var(--screen);
  border-radius: 22px 22px 0 0;
}

.download-state {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 0 9px;
  color: var(--muted);
  font-size: 11px;
  background: var(--surface-soft);
  border-radius: 999px;
}

.player-info h3 {
  margin: 0 0 6px;
  color: var(--text);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
}

.player-info p {
  margin: 0;
}

.action-line {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  overflow: hidden;
}

.pill-btn {
  min-height: 34px;
  gap: 6px;
  padding: 0 12px;
  font-size: 12px;
  white-space: nowrap;
  border-radius: 999px;
}

.bottom-nav,
.bottom-delete-bar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  height: 64px;
  background: rgb(24 27 35 / 96%);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(16px);
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.bottom-delete-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}

.bottom-delete-bar .text-btn {
  width: 100%;
  min-height: 42px;
  border-radius: 13px;
}

.nav-btn {
  display: grid;
  gap: 3px;
  place-items: center;
  align-content: center;
  color: var(--muted);
  font-size: 11px;
  background: transparent;
  border: 0;
}

.nav-btn.active {
  color: var(--accent);
  font-weight: 500;
}

@media (max-width: 380px) {
  .video-open {
    grid-template-columns: 82px minmax(0, 1fr);
  }

  .bulk-actions {
    grid-template-columns: 1fr;
  }

  .player-hero {
    min-height: 260px;
  }
}
</style>

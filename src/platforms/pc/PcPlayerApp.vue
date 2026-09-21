<script setup lang="ts">
import 'element-plus/dist/index.css';

import { ElConfigProvider, ElMessage } from 'element-plus';
import {
  CaretRight,
  Close,
  Delete,
  Download,
  FolderOpened,
  FullScreen,
  Minus,
  Plus,
  Search,
  Sort,
  VideoPause
} from '@element-plus/icons-vue';
import { ArtPlayer } from '@/features/player/usePlayerWorkspace';
import { useProvidedPlayerWorkspace } from '@/features/player/workspaceContext';
import { getPlatformAdapter } from '@/app-ui/adapters';

const workspace = useProvidedPlayerWorkspace();

const windowApi = getPlatformAdapter().window;

const handleDownload = async (): Promise<void> => {
  const ok = await workspace.handlePlayerDownload();
  if (ok) ElMessage.success('视频已保存到本地');
  else if (workspace.playerDownloadable.value) ElMessage.error('视频下载失败，请稍后重试');
};
</script>

<template>
  <el-config-provider>
    <section class="pc-player-shell" aria-label="影音播放器桌面端">
      <header class="pc-titlebar">
        <div class="brand">
          <div class="brand-mark"><el-icon><CaretRight /></el-icon></div>
          <strong>影音播放器</strong>
        </div>
        <div class="window-actions" aria-label="窗口控制">
          <button class="pc-window-btn" type="button" aria-label="最小化" @click="windowApi.minimize">
            <el-icon><Minus /></el-icon>
          </button>
          <button class="pc-window-btn" type="button" aria-label="最大化" @click="windowApi.maximize">
            <el-icon><FullScreen /></el-icon>
          </button>
          <button class="pc-window-btn" type="button" aria-label="关闭" @click="windowApi.close">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </header>

      <div class="pc-body">
        <aside class="pc-sidebar">
          <nav class="view-tabs" aria-label="功能导航">
            <button
              class="pc-tab"
              :class="{ 'pc-tab-active': workspace.desktopView.value === 'video' }"
              type="button"
              @click="workspace.desktopView.value = 'video'"
            >
              视频
            </button>
            <button
              class="pc-tab"
              :class="{ 'pc-tab-active': workspace.desktopView.value === 'downloads' }"
              type="button"
              @click="workspace.desktopView.value = 'downloads'"
            >
              下载
            </button>
          </nav>

          <section class="library-head">
            <div class="library-row">
              <strong>共 {{ workspace.sidebarVideoCount.value }} 个视频</strong>
              <div class="sidebar-actions">
                <button class="pc-icon-btn" type="button" aria-label="添加" @click="workspace.openLocalFile">
                  <el-icon><Plus /></el-icon>
                </button>
                <button class="pc-icon-btn" type="button" aria-label="删除" @click="workspace.playerStore.deleteAllVideos">
                  <el-icon><Delete /></el-icon>
                </button>
                <button class="pc-icon-btn" type="button" aria-label="排序" @click="workspace.playerStore.toggleSortDate">
                  <el-icon><Sort /></el-icon>
                </button>
              </div>
            </div>
            <label class="sidebar-search">
              <el-icon><Search /></el-icon>
              <input
                v-model="workspace.searchKeyword.value"
                aria-label="搜索列表视频"
                placeholder="搜索列表视频"
              />
            </label>
          </section>

          <section class="desktop-video-list" aria-label="视频列表">
            <button
              v-for="video in workspace.filteredVideos.value"
              :key="video.id"
              class="desktop-video-item"
              :class="{ active: workspace.selectedVideoId.value === video.id }"
              type="button"
              @click="workspace.playVideo(video)"
            >
              <span class="pc-thumb" :data-time="video.duration"></span>
              <span class="video-meta">
                <strong>{{ video.title }}</strong>
                <span>
                  {{ video.source }} · {{ video.quality }} · {{ video.downloadable ? '可下载' : '继续播放' }}
                </span>
              </span>
            </button>
          </section>
        </aside>

        <main class="pc-main" aria-label="主区域">
          <section v-show="workspace.desktopView.value === 'video'" class="desktop-video-view">
            <div v-if="workspace.hasPlayingVideo.value" class="desktop-player-stage">
              <ArtPlayer
                :key="workspace.currentVideo.value!.videoPath || 'desktop-player'"
                :url="workspace.currentVideo.value!.videoPath!"
                @get-duration="(duration) => workspace.playerStore.updateDuration(duration, workspace.currentVideo.value!)"
                @playback-error="workspace.playerStore.fallbackToTranscode(workspace.currentVideo.value!)"
              />
              <button
                v-if="workspace.playerDownloadable.value"
                class="floating-download"
                type="button"
                aria-label="下载当前视频"
                title="下载当前视频"
                :disabled="workspace.isDownloading.value"
                @click="handleDownload"
              >
                <el-icon><Download /></el-icon>
              </button>
            </div>

            <div v-else class="desktop-home-card">
              <div class="hero-mark"><el-icon><CaretRight /></el-icon></div>
              <form class="url-form" @submit.prevent="workspace.submitUrl">
                <label>
                  <span>视频地址</span>
                  <input v-model="workspace.urlInput.value" aria-label="输入视频地址" />
                </label>
              </form>
              <button class="primary-action" type="button" @click="workspace.openLocalFile">
                <el-icon><FolderOpened /></el-icon>
                打开文件
              </button>
            </div>
          </section>

          <section v-show="workspace.desktopView.value === 'downloads'" class="downloads-view">
            <div class="download-tabs" role="group" aria-label="下载分类">
              <button
                class="pc-download-tab"
                :class="{ 'pc-download-tab-active': workspace.downloadTab.value === 'downloading' }"
                type="button"
                @click="workspace.downloadTab.value = 'downloading'"
              >
                下载中({{ workspace.downloadTasks.value.length }})
              </button>
              <button
                class="pc-download-tab"
                :class="{ 'pc-download-tab-active': workspace.downloadTab.value === 'finished' }"
                type="button"
                @click="workspace.downloadTab.value = 'finished'"
              >
                已完成({{ workspace.finishedRecords.value.length }})
              </button>
            </div>

            <div v-if="workspace.downloadTab.value === 'downloading'" class="bulk-actions">
              <button type="button" @click="workspace.pauseAllDownloads"><el-icon><VideoPause /></el-icon>全部暂停</button>
              <button type="button" @click="workspace.startAllDownloads"><el-icon><CaretRight /></el-icon>全部开始</button>
              <button class="danger" type="button" @click="workspace.deleteAllDownloads"><el-icon><Delete /></el-icon>全部删除</button>
            </div>

            <div v-else class="bulk-actions">
              <button class="danger" type="button" @click="workspace.clearFinishedRecords"><el-icon><Delete /></el-icon>清空全部记录</button>
            </div>

            <div v-if="workspace.downloadTab.value === 'downloading'" class="download-task-list">
              <article
                v-for="task in workspace.downloadTasks.value"
                :key="task.id"
                class="download-row"
              >
                <div class="download-meta">
                  <strong>{{ task.title }}</strong>
                  <span>
                    {{ task.progress }}% · {{ task.speed || '已暂停' }} · 保存到 {{ task.savePath }}{{ task.remainingTime ? ` · 剩余 ${task.remainingTime}` : '' }}
                  </span>
                  <div class="progress">
                    <div :style="{ width: `${task.progress}%` }"></div>
                  </div>
                </div>
                <div class="row-actions">
                  <button type="button" :aria-label="task.status === 'paused' ? '开始' : '暂停'" :title="task.status === 'paused' ? '开始' : '暂停'" @click="workspace.toggleTaskStatus(task.id)">
                    <el-icon><component :is="task.status === 'paused' ? CaretRight : VideoPause" /></el-icon>
                  </button>
                  <button type="button" aria-label="删除" title="删除" @click="workspace.deleteTask(task.id)">
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
              <div v-for="record in workspace.finishedRecords.value" :key="record.id" class="finished-row">
                <span>{{ record.title }}</span>
                <span>{{ record.size }}</span>
                <span>{{ record.completedAt }}</span>
                <div class="finished-actions">
                  <button type="button" aria-label="播放" title="播放"><el-icon><CaretRight /></el-icon></button>
                  <button type="button" aria-label="打开文件位置" title="打开文件位置"><el-icon><FolderOpened /></el-icon></button>
                  <button class="clear" type="button" aria-label="清除" title="清除" @click="workspace.clearFinishedRecord(record.id)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </section>
  </el-config-provider>
</template>

<style scoped>
.pc-player-shell {
  display: grid;
  grid-template-rows: 60px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f4f8fb;
  background: #171a21;
  font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.pc-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0;
  padding: 0 12px 0 20px;
  background: linear-gradient(180deg, #1e2129, #191c23);
  border-bottom: 1px solid rgb(255 255 255 / 10%);
  -webkit-app-region: drag;
  user-select: none;
}

.pc-titlebar button {
  -webkit-app-region: no-drag;
}

.pc-body {
  display: flex;
  align-items: stretch;
  min-width: 0;
  min-height: 0;
}

.pc-sidebar {
  display: grid;
  grid-template-rows: 58px auto minmax(0, 1fr);
  width: 260px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #11141a;
  border-right: 1px solid rgb(255 255 255 / 10%);
}

.pc-main {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(7 10 18 / 18%), rgb(7 10 18 / 64%)),
    radial-gradient(circle at 54% 42%, rgb(66 215 202 / 24%), transparent 18%),
    linear-gradient(130deg, #2233a6 0%, #202997 30%, #14265d 58%, #101933 100%);
}

.brand,
.window-actions,
.library-row,
.sidebar-actions,
.desktop-video-item,
.bulk-actions,
.download-row,
.finished-actions {
  display: flex;
  align-items: center;
}

.brand {
  gap: 12px;
  font-size: 20px;
  font-weight: 500;
}

.brand-mark,
.hero-mark {
  display: grid;
  place-items: center;
  color: #061d1b;
  background: #42d7ca;
}

.brand-mark {
  width: 34px;
  height: 34px;
  font-size: 18px;
  border-radius: 10px;
  box-shadow: 0 0 0 4px rgb(66 215 202 / 10%);
}

.window-actions {
  gap: 4px;
  -webkit-app-region: no-drag;
}

.pc-window-btn,
.pc-icon-btn,
.row-actions button,
.finished-actions button {
  display: grid;
  place-items: center;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
}

.pc-window-btn {
  width: 38px;
  height: 34px;
  color: rgb(244 248 251 / 86%);
  border-radius: 6px;
}

.pc-window-btn:hover,
.pc-icon-btn:hover {
  background: rgb(255 255 255 / 10%);
}

.pc-window-btn:last-child:hover {
  color: white;
  background: #d94141;
}

.view-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.pc-tab {
  height: 34px;
  color: #f4f8fb;
  font-size: 12px;
  background: #292e39;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 7px;
}

.pc-tab-active {
  color: #032229;
  background: #42d7ca;
  border-color: #42d7ca;
}

.library-head {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.library-row {
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.library-row strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-actions {
  flex: 0 0 auto;
  gap: 6px;
}

.pc-icon-btn {
  width: 36px;
  height: 34px;
  color: #f5f7fb;
  background: #292e39;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 7px;
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  color: #9ba7b5;
  background: #1d232d;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 7px;
}

.sidebar-search input {
  width: 100%;
  min-width: 0;
  color: white;
  font-size: 12px;
  background: transparent;
  border: 0;
  outline: 0;
}

.sidebar-search input::placeholder {
  color: #d5dde8;
  opacity: 1;
}

.desktop-video-list {
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.desktop-video-item {
  width: 100%;
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px;
  padding: 8px;
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

.pc-thumb {
  position: relative;
  width: 84px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(66 215 202 / 85%), rgb(41 83 136 / 90%)),
    linear-gradient(135deg, #263341, #111826 68%);
  border-radius: 6px;
}

.desktop-video-item:nth-child(2n) .pc-thumb {
  background:
    linear-gradient(135deg, rgb(241 189 72 / 72%), rgb(39 65 126 / 86%)),
    linear-gradient(135deg, #263341, #111826 68%);
}

.pc-thumb::after {
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

.video-meta {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.video-meta strong,
.video-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta strong {
  font-size: 14px;
  font-weight: 500;
}

.video-meta span {
  color: #9ba7b5;
  font-size: 12px;
}

.desktop-video-view,
.desktop-player-stage,
.downloads-view {
  position: absolute;
  inset: 0;
}

.desktop-video-view {
  z-index: 1;
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
  position: absolute;
  top: 48%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  gap: 18px;
  width: min(620px, calc(100% - 64px));
  text-align: center;
  transform: translate(-50%, -50%);
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
  position: absolute;
  z-index: 3;
  background: #05070a;
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
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
  overflow: auto;
  padding: 28px 34px;
  color: #172033;
  background: #f7fafc;
  z-index: 4;
}

.download-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: fit-content;
  min-width: 260px;
}

.pc-download-tab {
  position: relative;
  min-height: 40px;
  padding: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  border: 0;
}

.pc-download-tab-active {
  color: #1677ff;
}

.pc-download-tab-active::after {
  position: absolute;
  right: 0;
  left: 50%;
  bottom: 0;
  width: 20px;
  height: 3px;
  content: "";
  background: #1677ff;
  border-radius: 999px;
  transform: translateX(-50%);
}

.bulk-actions {
  gap: 12px;
  margin: 0;
  flex-wrap: wrap;
}

.bulk-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 16px;
  color: #5d9dfb;
  font-size: 14px;
  font-weight: 500;
  background: #edf5ff;
  border: 0;
  border-radius: 7px;
  white-space: nowrap;
}

.bulk-actions .danger,
.danger {
  color: #d9444d;
}

.download-task-list {
  display: grid;
  align-content: start;
  width: 100%;
  min-height: 0;
}

.download-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-width: 0;
  gap: 14px;
  padding: 14px 0;
  background: transparent;
  border-bottom: 1px solid #d8e0e8;
}

.download-meta {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.download-meta strong,
.download-meta span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-meta strong {
  color: #172033;
  font-size: 14px;
  font-weight: 500;
}

.download-meta span {
  color: #66758a;
  font-size: 12px;
}

.progress {
  height: 7px;
  overflow: hidden;
  background: #dfe7f0;
  border-radius: 999px;
}

.progress div {
  height: 100%;
  background: linear-gradient(90deg, #42d7ca 0%, #fcce20 72%);
  border-radius: inherit;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.row-actions button,
.finished-actions button {
  width: 32px;
  height: 32px;
  color: #172033;
  background: white;
  border: 1px solid #d8e0ea;
  border-radius: 50%;
}

.finished-table {
  display: grid;
  align-content: start;
  min-height: 0;
  overflow: auto;
  border: 1px solid #d8e0ea;
  border-radius: 7px;
}

.finished-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) 140px 200px 132px;
  min-width: 760px;
  min-height: 52px;
  align-items: center;
  padding: 0 18px;
  color: #172033;
  background: white;
  border-bottom: 1px solid #d8e0ea;
}

.finished-row.header {
  min-height: 48px;
  color: #33445c;
  font-size: 14px;
  background: #fbfdff;
}

.finished-row:last-child {
  border-bottom: 0;
}

.finished-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finished-actions {
  gap: 8px;
}

.finished-actions button {
  background: #f1f6fb;
  border-color: transparent;
  border-radius: 7px;
}

.finished-actions .clear {
  color: #e3454f;
}

.desktop-player-stage :deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}
</style>

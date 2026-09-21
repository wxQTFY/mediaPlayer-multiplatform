<script setup lang="ts">
import 'element-plus/dist/index.css';

import { ElButton, ElConfigProvider, ElInput, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus';
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
    <section class="pc-player-shell bg-[#171a21] text-slate-50">
      <header class="pc-titlebar flex items-center justify-between border-b border-white/10 bg-[#1b1f28] px-5">
        <div class="flex items-center gap-3 text-xl font-semibold">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-teal-300 text-slate-950">
            <el-icon><CaretRight /></el-icon>
          </span>
          <strong>影音播放器</strong>
        </div>
        <div class="flex items-center gap-1">
          <button class="pc-window-btn" type="button" aria-label="最小化" @click="windowApi.minimize">
            <el-icon><Minus /></el-icon>
          </button>
          <button class="pc-window-btn" type="button" aria-label="最大化" @click="windowApi.maximize">
            <el-icon><FullScreen /></el-icon>
          </button>
          <button class="pc-window-btn hover:bg-red-500" type="button" aria-label="关闭" @click="windowApi.close">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </header>

      <div class="pc-body">
        <aside class="pc-sidebar grid border-r border-white/10 bg-[#11141a]">
          <nav class="grid grid-cols-2 gap-2 border-b border-white/10 p-3">
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

          <section class="grid gap-3 border-b border-white/10 p-3">
            <div class="flex items-center justify-between gap-2">
              <strong class="truncate text-sm font-medium">共 {{ workspace.sidebarVideoCount.value }} 个视频</strong>
              <div class="flex shrink-0 gap-1.5">
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
            <label class="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 text-slate-400">
              <el-icon><Search /></el-icon>
              <input
                v-model="workspace.searchKeyword.value"
                class="min-w-0 flex-1 bg-transparent text-xs text-white outline-none"
                aria-label="搜索列表视频"
                placeholder="搜索列表视频"
              />
            </label>
          </section>

          <section class="min-h-0 overflow-auto p-2">
            <button
              v-for="video in workspace.filteredVideos.value"
              :key="video.id"
              class="grid w-full grid-cols-[84px_minmax(0,1fr)] gap-2.5 rounded-lg border border-transparent p-2 text-left hover:border-teal-300 hover:bg-teal-300/10"
              :class="{ 'border-teal-300 bg-teal-300/10': workspace.selectedVideoId.value === video.id }"
              type="button"
              @click="workspace.playVideo(video)"
            >
              <span class="pc-thumb" :data-time="video.duration"></span>
              <span class="grid min-w-0 gap-1">
                <strong class="truncate text-sm font-medium">{{ video.title }}</strong>
                <span class="truncate text-xs text-slate-400">
                  {{ video.source }} · {{ video.quality }} · {{ video.downloadable ? '可下载' : '继续播放' }}
                </span>
              </span>
            </button>
          </section>
        </aside>

        <main class="pc-main">
          <section v-show="workspace.desktopView.value === 'video'" class="pc-video-stage absolute inset-0 overflow-hidden">
            <div v-if="workspace.hasPlayingVideo.value" class="absolute inset-0 z-10 bg-black">
              <ArtPlayer
                :key="workspace.currentVideo.value!.videoPath || 'desktop-player'"
                :url="workspace.currentVideo.value!.videoPath!"
                @get-duration="(duration) => workspace.playerStore.updateDuration(duration, workspace.currentVideo.value!)"
                @playback-error="workspace.playerStore.fallbackToTranscode(workspace.currentVideo.value!)"
              />
              <el-button
                v-if="workspace.playerDownloadable.value"
                class="absolute right-4 top-4 z-20"
                :icon="Download"
                circle
                :loading="workspace.isDownloading.value"
                @click="handleDownload"
              />
            </div>

            <div v-else class="absolute left-1/2 top-[48%] grid w-[min(620px,calc(100%-64px))] -translate-x-1/2 -translate-y-1/2 place-items-center gap-5 text-center">
              <div class="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-teal-300 via-blue-500 to-slate-900 text-5xl shadow-2xl">
                <el-icon><CaretRight /></el-icon>
              </div>
              <form class="w-full" @submit.prevent="workspace.submitUrl">
                <el-input v-model="workspace.urlInput.value" size="large" aria-label="输入视频地址">
                  <template #prepend>视频地址</template>
                </el-input>
              </form>
              <el-button type="primary" size="large" round :icon="FolderOpened" @click="workspace.openLocalFile">
                打开文件
              </el-button>
            </div>
          </section>

          <section v-show="workspace.desktopView.value === 'downloads'" class="pc-downloads-view absolute inset-0 gap-5 overflow-auto bg-slate-50 p-8 text-slate-900">
            <div class="flex gap-8 text-base font-medium">
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

            <div v-if="workspace.downloadTab.value === 'downloading'" class="flex flex-wrap gap-3">
              <el-button :icon="VideoPause" @click="workspace.pauseAllDownloads">全部暂停</el-button>
              <el-button :icon="CaretRight" @click="workspace.startAllDownloads">全部开始</el-button>
              <el-button type="danger" plain :icon="Delete" @click="workspace.deleteAllDownloads">全部删除</el-button>
            </div>
            <div v-else>
              <el-button type="danger" plain :icon="Delete" @click="workspace.clearFinishedRecords">清空全部记录</el-button>
            </div>

            <div v-if="workspace.downloadTab.value === 'downloading'" class="min-h-0">
              <article
                v-for="task in workspace.downloadTasks.value"
                :key="task.id"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-200 py-4"
              >
                <div class="grid min-w-0 gap-2">
                  <strong class="truncate text-sm font-medium">{{ task.title }}</strong>
                  <span class="truncate text-xs text-slate-500">
                    {{ task.progress }}% · {{ task.speed || '已暂停' }} · 保存到 {{ task.savePath }}{{ task.remainingTime ? ` · 剩余 ${task.remainingTime}` : '' }}
                  </span>
                  <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div class="h-full rounded-full bg-gradient-to-r from-teal-300 to-amber-300" :style="{ width: `${task.progress}%` }"></div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <el-button
                    :icon="task.status === 'paused' ? CaretRight : VideoPause"
                    circle
                    @click="workspace.toggleTaskStatus(task.id)"
                  />
                  <el-button :icon="Delete" circle @click="workspace.deleteTask(task.id)" />
                </div>
              </article>
            </div>

            <el-table v-else :data="workspace.finishedRecords.value" height="100%" row-key="id">
              <el-table-column prop="title" label="名称" min-width="220" show-overflow-tooltip />
              <el-table-column prop="size" label="大小" width="120" />
              <el-table-column prop="completedAt" label="完成时间" width="180" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button :icon="CaretRight" text circle title="播放" aria-label="播放" />
                  <el-button :icon="FolderOpened" text circle title="打开文件位置" aria-label="打开文件位置" />
                  <el-button
                    :icon="Delete"
                    text
                    circle
                    type="danger"
                    title="清除"
                    aria-label="清除"
                    @click="workspace.clearFinishedRecord(row.id)"
                  />
                </template>
              </el-table-column>
            </el-table>
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
}

.pc-titlebar {
  min-height: 0;
  -webkit-app-region: drag;
  user-select: none;
}

.pc-titlebar button {
  -webkit-app-region: no-drag;
}

.pc-body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.pc-sidebar {
  grid-template-rows: 58px auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.pc-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.pc-downloads-view {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  z-index: 4;
}

.pc-window-btn,
.pc-icon-btn {
  display: grid;
  place-items: center;
  color: inherit;
  background: transparent;
  border: 0;
}

.pc-window-btn {
  width: 38px;
  height: 34px;
  border-radius: 6px;
}

.pc-window-btn:hover,
.pc-icon-btn:hover {
  background: rgb(255 255 255 / 10%);
}

.pc-tab {
  height: 34px;
  color: white;
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

.pc-icon-btn {
  width: 36px;
  height: 34px;
  background: #292e39;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 7px;
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

.pc-video-stage {
  background:
    linear-gradient(180deg, rgb(7 10 18 / 18%), rgb(7 10 18 / 64%)),
    radial-gradient(circle at 54% 42%, rgb(66 215 202 / 24%), transparent 18%),
    linear-gradient(130deg, #2233a6 0%, #202997 30%, #14265d 58%, #101933 100%);
}

.pc-video-stage::before {
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

.pc-video-stage::after {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  opacity: 0.56;
  background: repeating-radial-gradient(circle at 78% 16%, transparent 0 13px, rgb(66 215 202 / 20%) 14px, transparent 15px);
}

.pc-download-tab {
  position: relative;
  min-height: 40px;
  color: #172033;
  background: transparent;
  border: 0;
}

.pc-download-tab-active {
  color: #1677ff;
}

.pc-download-tab-active::after {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 20px;
  height: 3px;
  content: "";
  background: #1677ff;
  border-radius: 999px;
  transform: translateX(-50%);
}

:deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}
</style>

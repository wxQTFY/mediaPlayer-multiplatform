<script setup lang="ts">
import 'vant/lib/index.css';

import {
  Button as VanButton,
  Icon as VanIcon,
  Progress as VanProgress,
  Search as VanSearch,
  Tab as VanTab,
  Tabs as VanTabs,
  showToast
} from 'vant';
import { ArtPlayer } from '@/features/player/usePlayerWorkspace';
import { useProvidedPlayerWorkspace } from '@/features/player/workspaceContext';

const workspace = useProvidedPlayerWorkspace();

const handleDownload = async (): Promise<void> => {
  const ok = await workspace.handlePlayerDownload();
  showToast(ok ? '已保存到本地' : '当前资源暂不可下载');
};
</script>

<template>
  <section class="grid h-screen w-screen grid-cols-[320px_minmax(0,1fr)] overflow-hidden bg-[#10141d] text-slate-50">
    <aside class="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] border-r border-white/10 bg-[#151a23]">
      <header class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-2xl bg-teal-300 text-slate-950"><VanIcon name="play" /></span>
          <div>
            <strong class="block text-lg">影音播放器</strong>
            <span class="text-xs text-slate-400">Pad 分栏模式</span>
          </div>
        </div>
        <VanButton size="small" round icon="plus" @click="workspace.openLocalFile" />
      </header>

      <form class="px-4 py-3" @submit.prevent="workspace.submitUrl">
        <VanSearch
          v-model="workspace.urlInput.value"
          shape="round"
          background="transparent"
          placeholder="输入视频地址"
          @search="workspace.submitUrl"
        />
      </form>

      <div class="min-h-0 overflow-auto px-4 pb-4">
        <div class="mb-3 flex items-center justify-between text-sm">
          <strong>视频列表</strong>
          <span class="text-xs text-slate-400">{{ workspace.videos.value.length }} 个文件</span>
        </div>
        <button
          v-for="video in workspace.filteredVideos.value"
          :key="video.id"
          class="mb-3 grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-slate-800 p-2 text-left"
          :class="{ 'border-teal-300 bg-teal-300/10': workspace.selectedVideoId.value === video.id }"
          type="button"
          @click="workspace.playVideo(video)"
        >
          <span class="pad-thumb" :data-time="video.duration"></span>
          <span class="grid min-w-0 gap-1">
            <strong class="truncate text-sm">{{ video.title }}</strong>
            <em class="truncate text-xs not-italic text-slate-400">{{ video.source }} · {{ video.quality }}</em>
          </span>
        </button>
      </div>

      <nav class="grid grid-cols-2 border-t border-white/10">
        <button class="pad-nav-btn" :class="{ active: workspace.desktopView.value === 'video' }" type="button" @click="workspace.desktopView.value = 'video'">
          <VanIcon name="video-o" /><span>播放</span>
        </button>
        <button class="pad-nav-btn" :class="{ active: workspace.desktopView.value === 'downloads' }" type="button" @click="workspace.desktopView.value = 'downloads'">
          <VanIcon name="down" /><span>下载</span>
        </button>
      </nav>
    </aside>

    <main class="relative min-h-0 min-w-0 overflow-hidden">
      <section v-show="workspace.desktopView.value === 'video'" class="absolute inset-0 grid grid-rows-[minmax(0,1fr)_auto] bg-slate-950">
        <div class="relative min-h-0">
          <ArtPlayer
            v-if="workspace.currentVideo.value?.videoPath"
            :key="workspace.currentVideo.value.videoPath || 'pad-player'"
            :url="workspace.currentVideo.value.videoPath"
            @get-duration="(duration) => workspace.playerStore.updateDuration(duration, workspace.currentVideo.value!)"
            @playback-error="workspace.playerStore.fallbackToTranscode(workspace.currentVideo.value!)"
          />
          <div v-else class="grid h-full place-items-center bg-[radial-gradient(circle_at_58%_42%,rgba(45,212,191,.28),transparent_18%),linear-gradient(130deg,#2233a6,#202997_32%,#14265d_58%,#101933)]">
            <div class="grid place-items-center gap-5 text-center">
              <div class="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-teal-300 via-blue-500 to-slate-900 text-5xl shadow-2xl">
                <VanIcon name="play" />
              </div>
              <VanButton type="primary" round icon="folder-o" @click="workspace.openLocalFile">打开视频文件</VanButton>
            </div>
          </div>
          <VanButton
            v-if="workspace.playerDownloadable.value"
            class="absolute right-5 top-5 z-20"
            type="primary"
            round
            icon="down"
            :loading="workspace.isDownloading.value"
            @click="handleDownload"
          >
            下载
          </VanButton>
        </div>
        <footer class="grid gap-2 border-t border-white/10 bg-[#151a23] px-6 py-4">
          <span class="text-xs text-slate-400">{{ workspace.downloadStateText.value }}</span>
          <strong class="truncate text-lg">{{ workspace.getDisplayTitle(workspace.currentVideo.value?.videoName || workspace.selectedVideo.value?.title) }}</strong>
        </footer>
      </section>

      <section v-show="workspace.desktopView.value === 'downloads'" class="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden bg-slate-100 p-6 text-slate-900">
        <VanTabs v-model:active="workspace.downloadTab.value" shrink>
          <VanTab name="downloading" :title="`下载中(${workspace.downloadTasks.value.length})`" />
          <VanTab name="finished" :title="`已完成(${workspace.finishedRecords.value.length})`" />
        </VanTabs>

        <div v-if="workspace.downloadTab.value === 'downloading'" class="overflow-auto rounded-3xl bg-white p-4">
          <div class="mb-4 flex gap-2">
            <VanButton size="small" round icon="pause-circle-o" @click="workspace.pauseAllDownloads">全部暂停</VanButton>
            <VanButton size="small" round icon="play-circle-o" @click="workspace.startAllDownloads">全部开始</VanButton>
            <VanButton size="small" round type="danger" plain icon="delete-o" @click="workspace.deleteAllDownloads">全部删除</VanButton>
          </div>
          <article v-for="task in workspace.downloadTasks.value" :key="task.id" class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-slate-100 py-4">
            <div class="grid min-w-0 gap-2">
              <strong class="truncate text-sm">{{ task.title }}</strong>
              <span class="truncate text-xs text-slate-500">{{ task.progress }}% · {{ task.speed || '已暂停' }} · {{ task.savePath }}</span>
              <VanProgress :percentage="task.progress" stroke-width="7" pivot-text="" color="linear-gradient(90deg,#2dd4bf,#fbbf24)" />
            </div>
            <div class="flex gap-2">
              <VanButton size="small" round icon="pause-circle-o" @click="workspace.toggleTaskStatus(task.id)" />
              <VanButton size="small" round icon="delete-o" @click="workspace.deleteTask(task.id)" />
            </div>
          </article>
        </div>

        <div v-else class="overflow-auto rounded-3xl bg-white p-4">
          <div class="mb-4 flex justify-end">
            <VanButton size="small" type="danger" plain round icon="delete-o" @click="workspace.clearFinishedRecords">清空记录</VanButton>
          </div>
          <article v-for="record in workspace.finishedRecords.value" :key="record.id" class="grid grid-cols-[minmax(0,1fr)_120px_180px_auto] items-center gap-4 border-b border-slate-100 py-4">
            <strong class="truncate text-sm">{{ record.title }}</strong>
            <span class="text-sm text-slate-500">{{ record.size }}</span>
            <span class="text-sm text-slate-500">{{ record.completedAt }}</span>
            <VanButton size="small" round icon="delete-o" @click="workspace.clearFinishedRecord(record.id)" />
          </article>
        </div>
      </section>
    </main>
  </section>
</template>

<style scoped>
.pad-thumb {
  position: relative;
  width: 96px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(66 215 202 / 85%), rgb(41 83 136 / 90%)),
    linear-gradient(135deg, #263341, #111826 68%);
  border-radius: 12px;
}

.pad-thumb::after {
  position: absolute;
  right: 5px;
  bottom: 4px;
  padding: 1px 5px;
  color: white;
  font-size: 10px;
  content: attr(data-time);
  background: rgb(0 0 0 / 62%);
  border-radius: 4px;
}

.pad-nav-btn {
  display: grid;
  height: 62px;
  place-items: center;
  gap: 2px;
  color: #94a3b8;
  font-size: 12px;
  background: transparent;
  border: 0;
}

.pad-nav-btn.active {
  color: #2dd4bf;
}

:deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}
</style>

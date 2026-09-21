<script setup lang="ts">
import 'vant/lib/index.css';

import {
  Button as VanButton,
  Checkbox as VanCheckbox,
  Empty as VanEmpty,
  Icon as VanIcon,
  NavBar as VanNavBar,
  Progress as VanProgress,
  Tab as VanTab,
  Tabs as VanTabs,
  Toast,
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
  <section class="mobile-player-shell bg-[#11141a] text-slate-50">
    <section v-show="workspace.mobilePage.value === 'home'" class="mobile-page">
      <VanNavBar title="首页" class="mobile-nav">
        <template #left>
          <span class="mobile-brand"><VanIcon name="play" /></span>
        </template>
        <template #right>
          <VanButton size="small" round icon="plus" @click="workspace.scanPopoverOpen.value = !workspace.scanPopoverOpen.value" />
        </template>
      </VanNavBar>

      <div v-if="workspace.scanPopoverOpen.value" class="mx-4 mt-3 rounded-2xl border border-white/10 bg-slate-800 p-4 text-sm shadow-xl">
        <strong>扫描视频文件</strong>
        <p class="mt-1 truncate text-xs text-slate-400">{{ workspace.scanState.path }}</p>
        <div class="mt-3 flex gap-2">
          <VanButton size="small" round>选择目录</VanButton>
          <VanButton size="small" type="primary" round>立即扫描</VanButton>
        </div>
      </div>

      <form class="mobile-url-row" @submit.prevent="workspace.submitUrl">
        <input v-model="workspace.urlInput.value" aria-label="输入视频地址" placeholder="输入视频地址" />
        <button type="submit" aria-label="搜索并播放">
          <VanIcon name="search" />
        </button>
      </form>

      <div class="flex items-center justify-between px-4 py-2 text-sm">
        <strong>视频列表</strong>
        <span class="text-xs text-slate-400">
          {{ workspace.homeSelecting.value ? `已选 ${workspace.selectedHomeVideos.value.size} / ${workspace.mobileVideos.value.length}` : `${workspace.mobileVideos.value.length} 个文件` }}
        </span>
      </div>

      <div
        class="mx-4 mb-3 grid gap-2 rounded-2xl border border-white/10 bg-slate-800 p-2"
        :class="workspace.homeSelecting.value ? 'grid-cols-3' : 'grid-cols-1'"
      >
        <VanButton size="small" round icon="delete-o" @click="workspace.startHomeSelection">批量删除</VanButton>
        <VanButton v-if="workspace.homeSelecting.value" size="small" round @click="workspace.selectAllHomeVideos">全选</VanButton>
        <VanButton v-if="workspace.homeSelecting.value" size="small" round @click="workspace.cancelHomeSelection">取消</VanButton>
      </div>

      <div class="grid gap-3 overflow-auto px-4 pb-24">
        <article
          v-for="video in workspace.mobileVideos.value"
          :key="video.id"
          class="grid min-h-20 grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-slate-800 p-2"
          :class="{ 'grid-cols-[24px_96px_minmax(0,1fr)]': workspace.homeSelecting.value }"
          @click="workspace.homeSelecting.value ? workspace.toggleHomeVideo(video.id) : workspace.openMobilePlayer(video)"
        >
          <VanCheckbox
            v-if="workspace.homeSelecting.value"
            :model-value="workspace.selectedHomeVideos.value.has(video.id)"
            @click.stop
            @update:model-value="workspace.toggleHomeVideo(video.id)"
          />
          <span class="mobile-thumb" :data-time="video.duration"></span>
          <span class="grid min-w-0 gap-1">
            <strong class="truncate text-sm">{{ video.title }}</strong>
            <em class="truncate text-xs not-italic text-slate-400">
              {{ video.source }} · {{ video.quality }} · {{ video.downloadable ? '单文件可下载' : '无下载入口' }}
            </em>
          </span>
        </article>
      </div>
    </section>

    <section v-show="workspace.mobilePage.value === 'downloads'" class="mobile-page">
      <VanNavBar title="下载" class="mobile-nav">
        <template #left>
          <span class="mobile-brand"><VanIcon name="down" /></span>
        </template>
      </VanNavBar>

      <VanTabs v-model:active="workspace.downloadTab.value" class="mx-3 mt-3 rounded-2xl bg-slate-800" shrink>
        <VanTab name="downloading" title="下载中" />
        <VanTab name="finished" title="已完成" />
      </VanTabs>

      <div v-if="workspace.downloadTab.value === 'downloading'" class="mx-4 mt-3 grid grid-cols-3 gap-2">
        <VanButton size="small" round icon="pause-circle-o" @click="workspace.pauseAllDownloads">全部暂停</VanButton>
        <VanButton size="small" round icon="play-circle-o" @click="workspace.startAllDownloads">全部开始</VanButton>
        <VanButton size="small" round type="danger" plain icon="delete-o" @click="workspace.deleteAllDownloads">全部删除</VanButton>
      </div>

      <div v-if="workspace.downloadTab.value === 'downloading'" class="grid gap-3 overflow-auto px-4 py-4 pb-24">
        <article v-for="task in workspace.downloadTasks.value" :key="task.id" class="rounded-2xl border border-white/10 bg-slate-800 p-3">
          <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <span class="grid min-w-0 gap-1">
              <strong class="truncate text-sm">{{ task.title }}</strong>
              <em class="truncate text-xs not-italic text-slate-400">
                {{ task.remainingTime ? `剩余 ${task.remainingTime}` : `保存到 ${task.savePath}` }}
              </em>
            </span>
            <div class="flex gap-1">
              <VanButton size="small" round icon="pause-circle-o" @click="workspace.toggleTaskStatus(task.id)" />
              <VanButton size="small" round icon="delete-o" @click="workspace.deleteTask(task.id)" />
            </div>
          </div>
          <div class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs text-slate-400">
            <VanProgress :percentage="task.progress" stroke-width="7" pivot-text="" color="linear-gradient(90deg,#2dd4bf,#fbbf24)" />
            <span>{{ task.progress }}% · {{ task.speed || '已暂停' }}</span>
          </div>
        </article>
      </div>

      <div v-else class="overflow-auto px-4 py-4 pb-24">
        <div class="mb-3 flex justify-between">
          <VanButton size="small" type="danger" plain round icon="delete-o" @click="workspace.clearFinishedRecords">清空记录</VanButton>
          <VanButton size="small" round @click="workspace.toggleFinishedSelectAll">{{ workspace.finishedSelectAllLabel.value }}</VanButton>
        </div>
        <article
          v-for="record in workspace.finishedRecords.value"
          :key="record.id"
          class="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-white/10 bg-slate-800 p-3"
          @click="workspace.toggleFinishedRecord(record.id)"
        >
          <span class="grid min-w-0 gap-1">
            <strong class="truncate text-sm">{{ record.title }}</strong>
            <em class="truncate text-xs not-italic text-slate-400">{{ record.size }} · {{ record.completedAt }}</em>
          </span>
          <VanCheckbox :model-value="workspace.selectedFinishedRecords.value.has(record.id)" @click.stop @update:model-value="workspace.toggleFinishedRecord(record.id)" />
        </article>
        <VanEmpty v-if="workspace.finishedRecords.value.length === 0" description="暂无完成记录" />
      </div>
    </section>

    <section v-show="workspace.mobilePage.value === 'player'" class="absolute inset-0 overflow-hidden bg-[#11141a]">
      <div class="relative h-[46vh] min-h-[310px] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div class="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-black/18 px-3 py-3 backdrop-blur-sm">
          <VanButton size="small" round icon="arrow-left" @click="workspace.backFromPlayer" />
          <div class="grid min-w-0 flex-1 px-3 text-center">
            <em class="truncate text-xs not-italic text-slate-300">{{ workspace.selectedVideo.value?.source || '输入地址' }}</em>
            <strong class="truncate text-sm">{{ workspace.currentVideo.value?.videoName || workspace.selectedVideo.value?.title || workspace.getUrlTitle(workspace.urlInput.value) }}</strong>
          </div>
          <VanButton size="small" round icon="ellipsis" />
        </div>

        <VanButton
          v-if="workspace.playerDownloadable.value"
          class="absolute right-4 top-16 z-20"
          size="small"
          round
          icon="down"
          :loading="workspace.isDownloading.value"
          @click="handleDownload"
        >
          可下载
        </VanButton>

        <ArtPlayer
          v-if="workspace.currentVideo.value?.videoPath"
          :key="workspace.currentVideo.value.videoPath || 'mobile-player'"
          :url="workspace.currentVideo.value.videoPath"
          @get-duration="(duration) => workspace.playerStore.updateDuration(duration, workspace.currentVideo.value!)"
          @playback-error="workspace.playerStore.fallbackToTranscode(workspace.currentVideo.value!)"
        />
        <div v-else class="absolute inset-0 grid place-items-center">
          <div class="grid h-20 w-20 place-items-center rounded-full bg-teal-300 text-3xl text-slate-950">
            <VanIcon name="play" />
          </div>
        </div>

        <div class="absolute bottom-4 left-4 right-4 z-20">
          <div class="mb-1 flex justify-between text-xs text-slate-300"><span>12:48</span><span>29:32</span></div>
          <div class="h-1.5 overflow-hidden rounded-full bg-white/20"><div class="h-full w-[42%] rounded-full bg-teal-300"></div></div>
        </div>
      </div>

      <div class="grid gap-4 px-5 py-4">
        <div class="rounded-2xl bg-slate-800 px-4 py-3 text-xs text-slate-300">{{ workspace.downloadStateText.value }}</div>
        <div>
          <h2 class="line-clamp-2 text-xl font-semibold">{{ workspace.getDisplayTitle(workspace.currentVideo.value?.videoName || workspace.selectedVideo.value?.title) }}</h2>
          <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">移动端采用 Vant 控件承载核心播放流程，播放、下载、列表和状态与 PC 共用同一套业务能力。</p>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <VanButton round icon="like-o">喜欢</VanButton>
          <VanButton round icon="cluster-o">投屏</VanButton>
          <VanButton round icon="expand-o">全屏</VanButton>
        </div>
      </div>
    </section>

    <nav v-if="!workspace.showMobileDeleteBar.value" class="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-2 border-t border-white/10 bg-slate-900/96 pb-[env(safe-area-inset-bottom)]">
      <button class="mobile-bottom-btn" :class="{ 'text-teal-300': workspace.mobilePage.value === 'home' }" type="button" @click="workspace.setMobilePage('home')">
        <VanIcon name="wap-home-o" /><span>首页</span>
      </button>
      <button class="mobile-bottom-btn" :class="{ 'text-teal-300': workspace.mobilePage.value === 'downloads' }" type="button" @click="workspace.setMobilePage('downloads')">
        <VanIcon name="down" /><span>下载</span>
      </button>
    </nav>

    <div v-else class="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-900 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <VanButton block type="danger" round icon="delete-o" @click="workspace.deleteSelectedMobileItems">删除</VanButton>
    </div>
    <Toast />
  </section>
</template>

<style scoped>
.mobile-player-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.mobile-page {
  position: absolute;
  inset: 0 0 calc(env(safe-area-inset-bottom, 0px) + 64px);
  overflow: hidden;
}

.mobile-nav {
  --van-nav-bar-background: rgba(29, 32, 40, 0.94);
  --van-nav-bar-title-text-color: #f8fafc;
  --van-nav-bar-icon-color: #f8fafc;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.mobile-brand {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #061d1b;
  background: #42d7ca;
  border-radius: 12px;
}

.mobile-url-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 8px;
  margin: 12px 16px 12px;
}

.mobile-url-row input {
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  color: white;
  background: #1d222b;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  outline: 0;
}

.mobile-url-row input::placeholder {
  color: #9ba7b5;
}

.mobile-url-row button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  color: #061d1b;
  background: #42d7ca;
  border: 0;
  border-radius: 12px;
}

.mobile-thumb {
  position: relative;
  width: 96px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(66 215 202 / 85%), rgb(41 83 136 / 90%)),
    linear-gradient(135deg, #263341, #111826 68%);
  border-radius: 10px;
}

.mobile-thumb::after {
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

.mobile-bottom-btn {
  display: grid;
  height: 58px;
  place-items: center;
  gap: 2px;
  color: #94a3b8;
  font-size: 12px;
  background: transparent;
  border: 0;
}

:deep(.artplayer-app) {
  width: 100%;
  height: 100%;
}
</style>

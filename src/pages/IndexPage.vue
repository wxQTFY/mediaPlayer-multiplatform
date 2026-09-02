<template>
  <q-page class="desktop-player-page">
    <section class="desktop-player">
      <header class="titlebar">
        <div class="titlebar__brand">
          <span class="titlebar__logo">
            <q-icon name="play_arrow" />
          </span>
          <span>mediaPlayer</span>
        </div>
        <div class="titlebar__search">
          <q-icon name="search" />
          <input
            v-model="searchText"
            type="search"
            placeholder="搜索视频"
          >
        </div>
        <div class="titlebar__actions">
          <q-btn round dense flat icon="remove" aria-label="最小化" @click="windowControls.minimize" />
          <q-btn round dense flat icon="crop_square" aria-label="最大化" @click="windowControls.toggleMaximize" />
          <q-btn round dense flat icon="close" aria-label="关闭" @click="windowControls.close" />
        </div>
      </header>

      <aside class="rail">
        <button class="rail__item rail__item--active" type="button" aria-label="视频">
          <q-icon name="smart_display" />
        </button>
        <button class="rail__item" type="button" aria-label="历史">
          <q-icon name="history" />
        </button>
        <button class="rail__item" type="button" aria-label="收藏">
          <q-icon name="star" />
        </button>
        <button
          class="rail__item"
          :class="{ 'rail__item--active': activeView === 'downloads' }"
          type="button"
          aria-label="下载"
          @click="activeView = activeView === 'downloads' ? 'videos' : 'downloads'"
        >
          <q-icon name="download" />
        </button>
      </aside>

      <aside class="playlist-panel">
        <div class="playlist-panel__head">
          <div>
            <strong>视频列表</strong>
            <span>{{ filteredPlaylist.length }} 个文件</span>
          </div>
          <q-btn round dense flat icon="add" aria-label="添加视频" @click="openLocalFilePicker" />
        </div>

        <div class="playlist-panel__tabs">
          <button
            type="button"
            :class="{ active: activeView === 'videos' }"
            @click="activeView = 'videos'"
          >
            本地视频
          </button>
          <button
            type="button"
            :class="{ active: activeView === 'downloads' }"
            @click="activeView = 'downloads'"
          >
            下载管理
          </button>
        </div>

        <div v-if="activeView === 'videos'" class="playlist">
          <button
            v-for="item in filteredPlaylist"
            :key="item.id"
            class="playlist-card"
            :class="{ 'playlist-card--active': item.id === player.currentId }"
            type="button"
            @click="player.setCurrentMedia(item.id)"
          >
            <span
              class="playlist-card__poster"
              :class="`playlist-card__poster--${item.posterTone ?? 'teal'}`"
            >
              <q-icon name="play_circle" />
              <em>{{ item.durationLabel ?? '00:00' }}</em>
            </span>
            <span class="playlist-card__content">
              <strong>{{ item.title }}</strong>
              <span>{{ item.locationLabel }} / {{ item.qualityLabel }}</span>
            </span>
          </button>
        </div>

        <div v-else class="download-queue">
          <div
            v-for="item in player.downloadingItems"
            :key="item.id"
            class="queue-row"
          >
            <div class="queue-row__top">
              <strong>{{ item.title }}</strong>
              <q-btn round dense flat icon="delete" aria-label="删除下载" @click="player.removeDownload(item.id)" />
            </div>
            <span>{{ item.speedLabel }} / {{ item.targetLabel }}</span>
            <q-linear-progress size="6px" rounded :value="item.progress / 100" />
          </div>
        </div>

        <div class="playlist-panel__foot">
          <q-btn icon="folder_open" label="打开文件" unelevated @click="openLocalFilePicker" />
          <q-btn icon="sort" unelevated aria-label="排序" @click="player.toggleSortByDate" />
        </div>
      </aside>

      <main class="player-main">
        <section v-if="activeView === 'videos'" class="watch-area">
          <PlayerShell :media="player.currentMedia" />

          <div class="command-strip">
            <form class="url-form" @submit.prevent="openNetworkUrl">
              <q-icon name="link" />
              <input
                v-model="urlInput"
                type="url"
                placeholder="输入视频地址"
              >
              <q-btn icon="play_arrow" label="播放" unelevated type="submit" />
            </form>

            <div class="command-strip__buttons">
              <q-btn icon="folder_open" label="打开文件" unelevated @click="openLocalFilePicker" />
              <q-btn
                icon="download"
                label="下载"
                unelevated
                :disable="!player.currentMedia?.downloadable"
                @click="player.addCurrentToDownloads"
              />
            </div>
          </div>
        </section>

        <section v-else class="downloads-page">
          <div class="downloads-page__head">
            <div>
              <strong>下载管理</strong>
              <span>{{ player.downloadingItems.length }} 个下载中 / {{ player.finishedDownloads.length }} 个已完成</span>
            </div>
            <div class="downloads-page__actions">
              <q-btn icon="pause" label="全部暂停" unelevated @click="player.pauseAllDownloads" />
              <q-btn icon="play_arrow" label="全部开始" unelevated @click="player.startAllDownloads" />
              <q-btn icon="delete" label="清空任务" unelevated @click="player.clearActiveDownloads" />
            </div>
          </div>

          <div class="downloads-table">
            <div class="downloads-table__row downloads-table__row--head">
              <span>名称</span>
              <span>状态</span>
              <span>保存位置</span>
              <span>操作</span>
            </div>
            <div
              v-for="item in player.downloads"
              :key="item.id"
              class="downloads-table__row"
            >
              <span>{{ item.title }}</span>
              <span>{{ item.status === 'finished' ? '已完成' : `${item.progress}%` }}</span>
              <span>{{ item.targetLabel }}</span>
              <span class="downloads-table__actions">
                <q-btn round dense flat icon="play_arrow" aria-label="播放" />
                <q-btn round dense flat icon="folder_open" aria-label="打开位置" />
                <q-btn round dense flat icon="delete" aria-label="删除" @click="player.removeDownload(item.id)" />
              </span>
            </div>
          </div>
        </section>
      </main>
    </section>

    <div class="hidden">
      <input
        ref="fileInputRef"
        type="file"
        accept="video/*,.mp4,.m4v,.webm,.ogg"
        @change="handleFileSelected"
      >
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import PlayerShell from '@/components/PlayerShell.vue';
import { usePlayerStore } from '@/stores/player-store';

declare global {
  interface Window {
    electronWindow?: {
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}

const player = usePlayerStore();
const fileInputRef = ref<HTMLInputElement | null>(null);
const activeView = ref<'videos' | 'downloads'>('videos');
const searchText = ref('');
const urlInput = ref('https://media.example.com/city-night.mp4');
const windowControls = {
  minimize: () => void window.electronWindow?.minimize(),
  toggleMaximize: () => void window.electronWindow?.toggleMaximize(),
  close: () => void window.electronWindow?.close()
};

const filteredPlaylist = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return player.playlist;
  return player.playlist.filter((item) => item.title.toLowerCase().includes(keyword));
});

function openLocalFilePicker() {
  fileInputRef.value?.click();
}

function openNetworkUrl() {
  player.loadNetworkUrl(urlInput.value);
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) player.loadLocalFile(file);
  input.value = '';
}

onBeforeUnmount(() => {
  player.releaseLocalObjectUrl();
});
</script>

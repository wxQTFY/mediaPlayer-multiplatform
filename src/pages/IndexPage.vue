<template>
  <q-page class="media-page">
    <div class="media-workspace">
      <aside class="library-panel">
        <div class="library-panel__tabs">
          <q-btn
            :unelevated="activeView === 'videos'"
            :flat="activeView !== 'videos'"
            :color="activeView === 'videos' ? 'primary' : 'white'"
            label="视频"
            @click="activeView = 'videos'"
          />
          <q-btn
            :unelevated="activeView === 'downloads'"
            :flat="activeView !== 'downloads'"
            :color="activeView === 'downloads' ? 'primary' : 'white'"
            label="下载"
            @click="activeView = 'downloads'"
          />
        </div>

        <div class="library-panel__tools">
          <div>
            <strong>共 {{ filteredPlaylist.length }} 个视频</strong>
            <span>{{ platform.label }} · PC / 手机 / Pad</span>
          </div>
          <div class="library-panel__actions">
            <q-btn
              round
              dense
              flat
              icon="add"
              aria-label="添加"
              @click="openLocalFilePicker"
            />
            <q-btn
              round
              dense
              flat
              icon="sort"
              aria-label="排序"
              @click="player.toggleSortByDate"
            />
            <q-btn
              round
              dense
              flat
              icon="delete"
              aria-label="清空"
              @click="player.clearPlaylist"
            />
          </div>
        </div>

        <q-input
          v-model="searchText"
          dense
          borderless
          class="library-search"
          placeholder="搜索列表视频"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="video-list">
          <button
            v-for="item in filteredPlaylist"
            :key="item.id"
            class="video-card"
            :class="{ 'video-card--active': item.id === player.currentId }"
            type="button"
            @click="player.setCurrentMedia(item.id)"
          >
            <span
              class="video-card__thumb"
              :class="`video-card__thumb--${item.posterTone ?? 'teal'}`"
              :data-time="item.durationLabel ?? '00:00'"
            />
            <span class="video-card__meta">
              <strong>{{ item.title }}</strong>
              <span>{{ item.locationLabel }} · {{ item.qualityLabel }} · {{ item.downloadable ? '可下载' : '仅播放' }}</span>
            </span>
          </button>
        </div>
      </aside>

      <main class="main-surface">
        <section
          v-if="activeView === 'videos'"
          class="video-surface"
        >
          <div class="video-surface__hero">
            <PlayerShell :media="player.currentMedia" />
          </div>

          <div class="quick-panel">
            <div class="quick-panel__brand">
              <div class="quick-panel__mark">
                <q-icon name="smart_display" />
              </div>
              <div>
                <strong>影音播放器</strong>
                <span>输入地址或打开本地视频</span>
              </div>
            </div>

            <form
              class="url-form"
              @submit.prevent="openNetworkUrl"
            >
              <q-input
                v-model="urlInput"
                dense
                outlined
                bg-color="white"
                label="视频地址"
              />
              <q-btn
                color="primary"
                icon="play_arrow"
                label="播放"
                unelevated
                type="submit"
              />
              <q-btn
                icon="folder_open"
                label="打开文件"
                unelevated
                @click="openLocalFilePicker"
              />
            </form>
          </div>

          <div class="mobile-home-panel">
            <div class="mobile-scan">
              <div>
                <strong>扫描视频文件</strong>
                <span>/storage/emulated/0/Movies</span>
              </div>
              <div class="mobile-scan__actions">
                <q-btn round dense flat icon="folder_open" aria-label="选择目录" />
                <q-btn round dense flat icon="document_scanner" aria-label="立即扫描" />
              </div>
            </div>

            <div class="mobile-section-head">
              <span>视频列表</span>
              <span>{{ filteredPlaylist.length }} 个文件</span>
            </div>

            <div class="mobile-video-list">
              <button
                v-for="item in filteredPlaylist"
                :key="`mobile-${item.id}`"
                class="mobile-video-card"
                :class="{ 'mobile-video-card--active': item.id === player.currentId }"
                type="button"
                @click="player.setCurrentMedia(item.id)"
              >
                <span
                  class="video-card__thumb"
                  :class="`video-card__thumb--${item.posterTone ?? 'teal'}`"
                  :data-time="item.durationLabel ?? '00:00'"
                />
                <span class="video-card__meta">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.locationLabel }} · {{ item.qualityLabel }} · {{ item.downloadable ? '可下载' : '无下载入口' }}</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section
          v-else
          class="download-view"
        >
          <div class="download-view__tabs">
            <q-btn
              :class="{ active: downloadTab === 'downloading' }"
              flat
              :label="`下载中(${player.downloadingItems.length})`"
              @click="downloadTab = 'downloading'"
            />
            <q-btn
              :class="{ active: downloadTab === 'finished' }"
              flat
              :label="`已完成(${player.finishedDownloads.length})`"
              @click="downloadTab = 'finished'"
            />
          </div>

          <div
            v-if="downloadTab === 'downloading'"
            class="download-actions"
          >
            <q-btn
              icon="pause"
              label="全部暂停"
              unelevated
              @click="player.pauseAllDownloads"
            />
            <q-btn
              icon="play_arrow"
              label="全部开始"
              unelevated
              @click="player.startAllDownloads"
            />
            <q-btn
              icon="delete"
              label="全部删除"
              unelevated
              @click="player.clearActiveDownloads"
            />
          </div>

          <div
            v-else
            class="download-actions"
          >
            <q-btn
              icon="delete"
              label="清空全部记录"
              unelevated
              @click="player.clearFinishedDownloads"
            />
          </div>

          <div
            v-if="downloadTab === 'downloading'"
            class="download-list"
          >
            <div
              v-for="item in player.downloadingItems"
              :key="item.id"
              class="download-row"
            >
              <div class="download-row__meta">
                <strong>{{ item.title }}</strong>
                <span>{{ item.progress }}% · {{ item.speedLabel }} · {{ item.targetLabel }}</span>
                <q-linear-progress
                  rounded
                  size="7px"
                  :value="item.progress / 100"
                />
              </div>
              <q-btn
                round
                dense
                flat
                icon="delete"
                aria-label="删除下载"
                @click="player.removeDownload(item.id)"
              />
            </div>
          </div>

          <div
            v-else
            class="finished-table"
          >
            <div class="finished-table__row finished-table__row--header">
              <span>名称</span>
              <span>大小</span>
              <span>完成时间</span>
              <span>操作</span>
            </div>
            <div
              v-for="item in player.finishedDownloads"
              :key="item.id"
              class="finished-table__row"
            >
              <span>{{ item.title }}</span>
              <span>{{ item.sizeLabel }}</span>
              <span>{{ item.finishedAt }}</span>
              <span class="finished-table__actions">
                <q-btn round dense flat icon="play_arrow" aria-label="播放" />
                <q-btn round dense flat icon="folder_open" aria-label="打开文件位置" />
                <q-btn round dense flat icon="delete" aria-label="清除" @click="player.removeDownload(item.id)" />
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>

    <nav class="mobile-tabs">
      <q-btn
        flat
        icon="home"
        label="首页"
        :class="{ active: activeView === 'videos' }"
        @click="activeView = 'videos'"
      />
      <q-btn
        flat
        icon="download"
        label="下载"
        :class="{ active: activeView === 'downloads' }"
        @click="activeView = 'downloads'"
      />
    </nav>

    <q-page-sticky
      v-if="activeView === 'videos' && player.currentMedia?.downloadable"
      position="bottom-right"
      :offset="[18, 76]"
      class="mobile-download-action"
    >
      <q-btn
        round
        color="primary"
        icon="download"
        aria-label="下载当前视频"
        @click="player.addCurrentToDownloads"
      />
    </q-page-sticky>

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
import { getPlatformAdapter } from '@/adapters/platform';
import { usePlayerStore } from '@/stores/player-store';

const player = usePlayerStore();
const platform = computed(() => getPlatformAdapter(player.platform));
const fileInputRef = ref<HTMLInputElement | null>(null);
const activeView = ref<'videos' | 'downloads'>('videos');
const downloadTab = ref<'downloading' | 'finished'>('downloading');
const searchText = ref('');
const urlInput = ref('https://media.example.com/city-night.mp4');

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

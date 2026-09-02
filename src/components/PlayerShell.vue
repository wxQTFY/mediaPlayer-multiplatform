<template>
  <section class="player-shell">
    <div class="player-shell__stage">
      <video
        v-if="media?.source"
        ref="videoRef"
        :key="media.source"
        class="player-shell__video"
        :src="media.source"
        controls
        playsinline
        @canplay="handleCanPlay"
        @ended="player.setPlaybackStatus('ended')"
        @error="handleVideoError"
        @loadedmetadata="syncProgress"
        @pause="handlePause"
        @play="player.setPlaybackStatus('playing')"
        @timeupdate="syncProgress"
        @waiting="player.setPlaybackStatus('loading')"
      />
      <div
        v-else
        class="player-shell__placeholder"
      >
        <q-icon
          name="smart_display"
          size="54px"
        />
        <div class="text-subtitle1 text-weight-medium">
          {{ media ? '等待可播放地址' : '未选择视频' }}
        </div>
        <div class="text-body2 text-grey-6">
          {{ media ? '原型列表项会保留播放上下文，打开本地文件或输入地址后即可播放' : '请打开本地视频或输入视频地址' }}
        </div>
      </div>
      <div class="player-shell__topbar">
        <q-btn
          round
          flat
          dense
          icon="arrow_back"
          aria-label="返回列表"
        />
        <div class="player-shell__top-title">
          <span>{{ media?.locationLabel ?? '播放区' }}</span>
          <strong>{{ media?.title ?? 'mediaPlayer 多端版' }}</strong>
        </div>
        <q-btn
          round
          flat
          dense
          icon="more_horiz"
          aria-label="更多操作"
        />
      </div>
    </div>

    <div class="player-shell__meta">
      <div>
        <div class="text-h6">
          {{ media?.title ?? '未选择视频' }}
        </div>
        <div class="text-body2 text-grey-7">
          {{ media ? sourceLabel : '等待本地文件' }}
        </div>
      </div>
      <div class="player-shell__badges">
        <q-chip
          square
          :color="statusColor"
          text-color="white"
        >
          {{ statusLabel }}
        </q-chip>
        <q-chip
          v-if="media"
          square
          outline
          color="primary"
        >
          {{ media.downloadable ? '可下载' : '仅播放' }}
        </q-chip>
      </div>
    </div>

    <div class="player-shell__progress">
      <q-linear-progress
        rounded
        size="8px"
        :value="progressValue"
      />
      <div class="player-shell__time">
        <span>{{ formattedCurrentTime }}</span>
        <span>{{ formattedDuration }}</span>
      </div>
    </div>

    <q-banner
      v-if="player.errorMessage"
      dense
      class="player-shell__error"
      rounded
    >
      {{ player.errorMessage }}
    </q-banner>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePlayerStore } from '@/stores/player-store';
import type { MediaItem, PlaybackStatus } from '@/types/media';

defineProps<{
  media: MediaItem | undefined;
}>();

const player = usePlayerStore();
const videoRef = ref<HTMLVideoElement | null>(null);

const statusText: Record<PlaybackStatus, string> = {
  idle: '未选择',
  ready: '已就绪',
  playing: '播放中',
  paused: '已暂停',
  loading: '加载中',
  ended: '已结束',
  error: '播放错误'
};

const statusColors: Record<PlaybackStatus, string> = {
  idle: 'grey-7',
  ready: 'primary',
  playing: 'positive',
  paused: 'warning',
  loading: 'info',
  ended: 'secondary',
  error: 'negative'
};

const statusLabel = computed(() => statusText[player.playbackStatus]);
const statusColor = computed(() => statusColors[player.playbackStatus]);
const progressValue = computed(() => {
  if (!player.duration) return 0;
  return Math.min(player.currentTime / player.duration, 1);
});
const sourceLabel = computed(() => {
  const media = player.currentMedia;
  if (!media) return '等待本地文件';
  return `${media.sourceType === 'local' ? '本地视频' : '网络视频'} · ${media.fileName ?? media.format.toUpperCase()}`;
});
const formattedCurrentTime = computed(() => formatTime(player.currentTime));
const formattedDuration = computed(() => formatTime(player.duration));

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function syncProgress(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  player.setPlaybackProgress(video.currentTime, video.duration);
}

function handleCanPlay(event: Event) {
  syncProgress(event);
  if (player.playbackStatus === 'loading') player.setPlaybackStatus('ready');
}

function handlePause(event: Event) {
  syncProgress(event);
  if (videoRef.value?.ended) return;
  player.setPlaybackStatus('paused');
}

function handleVideoError() {
  player.setPlaybackError('当前文件无法播放，请更换浏览器支持的视频文件。');
}
</script>

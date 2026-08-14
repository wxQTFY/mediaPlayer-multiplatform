<template>
  <section class="player-shell">
    <div class="player-shell__stage">
      <video
        v-if="media?.format === 'mp4'"
        class="player-shell__video"
        :src="media.source"
        controls
        playsinline
      />
      <div
        v-else
        class="player-shell__placeholder"
      >
        <q-icon
          name="movie"
          size="40px"
        />
        <div class="text-subtitle1 text-weight-medium">
          {{ media?.format.toUpperCase() }} 播放入口已预留
        </div>
        <div class="text-body2 text-grey-6">
          后续阶段接入 hls.js、dash.js 或 Android 原生播放器 adapter
        </div>
      </div>
    </div>

    <div class="player-shell__meta">
      <div>
        <div class="text-h6">
          {{ media?.title ?? '未选择视频' }}
        </div>
        <div class="text-body2 text-grey-7">
          {{ media?.source ?? '请选择播放条目' }}
        </div>
      </div>
      <q-chip
        square
        color="primary"
        text-color="white"
      >
        {{ media?.format.toUpperCase() ?? 'N/A' }}
      </q-chip>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MediaItem } from '@/types/media';

defineProps<{
  media: MediaItem | undefined;
}>();
</script>

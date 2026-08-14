<template>
  <q-page class="home-page">
    <div class="home-page__grid">
      <PlayerShell :media="player.currentMedia" />

      <aside class="playlist-panel">
        <div class="panel-header">
          <div>
            <div class="text-subtitle1 text-weight-medium">播放列表</div>
            <div class="text-caption text-grey-7">第一阶段使用示例数据验证多端布局</div>
          </div>
          <q-badge
            outline
            color="primary"
          >
            {{ platform.label }}
          </q-badge>
        </div>

        <q-list
          bordered
          separator
          class="playlist-panel__list"
        >
          <q-item
            v-for="item in player.playlist"
            :key="item.id"
            clickable
            :active="item.id === player.currentId"
            active-class="playlist-panel__item--active"
            @click="player.setCurrentMedia(item.id)"
          >
            <q-item-section avatar>
              <q-icon :name="formatIcon[item.format]" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.title }}</q-item-label>
              <q-item-label caption>
                {{ item.sourceType === 'network' ? '网络视频' : '本地视频' }} · {{ item.durationLabel }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="platform-panel">
          <div class="text-subtitle1 text-weight-medium">平台适配层</div>
          <q-list dense>
            <q-item
              v-for="capability in platform.capabilities"
              :key="capability.key"
            >
              <q-item-section avatar>
                <q-icon
                  :name="statusIcon[capability.status]"
                  :color="statusColor[capability.status]"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ capability.label }}</q-item-label>
                <q-item-label caption>{{ capability.note }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PlayerShell from '@/components/PlayerShell.vue';
import { getPlatformAdapter } from '@/adapters/platform';
import { usePlayerStore } from '@/stores/player-store';
import type { MediaItem, PlatformCapability } from '@/types/media';

const player = usePlayerStore();
const platform = computed(() => getPlatformAdapter(player.platform));

const formatIcon: Record<MediaItem['format'], string> = {
  mp4: 'play_circle',
  hls: 'dynamic_feed',
  dash: 'view_stream',
  unknown: 'movie'
};

const statusIcon: Record<PlatformCapability['status'], string> = {
  ready: 'check_circle',
  adapter: 'extension',
  planned: 'pending',
  limited: 'warning'
};

const statusColor: Record<PlatformCapability['status'], string> = {
  ready: 'positive',
  adapter: 'primary',
  planned: 'orange',
  limited: 'warning'
};
</script>

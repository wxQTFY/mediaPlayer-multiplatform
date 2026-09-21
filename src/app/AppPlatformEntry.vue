<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import PcPlayerApp from '@/platforms/pc/PcPlayerApp.vue';
import MobilePlayerApp from '@/platforms/mobile/MobilePlayerApp.vue';
import PadPlayerApp from '@/platforms/pad/PadPlayerApp.vue';
import { providePlayerWorkspace } from '@/features/player/workspaceContext';
import { usePlayerWorkspace } from '@/features/player/usePlayerWorkspace';

type PlatformKind = 'pc' | 'pad' | 'mobile';

const workspace = usePlayerWorkspace();
providePlayerWorkspace(workspace);

const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);

const platform = computed<PlatformKind>(() => {
  if (viewportWidth.value <= 720) return 'mobile';
  if (viewportWidth.value <= 1180) return 'pad';
  return 'pc';
});

const updateViewport = (): void => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
  window.addEventListener('dragenter', workspace.handleDragEnter);
  window.addEventListener('dragover', workspace.handleDragOver);
  window.addEventListener('dragleave', workspace.handleDragLeave);
  window.addEventListener('drop', workspace.handleDrop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport);
  window.removeEventListener('dragenter', workspace.handleDragEnter);
  window.removeEventListener('dragover', workspace.handleDragOver);
  window.removeEventListener('dragleave', workspace.handleDragLeave);
  window.removeEventListener('drop', workspace.handleDrop);
});
</script>

<template>
  <div class="app-platform-entry bg-slate-950 text-slate-50">
    <PcPlayerApp v-if="platform === 'pc'" />
    <PadPlayerApp v-else-if="platform === 'pad'" />
    <MobilePlayerApp v-else />

    <div
      v-if="workspace.isDraggingFiles.value"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-950/76 backdrop-blur-sm"
    >
      <div class="rounded-2xl border border-teal-300/30 bg-slate-900 px-8 py-5 text-sm font-semibold text-teal-100 shadow-2xl">
        释放以播放视频
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-platform-entry {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>

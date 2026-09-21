<template>
  <q-page class="pc-platform-page">
    <AppPlatformEntry />
  </q-page>
</template>

<script setup lang="ts">
import AppPlatformEntry from '@/app/AppPlatformEntry.vue';
</script>

<style scoped>
.pc-platform-page {
  width: 100%;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}
</style>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          影音播放器
        </q-toolbar-title>

        <q-chip
          dense
          square
          color="white"
          text-color="primary"
        >
          P001 多端版
        </q-chip>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          多端入口
        </q-item-label>

        <q-item
          clickable
          active
          to="/"
        >
          <q-item-section avatar>
            <q-icon name="smart_display" />
          </q-item-section>
          <q-item-section>
            <q-item-label>播放骨架</q-item-label>
            <q-item-label caption>PC / 手机 / Pad 共用页面</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

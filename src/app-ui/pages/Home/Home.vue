 <script setup lang="ts">
   import { ref,provide } from 'vue'
   import Header from '@/app-ui/components/Layout/Header.vue'
  //  import Artplayer from '@/app-ui/components/Artplayer/ArtPlayer.vue'
    // import Aside from '@/app-ui/components/Layout/Aside.vue'
    // import PlayerPage from '@/app-ui/pages/PlayerPage/PlayerPage.vue'
    import bgImg from '@/app-ui/assets/bgimg.png'
    import Aside from '@/app-ui/components/Layout/Aside.vue'
    

  const isCollapse = ref(false)
  const toggleCollapse = (): void => {
    isCollapse.value = !isCollapse.value
    console.log('侧边栏状态已切换，当前状态:', isCollapse.value);
  }
  provide ('sidebarContext', {
    isCollapse, 
    toggleCollapse
  })

 </script>

<template>
  <div class="common-layout w-full h-full" >
    <el-container class="h-full">
      <el-header class="playerHeader bg-black-111"><Header/></el-header>
      <el-container>
        <el-aside :width="isCollapse ? '0' : '260px'" >
          <Aside/>
        </el-aside>
        <el-main :style="{backgroundImage: `url(${bgImg})`, backgroundSize: 'cover'}">
          <slot />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

 <style scoped lang="scss">
  .playerHeader{
      /* 核心代码：允许拖拽窗口 */
    -webkit-app-region: drag; 
    
    /* 解决交互冲突：禁止选中文本 */
    user-select: none;
    /* 允许拖拽整个 header 移动窗口 */
  }
  .el-main{
    padding: 0;
  }
 </style>

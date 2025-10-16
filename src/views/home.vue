<template>
  <div class="home-container">
    <topbar></topbar>
    <div class="input">
      <input type="text" maxlength="200" placeholder="请输入文件名字、关键字">
    </div>
  </div>
</template>

<script setup lang="ts">
import topbar from '@/layout/topbar.vue'
</script>

<style scoped>
.home-container{
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>

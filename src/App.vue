<script setup lang="ts">
// 这里不需要引入具体的业务组件，交由 vue-router 自动处理
</script>

<template>
  <router-view />
</template>

<style>
/* 清除浏览器默认样式，确保全屏 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>

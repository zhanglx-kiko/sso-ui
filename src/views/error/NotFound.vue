<template>
  <div class="not-found">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
  line-height: 1;
}

.error-message {
  font-size: 18px;
  color: #606266;
  margin: 20px 0 30px;
}
</style>

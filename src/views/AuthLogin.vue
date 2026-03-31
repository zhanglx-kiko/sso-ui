<template>
  <div class="login-wrapper">
    <div class="login-box">
      <h1 class="login-title">登 录</h1>
      <p class="login-subtitle">使用您的后台管理平台账号</p>

      <el-form :model="form" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="账号 / 邮箱"
            class="google-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            placeholder="输入密码"
            show-password
            class="google-input"
          />
        </el-form-item>

        <div class="action-bar">
          <el-button link class="forgot-btn" @click="handleForgot">忘记密码？</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="google-btn"
          >
            下一步
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '../api/auth'
import { useUserStore } from '../stores/user'
import { ElMessage, type FormInstance } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  device: 'PC',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = await loginApi(form)
        userStore.setLoginState(data)
        ElMessage.success('登录成功')
        router.push('/users')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleForgot = () => {
  ElMessage.info('正式环境中，此功能需对接重置密码流程')
}
</script>

<style scoped>
/* 全局背景 */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #fff;
  font-family: 'Google Sans', Roboto, Arial, sans-serif;
}

/* 登录卡片 */
.login-box {
  width: 448px;
  /* 调整了顶部 padding，因为去掉了 logo，需要平衡一下视觉中心 */
  padding: 64px 40px 36px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  box-sizing: border-box;
  text-align: center;
}

/* 标题排版 */
.login-title {
  margin: 0;
  font-size: 28px; /* 稍微加大了一点标题字号 */
  font-weight: 400;
  color: #202124;
  line-height: 1.3333;
}
.login-subtitle {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.1px;
  line-height: 1.5;
  margin-bottom: 40px;
  margin-top: 12px;
  color: #202124;
}

/* 深度重写 Element Plus 输入框样式以符合 Google 风格 */
:deep(.google-input .el-input__wrapper) {
  box-shadow: none !important;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 8px 15px;
  transition: border-color 0.2s;
  background-color: transparent;
}

:deep(.google-input .el-input__wrapper.is-focus) {
  border: 2px solid #1a73e8;
  padding: 7px 14px;
}

:deep(.google-input .el-input__inner) {
  height: 38px;
  font-size: 16px;
  color: #202124;
}

/* 表单间距 */
.el-form-item {
  margin-bottom: 24px;
}

/* 底部按钮行 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
}

/* 忘记密码按钮 */
.forgot-btn {
  font-size: 14px;
  font-weight: 500;
  color: #1a73e8;
}
.forgot-btn:hover {
  background-color: #f6fafe;
  color: #174ea6;
}

/* 登录按钮 */
.google-btn {
  background-color: #1a73e8;
  border: none;
  border-radius: 4px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
}
.google-btn:hover {
  background-color: #1b66c9;
  box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}
</style>

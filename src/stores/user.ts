import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginVO } from '@/types/auth'
import { STORAGE_KEYS } from '@/constants'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(STORAGE_KEYS.TOKEN) || '')
  const userInfo = ref<LoginVO | null>(
    JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || 'null'),
  )

  const setLoginState = (data: LoginVO): void => {
    token.value = data.tokenValue
    userInfo.value = data
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.tokenValue)
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(data))
  }

  const logout = (): void => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
  }

  const clearAll = (): void => {
    logout()
    localStorage.clear()
    sessionStorage.clear()
  }

  const hasToken = (): boolean => {
    return !!token.value
  }

  return {
    token,
    userInfo,
    setLoginState,
    logout,
    clearAll,
    hasToken,
  }
})

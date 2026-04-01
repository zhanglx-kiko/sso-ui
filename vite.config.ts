import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 你的网关或Auth服务地址
        changeOrigin: true,
        // 加入下面这段 configure 错误捕获代码
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error(`[Vite Proxy Error]: ${err.message}`)

            // 【重点】类型守卫：判断 res 是否为 HTTP ServerResponse 对象
            if ('writeHead' in res) {
              // 防止 Node.js 进程崩溃，手动结束掉这个出问题的响应
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
              }
              res.end(
                JSON.stringify({ code: 502, msg: '网关代理错误，后端服务可能返回了非标准报文' }),
              )
            } else {
              // 如果走到这里，说明是 WebSocket 代理报错 (Socket 对象)
              // 直接断开 TCP 连接即可
              res.end()
            }
          })
        },
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

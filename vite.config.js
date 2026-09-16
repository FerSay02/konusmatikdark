import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'
import fs from 'node:fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || (mode === 'development' ? 'https://api.konusmatik.com' : '')
  const allowedHosts = (env.VITE_DEV_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
  const devHost = env.VITE_DEV_HOST?.trim() || '0.0.0.0'
  const devPort = Number(env.VITE_DEV_PORT || 5173)
  const devCertPath = env.VITE_DEV_CERT_PATH?.trim()
  const devKeyPath = env.VITE_DEV_KEY_PATH?.trim()
  const devHttps = mode === 'development' && devCertPath && devKeyPath
    ? {
        cert: fs.readFileSync(devCertPath),
        key: fs.readFileSync(devKeyPath),
      }
    : undefined

  return {
    plugins: [react()],
    server: {
      host: devHost,
      port: devPort,
      strictPort: true,
      ...(devHttps ? { https: devHttps } : {}),
      ...(allowedHosts.length ? { allowedHosts } : {}),
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                secure: proxyTarget.startsWith('https://'),
                // The dev browser talks to 192.168.1.113, not api.konusmatik.com.
                // Strip an upstream Domain attribute without changing production.
                cookieDomainRewrite: '',
              },
            },
          }
        : {}),
    },
    preview: {
      host: devHost,
      port: devPort,
    },
  }
})

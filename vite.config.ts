import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// SPA fallback: serve index.html for client routes so refresh on /log-workout etc. doesn't 404
function spaFallback(): Plugin {
  const handler = (req: { url?: string; method?: string }, _res: unknown, next: () => void) => {
    const url = req.url?.split('?')[0] ?? ''
    if (req.method === 'GET' && url !== '/' && !url.includes('.') && !url.startsWith('/@') && !url.startsWith('/node_modules')) {
      req.url = '/'
    }
    next()
  }
  return {
    name: 'spa-fallback',
    configureServer(server) {
      const s = server as { middlewares: { stack: Array<{ route: string; handle: (req: unknown, res: unknown, next: () => void) => void }> } }
      s.middlewares.stack.unshift({ route: '', handle: handler as (req: unknown, res: unknown, next: () => void) => void })
    },
    configurePreviewServer(server) {
      const s = server as { middlewares: { stack: Array<{ route: string; handle: (req: unknown, res: unknown, next: () => void) => void }> } }
      s.middlewares.stack.unshift({ route: '', handle: handler as (req: unknown, res: unknown, next: () => void) => void })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
})

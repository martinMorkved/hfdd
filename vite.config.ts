import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SPA fallback: serve index.html for client routes so refresh on /log-workout etc. doesn't 404
function spaFallback() {
  const handler = (req: any, res: any, next: () => void) => {
    const url = req.url?.split('?')[0] ?? ''
    if (req.method === 'GET' && url !== '/' && !url.includes('.') && !url.startsWith('/@') && !url.startsWith('/node_modules')) {
      req.url = '/'
    }
    next()
  }
  return {
    name: 'spa-fallback',
    configureServer(server) {
      // Prepend so we rewrite before static handler (avoids 404)
      server.middlewares.stack.unshift({ route: '', handle: handler })
    },
    configurePreviewServer(server) {
      server.middlewares.stack.unshift({ route: '', handle: handler })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
})

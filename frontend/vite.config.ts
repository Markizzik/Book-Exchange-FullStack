// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // @ts-ignore - используем расширенные опции http-proxy
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: { '*': '' },
        cookiePathRewrite: { '*': '/' },
        // @ts-ignore
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          const cookies = proxyRes.headers['set-cookie'];
          if (cookies) {
            // Убираем Domain и Secure для localhost
            const rewritten = cookies.map((c: string) => 
              c.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/, '')
            );
            res.setHeader('set-cookie', rewritten);
          }
        },
      },
      '/ws': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        secure: false,
        cookieDomainRewrite: { '*': '' },
      }
    }
  }
})
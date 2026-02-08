import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Vite plugin: touch global.css when new source files appear so Tailwind rescans their classes.
// Piggybacks on Vite's existing file watcher - zero extra overhead.
function tailwindRefreshPlugin() {
  return {
    name: 'tailwind-refresh',
    configureServer(server) {
      const exts = ['.astro', '.tsx', '.jsx', '.html', '.mdx', '.md'];
      let timer;
      server.watcher.on('add', (p) => {
        if (exts.some(e => p.endsWith(e))) {
          clearTimeout(timer);
          timer = setTimeout(async () => {
            try {
              const { utimes } = await import('node:fs/promises');
              const now = new Date();
              await utimes('src/styles/global.css', now, now);
            } catch {}
          }, 200);
        }
      });
    },
  };
}

// https://astro.build/config
// Note: Set your 'site' URL in SEO Settings to enable sitemap generation
export default defineConfig({
  integrations: [mdx(), sitemap(), react()],
  image: {
    // Use Sharp for image optimization (converts to WebP/AVIF, resizes)
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    plugins: [tailwindcss(), tailwindRefreshPlugin()],
    server: {
      headers: {
        // Allow iframe embedding in development only (for IDE preview)
        // Note: vite.server.headers only applies to dev server, not production builds
        'Content-Security-Policy': "frame-ancestors *",
      },
      // HMR configuration for GitHub Codespaces
      hmr: {
        // Use the same port as the dev server - Codespaces handles forwarding
        clientPort: 443,
        // Force WebSocket protocol (wss in Codespaces)
        protocol: 'wss',
      },
      // File watching configuration
      watch: {
        // Use native file watchers (faster than polling)
        // If you experience issues in containers, set usePolling: true
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.output/**'],
      },
    },
  },
});

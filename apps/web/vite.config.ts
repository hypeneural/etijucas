import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Proxy API requests to backend to bypass CORS during development
    proxy: {
      '/api': {
        target: 'https://api.natalemtijucas.com.br',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png", "offline.html", "fonts/*.ttf"],
      manifest: false, // Using our own manifest.json in public
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/], // Don't redirect API calls to index.html
        // Import workbox modules for background sync
        importScripts: [],
        // Define additional routes for background sync
        additionalManifestEntries: [],
        runtimeCaching: [
          {
            // Background Sync for ALL mutations (POST/PUT/DELETE/PATCH)
            urlPattern: ({ request, url }) => {
              const isApiRequest = url.pathname.startsWith('/api') || url.hostname.includes('api');
              const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
              return isApiRequest && isMutation;
            },
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: 'etijucas-sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 hours in minutes
                },
              },
            },
          },
          {
            // Cache Local Fonts
            urlPattern: /^\/fonts\/.*\.(ttf|woff2)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "local-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // API calls - Network first with cache fallback
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/api') || url.hostname.includes('api');
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images - Cache with network fallback
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance to prevent "Invalid hook call" (Error #310)
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  build: {
    // Output to Laravel's public directory for single-domain deployment
    outDir: "../api/public/app",
    emptyDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          "vendor-react": ["react", "react-dom"],
          // UI framework
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
          ],
          // Animation
          "vendor-motion": ["framer-motion"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Charts (lazy loaded)
          "vendor-charts": ["recharts"],
          // Utilities
          "vendor-utils": [
            "zustand",
            "date-fns",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
        },
      },
    },
    // Target modern browsers for smaller bundle size
    target: "esnext",
    // Generate sourcemaps for production debugging
    sourcemap: false,
    // Minify with esbuild for speed
    minify: "esbuild",
  },
}));

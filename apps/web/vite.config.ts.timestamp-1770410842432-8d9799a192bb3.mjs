// vite.config.ts
import { defineConfig } from "file:///C:/laragon/www/etijucas/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.8_lightningcss@1.30.2_terser@5.46.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/laragon/www/etijucas/node_modules/.pnpm/@vitejs+plugin-react-swc@3.11.0_vite@5.4.21_@types+node@22.19.8_lightningcss@1.30.2_terser@5.46.0_/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/laragon/www/etijucas/node_modules/.pnpm/lovable-tagger@1.1.13_vite@5.4.21_@types+node@22.19.8_lightningcss@1.30.2_terser@5.46.0__yaml@2.8.2/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/laragon/www/etijucas/node_modules/.pnpm/vite-plugin-pwa@1.2.0_vite@5.4.21_@types+node@22.19.8_lightningcss@1.30.2_terser@5.46.0__work_u4bqidcayrdhnsbwovi3niclga/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\laragon\\www\\etijucas\\apps\\web";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    // Proxy API requests to backend to bypass CORS during development
    proxy: {
      "/api": {
        target: "https://api.natalemtijucas.com.br",
        changeOrigin: true,
        secure: true,
        rewrite: (path2) => path2.replace(/^\/api/, "/api/v1")
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png", "offline.html", "fonts/*.ttf"],
      manifest: false,
      // Using our own manifest.json in public
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        // Don't redirect API calls to index.html
        // Import workbox modules for background sync
        importScripts: [],
        // Define additional routes for background sync
        additionalManifestEntries: [],
        runtimeCaching: [
          {
            // Background Sync for ALL mutations (POST/PUT/DELETE/PATCH)
            urlPattern: ({ request, url }) => {
              const isApiRequest = url.pathname.startsWith("/api") || url.hostname.includes("api");
              const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
              return isApiRequest && isMutation;
            },
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "etijucas-sync-queue",
                options: {
                  maxRetentionTime: 24 * 60
                  // 24 hours in minutes
                }
              }
            }
          },
          {
            // Cache Local Fonts
            urlPattern: /^\/fonts\/.*\.(ttf|woff2)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "local-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // API calls - Network first with cache fallback
            urlPattern: ({ url }) => {
              return url.pathname.startsWith("/api") || url.hostname.includes("api");
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 24 hours
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Images - Cache with network fallback
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
        // Enable PWA in dev mode for testing
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      // Force single React instance to prevent "Invalid hook call" (Error #310)
      react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
    }
  },
  build: {
    // Output to Laravel's public directory for single-domain deployment
    outDir: "../api/public/app",
    emptyDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // MONOLITHIC VENDOR CHUNK
          // We are merging all framework dependencies into a single chunk to GUARANTEE
          // a singleton React instance. Previous granular splitting caused "Invalid Hook Call" (#310).
          "vendor-app": [
            "react",
            "react-dom",
            "react-router-dom",
            "framer-motion",
            "@tanstack/react-query",
            "zustand",
            "lucide-react",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "date-fns",
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
            "@radix-ui/react-toggle"
          ],
          // Keep heavy, rarely used libs separate
          "vendor-maps": ["leaflet", "react-leaflet"],
          "vendor-charts": ["recharts"],
          "vendor-html2img": ["html-to-image", "html2canvas"]
        }
      }
    },
    // Target modern browsers for smaller bundle size
    target: "esnext",
    // Generate sourcemaps for production debugging
    sourcemap: false,
    // Minify with esbuild for speed
    minify: "esbuild"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxldGlqdWNhc1xcXFxhcHBzXFxcXHdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcbGFyYWdvblxcXFx3d3dcXFxcZXRpanVjYXNcXFxcYXBwc1xcXFx3ZWJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2xhcmFnb24vd3d3L2V0aWp1Y2FzL2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICAvLyBQcm94eSBBUEkgcmVxdWVzdHMgdG8gYmFja2VuZCB0byBieXBhc3MgQ09SUyBkdXJpbmcgZGV2ZWxvcG1lbnRcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYXBpLm5hdGFsZW10aWp1Y2FzLmNvbS5icicsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJy9hcGkvdjEnKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcImZhdmljb24uaWNvXCIsIFwiaWNvbi0xOTIucG5nXCIsIFwiaWNvbi01MTIucG5nXCIsIFwib2ZmbGluZS5odG1sXCIsIFwiZm9udHMvKi50dGZcIl0sXHJcbiAgICAgIG1hbmlmZXN0OiBmYWxzZSwgLy8gVXNpbmcgb3VyIG93biBtYW5pZmVzdC5qc29uIGluIHB1YmxpY1xyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMix0dGZ9XCJdLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6IFwiaW5kZXguaHRtbFwiLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpL10sIC8vIERvbid0IHJlZGlyZWN0IEFQSSBjYWxscyB0byBpbmRleC5odG1sXHJcbiAgICAgICAgLy8gSW1wb3J0IHdvcmtib3ggbW9kdWxlcyBmb3IgYmFja2dyb3VuZCBzeW5jXHJcbiAgICAgICAgaW1wb3J0U2NyaXB0czogW10sXHJcbiAgICAgICAgLy8gRGVmaW5lIGFkZGl0aW9uYWwgcm91dGVzIGZvciBiYWNrZ3JvdW5kIHN5bmNcclxuICAgICAgICBhZGRpdGlvbmFsTWFuaWZlc3RFbnRyaWVzOiBbXSxcclxuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBCYWNrZ3JvdW5kIFN5bmMgZm9yIEFMTCBtdXRhdGlvbnMgKFBPU1QvUFVUL0RFTEVURS9QQVRDSClcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgcmVxdWVzdCwgdXJsIH0pID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBpc0FwaVJlcXVlc3QgPSB1cmwucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2FwaScpIHx8IHVybC5ob3N0bmFtZS5pbmNsdWRlcygnYXBpJyk7XHJcbiAgICAgICAgICAgICAgY29uc3QgaXNNdXRhdGlvbiA9IFsnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ1BBVENIJ10uaW5jbHVkZXMocmVxdWVzdC5tZXRob2QpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBpc0FwaVJlcXVlc3QgJiYgaXNNdXRhdGlvbjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZFN5bmM6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdldGlqdWNhcy1zeW5jLXF1ZXVlJyxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgbWF4UmV0ZW50aW9uVGltZTogMjQgKiA2MCwgLy8gMjQgaG91cnMgaW4gbWludXRlc1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgTG9jYWwgRm9udHNcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL15cXC9mb250c1xcLy4qXFwuKHR0Znx3b2ZmMikkL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImxvY2FsLWZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsIC8vIDEgeWVhclxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gQVBJIGNhbGxzIC0gTmV0d29yayBmaXJzdCB3aXRoIGNhY2hlIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpJykgfHwgdXJsLmhvc3RuYW1lLmluY2x1ZGVzKCdhcGknKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrRmlyc3RcIixcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJhcGktY2FjaGVcIixcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCwgLy8gMjQgaG91cnNcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogNSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBJbWFnZXMgLSBDYWNoZSB3aXRoIG5ldHdvcmsgZmFsbGJhY2tcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OnBuZ3xqcGd8anBlZ3xzdmd8Z2lmfHdlYnApJC9pLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCwgLy8gMzAgZGF5c1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSwgLy8gRW5hYmxlIFBXQSBpbiBkZXYgbW9kZSBmb3IgdGVzdGluZ1xyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIC8vIEZvcmNlIHNpbmdsZSBSZWFjdCBpbnN0YW5jZSB0byBwcmV2ZW50IFwiSW52YWxpZCBob29rIGNhbGxcIiAoRXJyb3IgIzMxMClcclxuICAgICAgcmVhY3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3RcIiksXHJcbiAgICAgIFwicmVhY3QtZG9tXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3QtZG9tXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBPdXRwdXQgdG8gTGFyYXZlbCdzIHB1YmxpYyBkaXJlY3RvcnkgZm9yIHNpbmdsZS1kb21haW4gZGVwbG95bWVudFxyXG4gICAgb3V0RGlyOiBcIi4uL2FwaS9wdWJsaWMvYXBwXCIsXHJcbiAgICBlbXB0eURpcjogdHJ1ZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBNT05PTElUSElDIFZFTkRPUiBDSFVOS1xyXG4gICAgICAgICAgLy8gV2UgYXJlIG1lcmdpbmcgYWxsIGZyYW1ld29yayBkZXBlbmRlbmNpZXMgaW50byBhIHNpbmdsZSBjaHVuayB0byBHVUFSQU5URUVcclxuICAgICAgICAgIC8vIGEgc2luZ2xldG9uIFJlYWN0IGluc3RhbmNlLiBQcmV2aW91cyBncmFudWxhciBzcGxpdHRpbmcgY2F1c2VkIFwiSW52YWxpZCBIb29rIENhbGxcIiAoIzMxMCkuXHJcbiAgICAgICAgICBcInZlbmRvci1hcHBcIjogW1xyXG4gICAgICAgICAgICBcInJlYWN0XCIsXHJcbiAgICAgICAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxyXG4gICAgICAgICAgICBcImZyYW1lci1tb3Rpb25cIixcclxuICAgICAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcclxuICAgICAgICAgICAgXCJ6dXN0YW5kXCIsXHJcbiAgICAgICAgICAgIFwibHVjaWRlLXJlYWN0XCIsXHJcbiAgICAgICAgICAgIFwiY2xzeFwiLFxyXG4gICAgICAgICAgICBcInRhaWx3aW5kLW1lcmdlXCIsXHJcbiAgICAgICAgICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCIsXHJcbiAgICAgICAgICAgIFwiZGF0ZS1mbnNcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFjY29yZGlvblwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hdmF0YXJcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3hcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtbGFiZWxcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtcHJvZ3Jlc3NcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWFcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNsaWRlclwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zd2l0Y2hcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9hc3RcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlXCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgLy8gS2VlcCBoZWF2eSwgcmFyZWx5IHVzZWQgbGlicyBzZXBhcmF0ZVxyXG4gICAgICAgICAgXCJ2ZW5kb3ItbWFwc1wiOiBbXCJsZWFmbGV0XCIsIFwicmVhY3QtbGVhZmxldFwiXSxcclxuICAgICAgICAgIFwidmVuZG9yLWNoYXJ0c1wiOiBbXCJyZWNoYXJ0c1wiXSxcclxuICAgICAgICAgIFwidmVuZG9yLWh0bWwyaW1nXCI6IFtcImh0bWwtdG8taW1hZ2VcIiwgXCJodG1sMmNhbnZhc1wiXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIFRhcmdldCBtb2Rlcm4gYnJvd3NlcnMgZm9yIHNtYWxsZXIgYnVuZGxlIHNpemVcclxuICAgIHRhcmdldDogXCJlc25leHRcIixcclxuICAgIC8vIEdlbmVyYXRlIHNvdXJjZW1hcHMgZm9yIHByb2R1Y3Rpb24gZGVidWdnaW5nXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgLy8gTWluaWZ5IHdpdGggZXNidWlsZCBmb3Igc3BlZWRcclxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThSLFNBQVMsb0JBQW9CO0FBQzNULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gs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

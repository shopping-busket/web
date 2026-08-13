import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import topLevelAwait from 'vite-plugin-top-level-await';
import vuetify from 'vite-plugin-vuetify';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    vueDevTools(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  optimizeDeps: {
    // Include route components in the initial AST scan
    entries: [
      './index.html',
      './src/main.ts',
      './src/views/**/*.vue', // or ./src/pages/**/*.vue
      './src/router/index.ts',
    ],
  },
  build: {
    target: 'es2022', // Standard target for modern Rolldown/Esbuild bundle outputs in Vite 8
  },
});

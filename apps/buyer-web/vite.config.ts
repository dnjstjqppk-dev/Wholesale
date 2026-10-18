import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@packages/design-tokens': path.resolve(__dirname, '../../packages/design-tokens'),
    },
  },
  server: {
    port: 3001,
  },
});


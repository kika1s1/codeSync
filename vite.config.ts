import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'public/background.js'),
        'leetcode-detector': resolve(__dirname, 'public/leetcode-detector.js'),
        'codeforces-detector': resolve(__dirname, 'public/codeforces-detector.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background' || 
              chunkInfo.name === 'leetcode-detector' || 
              chunkInfo.name === 'codeforces-detector') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
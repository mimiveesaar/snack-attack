import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/server'),
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@client': path.resolve(__dirname, 'src/client'),
      '@server': path.resolve(__dirname, 'src/server'),
    },
  },
  build: {
    ssr: path.resolve(__dirname, 'src/server/index.ts'),
    outDir: path.resolve(__dirname, 'dist/server'),
    emptyOutDir: true,
    target: 'node20',
    rollupOptions: {
      output: {
        format: 'esm',
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: 'asset-[name][extname]',
      },
    },
  },
});

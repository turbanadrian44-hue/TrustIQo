
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.', // Ensure root is current directory as per structure
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
  }
});

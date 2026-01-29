
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que a variável seja uma string mesmo se estiver vazia
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-gemini';
            }
            if (id.includes('react')) {
              return 'vendor-react-core';
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
});

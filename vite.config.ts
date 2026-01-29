
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Mapeamos apenas a chave necessária. 
    // Isso evita expor variáveis sensíveis do sistema (como PATH) no navegador.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    // Aumenta o limite de aviso para 2000kb para evitar alertas com bibliotecas grandes como Recharts e Gemini
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Divide as bibliotecas em pedaços menores para melhor cache e performance
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

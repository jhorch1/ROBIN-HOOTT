import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js', // Archivo opcional si necesitas setup
    exclude: ['node_modules', 'dist', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/pages/LandingPage.tsx', 'src/pages/LoginPage.tsx', 'src/pages/Dashboard.tsx'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 70,
        statements: 85
      }
    },
  },
});

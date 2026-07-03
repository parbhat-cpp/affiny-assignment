import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path';
import fs from 'fs';

// manually parse .env.test before anything else
const envTest = Object.fromEntries(
  fs.readFileSync('.env.test', 'utf-8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
);

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    env: envTest,
    globalSetup: './tests/setup/global.ts',
    setupFiles: ['./tests/setup/each.ts'],
    pool: 'forks'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})

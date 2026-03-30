import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'tests/ks/**/*.test.ts',
      'tests/taxonomy/**/*.test.ts',
      'tests/retrieval/**/*.test.ts',
      'tests/rendering/**/*.test.ts',
      'tests/evals/**/*.test.ts',
    ],
  },
})

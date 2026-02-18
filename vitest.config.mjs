import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'build/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/__tests__/**',
        'scripts/',
        '*.config.ts',
        '*.config.js',
        '*.config.mjs',
        'vitest.config.ts',
        'vitest.config.mjs',
        'eslint.config.js',
        'eslint.config.mjs',
      ],
    },
  },
});

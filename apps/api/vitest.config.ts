import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@rolesta/db': fileURLToPath(new URL('../../packages/db/src/index.ts', import.meta.url)),
      '@rolesta/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    globals: false,
    setupFiles: ['./test/setup-vitest.ts'],
  },
});

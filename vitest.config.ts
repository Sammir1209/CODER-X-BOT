import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom to provide a browser‑like environment (document, window, etc.)
    environment: 'happy-dom',
    globals: true,
    // Run only the unit tests; exclude the Playwright e2e specs
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Optional timeout for async operations
    timeout: 10000,
  },
});

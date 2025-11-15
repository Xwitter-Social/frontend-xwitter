import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    env: {
      backendUrl:
        process.env.CYPRESS_BACKEND_URL ||
        process.env.BACKEND_API_URL ||
        'http://localhost:3001',
    },
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});

// Isolated Vite instance for mocked browser tests; never used by production.
process.env.VITE_GOOGLE_AUTH_ENABLED = 'true';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.VITE_GOOGLE_AUTH_ENDPOINT = '/api/v1/test-google-auth';
process.env.VITE_GOOGLE_ONBOARDING_ENDPOINT = '/api/v1/test-google-onboarding';
process.env.VITE_TERMS_VERSION = 'test-terms-v1';
process.env.VITE_EMAIL_CONSENT_ENABLED = 'true';

const { createServer } = await import('vite');
const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true } });
await server.listen();
server.printUrls();

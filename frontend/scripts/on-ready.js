const logger = require('../src/utils/config-logger.js');

const url = 'http://localhost:3000';

logger.info(`Dev server is ready at ${url}`);

(async () => {
  try {
    const { default: open } = await import('open');
    await open(url);
  } catch (err) {
    console.warn('[frontend] Could not open browser:', err?.message || err);
  }
})();

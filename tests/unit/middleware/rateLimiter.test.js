/**
 * Rate Limiter — Unit Tests (1 test)
 */
const { apiLimiter } = require('../../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  test('apiLimiter should be defined and have standard properties', () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe('function');
  });
});

/**
 * Health Check — Integration Test (1 test)
 */
const request = require('supertest');
const app = require('../../server');

describe('Health API', () => {
  test('GET /api/health should return status OK and uptime', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('OK');
    expect(response.body.data.uptime).toBeDefined();
  });
});

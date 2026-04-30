/**
 * Error Utilities — Unit Tests (2 tests)
 */
const { ValidationError, errorHandler } = require('../../../src/utils/errors');

describe('Error Utilities', () => {
  test('ValidationError should have status 400 and code VALIDATION_ERROR', () => {
    const err = new ValidationError('Bad request', [{ field: 'q', msg: 'Missing' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toHaveLength(1);
  });

  test('errorHandler should send JSON response with status code', () => {
    const err = new Error('Generic error');
    err.statusCode = 502;
    err.code = 'BAD_GATEWAY';
    
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'BAD_GATEWAY',
        message: 'Generic error'
      })
    }));
  });
});

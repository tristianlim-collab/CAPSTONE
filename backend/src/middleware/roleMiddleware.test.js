import requireRole, { requireAdmin, requireResponseUnit, requireReporter } from './roleMiddleware.js';

describe('White-Box Unit Testing - Role-Based Access Control (RBAC) Middleware', () => {

  const createMockResponse = () => {
    const res = {};
    res.statusCode = null;
    res.jsonBody = null;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.jsonBody = data;
      return this;
    };
    return res;
  };

  test('should return 401 error if req.user is undefined', () => {
    const middleware = requireRole('ADMIN');
    const req = {};
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('Unauthorized');
    expect(nextCalled).toBe(false);
  });

  test('should return 403 error if user role does not match required role', () => {
    const middleware = requireAdmin;
    const req = { user: { role: 'REPORTER' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('Forbidden');
    expect(nextCalled).toBe(false);
  });

  test('should call next() if user possesses ADMIN role', () => {
    const req = { user: { role: 'ADMIN' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAdmin(req, res, next);

    expect(nextCalled).toBe(true);
  });

  test('should call next() if user possesses RESPONSE_UNIT role', () => {
    const req = { user: { role: 'RESPONSE_UNIT' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireResponseUnit(req, res, next);

    expect(nextCalled).toBe(true);
  });

  test('should call next() if user possesses REPORTER role', () => {
    const req = { user: { role: 'REPORTER' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireReporter(req, res, next);

    expect(nextCalled).toBe(true);
  });

});

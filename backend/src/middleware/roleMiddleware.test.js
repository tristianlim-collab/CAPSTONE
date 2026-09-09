import requireRole, { requireAdmin, requireResponseUnit, requireReporter } from './roleMiddleware.js';

describe('White-Box Unit Testing - Module 2: Role-Based Access Control (RBAC) Middleware Guards', () => {

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

  test('TC-W006: undefined_user_guard - should return 401 error if req.user is undefined', async () => {
    await new Promise(r => setTimeout(r, 600));
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

  test('TC-W007: role_mismatch_guard - should return 403 error if user role does not match required role', async () => {
    await new Promise(r => setTimeout(r, 600));
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

  test('TC-W008: admin_access_pass - should call next() if user possesses ADMIN role', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { user: { role: 'ADMIN' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAdmin(req, res, next);

    expect(nextCalled).toBe(true);
  });

  test('TC-W009: responder_access_pass - should call next() if user possesses RESPONSE_UNIT role', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { user: { role: 'RESPONSE_UNIT' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireResponseUnit(req, res, next);

    expect(nextCalled).toBe(true);
  });

  test('TC-W010: reporter_access_pass - should call next() if user possesses REPORTER role', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { user: { role: 'REPORTER' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireReporter(req, res, next);

    expect(nextCalled).toBe(true);
  });

});

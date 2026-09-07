import verifyToken from './authMiddleware.js';
import jwt from 'jsonwebtoken';

describe('White-Box Unit Testing - Authentication Middleware', () => {
  const JWT_SECRET = 'test_secret_key_999';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

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

  test('should return 401 error if Authorization header is missing', () => {
    const req = { headers: {} };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('Missing or invalid authorization header');
    expect(nextCalled).toBe(false);
  });

  test('should return 401 error if Bearer prefix is missing from header', () => {
    const req = { headers: { authorization: 'Basic token123' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  test('should return 401 error if token verification fails or is expired', () => {
    const req = { headers: { authorization: 'Bearer invalid_tampered_jwt_token' } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('Invalid or expired token');
    expect(nextCalled).toBe(false);
  });

  test('should call next() and attach decoded payload to req.user for valid token', () => {
    const userPayload = { user_id: 'usr-888', role: 'admin' };
    const validToken = jwt.sign(userPayload, JWT_SECRET);

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.user_id).toBe('usr-888');
    expect(req.user.role).toBe('admin');
    expect(nextCalled).toBe(true);
  });

});

import verifyToken from './authMiddleware.js';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

describe('White-Box Unit Testing - Module 1: Authentication Middleware & Session Authorization', () => {
  const JWT_SECRET = 'test_secret_key_999';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  const createMockResponse = () => {
    const res = {};
    res.statusCode = null;
    res.jsonBody = null;
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
    res.json = function (data) {
      this.jsonBody = data;
      return this;
    };
    return res;
  };

  test('TC-W001: verify_header - should return 401 error if Authorization header is missing', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { headers: {} };
    const res = createMockResponse();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('Missing or invalid authorization header');
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-W002: citizen_token - should generate valid JWT signature for citizen payload', async () => {
    await new Promise(r => setTimeout(r, 600));
    const userPayload = { user_id: 'usr-101', email: 'citizen@gaoirs.gov.ph', role: 'citizen', barangay_id: 'brgy-05' };
    const token = generateToken(userPayload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  test('TC-W003: responder_token - should encode unit_id into responder JWT token', async () => {
    await new Promise(r => setTimeout(r, 600));
    const responderPayload = { user_id: 'usr-202', email: 'bfp@gaoirs.gov.ph', role: 'responder', unit_id: 'unit-01' };
    const token = generateToken(responderPayload);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.unit_id).toBe('unit-01');
    expect(decoded.role).toBe('responder');
  });

  test('TC-W004: admin_token - should set optional unit/barangay fields to null safely', async () => {
    await new Promise(r => setTimeout(r, 600));
    const adminPayload = { user_id: 'usr-303', email: 'admin@gaoirs.gov.ph', role: 'admin' };
    const token = generateToken(adminPayload);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.unit_id).toBeNull();
    expect(decoded.barangay_id).toBeNull();
  });

  test('TC-W005: login_verification - should attach decoded payload to req.user for valid token', async () => {
    await new Promise(r => setTimeout(r, 650));
    const userPayload = { id: 'usr-101', role: 'REPORTER', barangay_id: 'brgy-05' };
    const token = jwt.sign(userPayload, JWT_SECRET);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('usr-101');
    expect(req.user.role).toBe('REPORTER');
  });
});

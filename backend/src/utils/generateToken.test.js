import generateToken from './generateToken.js';
import jwt from 'jsonwebtoken';

describe('White-Box Unit Testing - JWT Token Generation Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test_jwt_super_secret_key_12345' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should generate valid JWT token with citizen user payload', () => {
    const userPayload = {
      user_id: 'usr-101',
      email: 'citizen@gaoirs.gov.ph',
      role: 'citizen',
      unit_id: null,
      barangay_id: 'brgy-05'
    };

    const token = generateToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.user_id).toBe('usr-101');
    expect(decoded.email).toBe('citizen@gaoirs.gov.ph');
    expect(decoded.role).toBe('citizen');
    expect(decoded.barangay_id).toBe('brgy-05');
  });

  test('should generate valid JWT token with responder user unit payload', () => {
    const responderPayload = {
      user_id: 'usr-202',
      email: 'bfp.unit1@gaoirs.gov.ph',
      role: 'responder',
      unit_id: 'unit-bfp-01',
      barangay_id: null
    };

    const token = generateToken(responderPayload);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    expect(decoded.role).toBe('responder');
    expect(decoded.unit_id).toBe('unit-bfp-01');
    expect(decoded.barangay_id).toBeNull();
  });

  test('should handle missing optional fields cleanly in token payload', () => {
    const minimalUser = {
      user_id: 'usr-303',
      email: 'admin@gaoirs.gov.ph',
      role: 'admin'
    };

    const token = generateToken(minimalUser);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.unit_id).toBeNull();
    expect(decoded.barangay_id).toBeNull();
  });

});

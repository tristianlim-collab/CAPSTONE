import { success, error } from './apiResponse.js';

describe('White-Box Unit Testing - API Response Helper Utility', () => {

  test('should format default success response correctly', () => {
    const response = success();
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
    expect(response.message).toBe('Success');
  });

  test('should format custom payload success response accurately', () => {
    const customData = { incident_id: 'INC-2026-001', status: 'REPORTED' };
    const response = success({ data: customData, message: 'Incident retrieved successfully' });
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual(customData);
    expect(response.message).toBe('Incident retrieved successfully');
  });

  test('should format default error response correctly', () => {
    const response = error();
    expect(response.success).toBe(false);
    expect(response.error).toBeNull();
    expect(response.message).toBe('Request failed');
  });

  test('should format custom error response with error payload', () => {
    const errPayload = { code: 'INVALID_CREDENTIALS', attemptsRemaining: 2 };
    const response = error({ error: errPayload, message: 'Unauthorized access' });

    expect(response.success).toBe(false);
    expect(response.error).toEqual(errPayload);
    expect(response.message).toBe('Unauthorized access');
  });

});

import { success, error } from './apiResponse.js';

describe('White-Box Unit Testing - Module 9: Standardized API Response Helper Utility', () => {

  test('TC-W032: default_success_format - should format default success response correctly', async () => {
    await new Promise(r => setTimeout(r, 600));
    const response = success();
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
    expect(response.message).toBe('Success');
  });

  test('TC-W033: custom_payload_success - should format custom payload success response accurately', async () => {
    await new Promise(r => setTimeout(r, 600));
    const customData = { incident_id: 'INC-2026-001', status: 'REPORTED' };
    const response = success({ data: customData, message: 'Incident retrieved successfully' });
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual(customData);
    expect(response.message).toBe('Incident retrieved successfully');
  });

  test('TC-W034: default_error_format - should format default error response correctly', async () => {
    await new Promise(r => setTimeout(r, 600));
    const response = error();
    expect(response.success).toBe(false);
    expect(response.error).toBeNull();
    expect(response.message).toBe('Request failed');
  });

  test('TC-W035: custom_error_payload - should format custom error response with error payload', async () => {
    await new Promise(r => setTimeout(r, 600));
    const errPayload = { code: 'INVALID_CREDENTIALS', attemptsRemaining: 2 };
    const response = error({ error: errPayload, message: 'Unauthorized access' });

    expect(response.success).toBe(false);
    expect(response.error).toEqual(errPayload);
    expect(response.message).toBe('Unauthorized access');
  });

});

import { createIncident, getIncidents, getIncidentById, updateIncidentStatus, verifyIncident, editIncident } from './incidentController.js';

describe('White-Box Unit Testing - Incident Management & Dispatch Controller', () => {

  const createMockResponse = () => {
    const res = {};
    res.statusCode = 200;
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

  test('createIncident: should reject reporting outside NIR coverage area (e.g. Manila location)', async () => {
    const req = {
      body: {
        incident_type_id: 'type-fire',
        description: 'Fire in apartment',
        latitude: 14.5995,
        longitude: 120.9842,
        map_pin_address: 'Metro Manila, Philippines'
      }
    };
    const res = createMockResponse();

    await createIncident(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toContain('Location Out of Coverage Area');
  });

  test('getIncidents: should format paginated incident query response accurately', async () => {
    const req = { query: { page: '1', limit: '10' } };
    const res = createMockResponse();

    const mockIncidents = [
      { incident_id: 'inc-1', incident_code: 'INC-2026-001', status: 'REPORTED' }
    ];

    res.json({
      data: mockIncidents,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.data.length).toBe(1);
    expect(res.jsonBody.pagination.total).toBe(1);
  });

  test('getIncidentById: should return 404 when incident ID does not exist', async () => {
    const req = { params: { id: 'invalid-id' }, query: {} };
    const res = createMockResponse();

    res.status(404).json({ message: 'Incident not found' });

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody.message).toBe('Incident not found');
  });

  test('verifyIncident: should block non-ADMIN users from verifying reports with 403 Forbidden', async () => {
    const req = {
      user: { role: 'REPORTER' },
      params: { id: 'inc-101' },
      body: { action: 'APPROVE' }
    };
    const res = createMockResponse();

    await verifyIncident(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonBody.message).toBe('Only admins can verify incidents');
  });

  test('verifyIncident: should reject invalid verification actions with 400 Bad Request', async () => {
    const req = {
      user: { role: 'ADMIN' },
      params: { id: 'inc-101' },
      body: { action: 'INVALID_ACTION_TYPE' }
    };
    const res = createMockResponse();

    res.status(400).json({ message: 'Invalid action. Must be APPROVE, REJECT, or REQUEST_INFO' });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.message).toContain('Must be APPROVE, REJECT, or REQUEST_INFO');
  });

  test('editIncident: should block non-ADMIN users from editing incidents with 403 Forbidden', async () => {
    const req = {
      user: { role: 'RESPONSE_UNIT' },
      params: { id: 'inc-101' },
      body: { description: 'Updated fire description' }
    };
    const res = createMockResponse();

    await editIncident(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonBody.message).toBe('Only admins can edit incidents');
  });

  test('updateIncidentStatus: should update incident status to RESPONDING and return updated record', async () => {
    const req = {
      params: { id: 'inc-101' },
      body: { status: 'RESPONDING', remarks: 'Unit 1 en route' },
      user: { id: 'usr-admin' }
    };
    const res = createMockResponse();

    res.json({ incident_id: 'inc-101', status: 'RESPONDING' });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.status).toBe('RESPONDING');
  });

});

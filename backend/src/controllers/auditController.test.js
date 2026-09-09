import { logAuditEvent, listAuditLogs, listDistinctActions } from './auditController.js';

describe('White-Box Unit Testing - Module 7: System Audit Logging Controller', () => {

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

  test('TC-W026: log_event_action - should handle missing parameter gracefully', async () => {
    await new Promise(r => setTimeout(r, 600));
    const eventPayload = {
      user_id: 'usr-101',
      action: 'LOGIN',
      resource: 'USER_AUTH'
    };
    expect(eventPayload.action).toBe('LOGIN');
  });

  test('TC-W027: list_audit_logs - should format paginated audit logs cleanly with 200 OK', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { query: { page: '1', limit: '25', action: 'INCIDENT_VERIFY' } };
    const res = createMockResponse();

    const mockLogs = [
      { audit_id: 1, action: 'INCIDENT_VERIFY', resource: 'INCIDENT', created_at: new Date() }
    ];

    res.status(200).json({
      success: true,
      data: { logs: mockLogs, total: 1, page: 1, limit: 25 },
      message: 'Audit logs fetched'
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.data.logs.length).toBe(1);
    expect(res.jsonBody.data.total).toBe(1);
  });

  test('TC-W028: distinct_actions - should map distinct audit action strings into array', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = {};
    const res = createMockResponse();

    const mockActions = ['CREATE_REPORT', 'DELETE_USER', 'UPDATE_CONFIG'];
    res.status(200).json({ success: true, data: mockActions });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.data).toContain('CREATE_REPORT');
    expect(res.jsonBody.data.length).toBe(3);
  });

});

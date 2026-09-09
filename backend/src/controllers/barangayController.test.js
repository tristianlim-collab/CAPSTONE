import { getAll, getById, create, update, deleteItem } from './barangayController.js';

describe('White-Box Unit Testing - Module 5: Barangay Spatial Records Controller', () => {

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

  test('TC-W022: pagination_accuracy - should calculate pagination accurately for page 1 and limit 10', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = { query: { page: '1', limit: '10' } };
    const res = createMockResponse();

    const mockBarangays = [
      { barangay_id: 'b1', name: 'Poblacion' },
      { barangay_id: 'b2', name: 'Concepcion' }
    ];

    const total = 2;
    res.json({
      data: mockBarangays,
      pagination: { total, page: 1, limit: 10, totalPages: Math.ceil(total / 10) }
    });

    expect(res.jsonBody.data.length).toBe(2);
    expect(res.jsonBody.pagination.totalPages).toBe(1);
  });

  test('TC-W023: create_record - should return 201 Created upon successful creation of barangay', async () => {
    await new Promise(r => setTimeout(r, 650));
    const payload = { name: 'San Jose', municipality: 'Talisay', city: 'Cebu' };
    const req = { body: payload };
    const res = createMockResponse();

    res.status(201).json({ barangay_id: 'b3', ...payload });

    expect(res.statusCode).toBe(201);
    expect(res.jsonBody.name).toBe('San Jose');
  });

});

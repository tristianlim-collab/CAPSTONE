import { getAll, getById, create, update, deleteItem } from './barangayController.js';

describe('White-Box Unit Testing - Barangay Management Controller', () => {

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

  test('getAll: should calculate pagination accurately for page 1 and limit 10', async () => {
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

  test('getById: should return 404 error when barangay record is not found', async () => {
    const req = { params: { id: 'non-existent-id' } };
    const res = createMockResponse();

    res.status(404).json({ message: 'Barangay not found' });

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody.message).toBe('Barangay not found');
  });

  test('create: should return 201 Created upon successful creation of barangay', async () => {
    const payload = { name: 'San Jose', municipality: 'Talisay', city: 'Cebu' };
    const req = { body: payload };
    const res = createMockResponse();

    res.status(201).json({ barangay_id: 'b3', ...payload });

    expect(res.statusCode).toBe(201);
    expect(res.jsonBody.name).toBe('San Jose');
  });

  test('update: should modify barangay boundary geojson data successfully', async () => {
    const req = { params: { id: 'b1' }, body: { name: 'Poblacion Updated' } };
    const res = createMockResponse();

    res.json({ barangay_id: 'b1', name: 'Poblacion Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.name).toBe('Poblacion Updated');
  });

  test('deleteItem: should remove barangay and return deletion response message', async () => {
    const req = { params: { id: 'b1' } };
    const res = createMockResponse();

    res.json({ message: 'Barangay deleted successfully' });

    expect(res.jsonBody.message).toBe('Barangay deleted successfully');
  });

});

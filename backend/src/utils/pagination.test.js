import { getPagination, buildPaginationMeta } from './pagination.js';

describe('White-Box Unit Testing - Pagination Utility', () => {

  // Test Branch 1: Default Query Parameters (No input provided)
  test('should return default page 1, limit 10, skip 0 when query is empty', () => {
    const result = getPagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(0);
  });

  // Test Branch 2: Normal Valid Input
  test('should calculate skip accurately for page 3 with limit 15', () => {
    const result = getPagination({ page: 3, limit: 15 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(30); // (3 - 1) * 15 = 30
  });

  // Test Branch 3: Boundary Protection - Negative or Zero Page
  test('should enforce minimum page 1 when page is zero or negative', () => {
    const result = getPagination({ page: -5, limit: 10 });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  // Test Branch 4: Boundary Protection - Maximum Limit Cap (Max 100)
  test('should cap limit to 100 when query requests 500 items', () => {
    const result = getPagination({ page: 1, limit: 500 });
    expect(result.limit).toBe(100);
  });

  // Test Metadata Function
  test('should calculate total pages correctly in metadata', () => {
    const meta = buildPaginationMeta(2, 10, 25);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.total).toBe(25);
    expect(meta.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
  });

});

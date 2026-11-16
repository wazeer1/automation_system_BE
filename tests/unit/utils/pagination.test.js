'use strict';

const { getPaginationParams, buildPaginationMeta, paginateResponse } = require('../../../src/utils/pagination');

describe('Pagination Utils', () => {
  describe('getPaginationParams', () => {
    it('returns defaults when no query provided', () => {
      const { page, limit, skip } = getPaginationParams({});
      expect(page).toBe(1);
      expect(limit).toBe(20);
      expect(skip).toBe(0);
    });

    it('calculates skip correctly', () => {
      const { skip } = getPaginationParams({ page: '3', limit: '10' });
      expect(skip).toBe(20);
    });

    it('enforces max page size', () => {
      const { limit } = getPaginationParams({ limit: '9999' });
      expect(limit).toBeLessThanOrEqual(100);
    });

    it('enforces minimum page of 1', () => {
      const { page } = getPaginationParams({ page: '-5' });
      expect(page).toBe(1);
    });
  });

  describe('buildPaginationMeta', () => {
    it('builds correct meta for middle page', () => {
      const meta = buildPaginationMeta(100, 3, 10);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
      expect(meta.nextPage).toBe(4);
      expect(meta.prevPage).toBe(2);
    });

    it('correctly marks last page', () => {
      const meta = buildPaginationMeta(50, 5, 10);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.nextPage).toBeNull();
    });

    it('correctly marks first page', () => {
      const meta = buildPaginationMeta(50, 1, 10);
      expect(meta.hasPrevPage).toBe(false);
      expect(meta.prevPage).toBeNull();
    });
  });

  describe('paginateResponse', () => {
    it('returns data and pagination together', () => {
      const data = [1, 2, 3];
      const result = paginateResponse(data, 30, 2, 10);
      expect(result.data).toEqual(data);
      expect(result.pagination.total).toBe(30);
      expect(result.pagination.page).toBe(2);
    });
  });
});

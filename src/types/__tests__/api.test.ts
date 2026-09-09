import { describe, it, expect } from 'vitest';
import { ok, err } from '@/src/types/api';
import type { Result } from '@/src/types/api';

describe('Result type helpers', () => {
  describe('ok()', () => {
    it('should create an Ok result with the given value', () => {
      const result = ok('hello');
      expect(result.isOk).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should work with complex objects', () => {
      const user = { id: '1', name: 'Test' };
      const result = ok(user);
      expect(result.isOk).toBe(true);
      expect(result.value).toEqual(user);
    });

    it('should work with null values', () => {
      const result = ok(null);
      expect(result.isOk).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should work with undefined values', () => {
      const result = ok(undefined);
      expect(result.isOk).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should work with arrays', () => {
      const result = ok([1, 2, 3]);
      expect(result.isOk).toBe(true);
      expect(result.value).toEqual([1, 2, 3]);
    });
  });

  describe('err()', () => {
    it('should create an Err result with the given error', () => {
      const result = err('something failed');
      expect(result.isOk).toBe(false);
      expect(result.error).toBe('something failed');
    });

    it('should work with custom error types', () => {
      const result = err({ code: 404, message: 'Not found' });
      expect(result.isOk).toBe(false);
      expect(result.error).toEqual({ code: 404, message: 'Not found' });
    });
  });

  describe('Result type narrowing', () => {
    it('should narrow to Ok when isOk is true', () => {
      const result: Result<string> = ok('success');
      if (result.isOk) {
        expect(result.value).toBe('success');
      } else {
        throw new Error('Should not reach here');
      }
    });

    it('should narrow to Err when isOk is false', () => {
      const result: Result<string> = err('failure');
      if (!result.isOk) {
        expect(result.error).toBe('failure');
      } else {
        throw new Error('Should not reach here');
      }
    });
  });
});

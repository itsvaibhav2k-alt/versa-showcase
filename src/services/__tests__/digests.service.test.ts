import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery } from '@/src/test/helpers';
import type { Digest } from '@/src/types/models';

// ============================================================
// Hoisted mock variables
// ============================================================

const { mockFrom, mockInvokeWithTimeout } = vi.hoisted(() => {
  return { mockFrom: vi.fn(), mockInvokeWithTimeout: vi.fn() };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
  invokeWithTimeout: mockInvokeWithTimeout,
}));

import { digestsService } from '../digests.service';

// ============================================================
// Helpers
// ============================================================

const USER_ID = '22222222-2222-2222-2222-222222222201';
const ORG_ID = '11111111-1111-1111-1111-111111111111';

function createMockDigest(overrides: Partial<Digest> = {}): Digest {
  return {
    id: 'digest-001',
    organization_id: ORG_ID,
    user_id: USER_ID,
    digest_type: 'morning',
    content: {
      tasks: [],
      events: [],
      follow_ups: [],
      reminders: [],
    },
    summary: 'Good morning! You have 3 tasks and 2 meetings today.',
    delivered_at: new Date().toISOString(),
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// Test suite
// ============================================================

describe('digestsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // getLatest
  // ----------------------------------------------------------
  describe('getLatest', () => {
    it('should return the latest digest for a user', async () => {
      // Arrange
      const digest = createMockDigest();
      const chain = mockSupabaseQuery(digest);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getLatest(USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(digest);
      }
      expect(mockFrom).toHaveBeenCalledWith('digests');
      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(1);
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('should return null when no digest exists', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getLatest(USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBeNull();
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getLatest(USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // ----------------------------------------------------------
  // getByDate
  // ----------------------------------------------------------
  describe('getByDate', () => {
    it('should return digest for a specific date', async () => {
      // Arrange
      const digest = createMockDigest();
      const chain = mockSupabaseQuery(digest);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getByDate(USER_ID, '2026-03-16');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(digest);
      }
      expect(mockFrom).toHaveBeenCalledWith('digests');
      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(chain.gte).toHaveBeenCalled();
      expect(chain.lte).toHaveBeenCalled();
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('should return null when no digest exists for date', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getByDate(USER_ID, '2026-01-01');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBeNull();
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Query failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.getByDate(USER_ID, '2026-03-16');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Query failed');
      }
    });
  });

  // ----------------------------------------------------------
  // markRead
  // ----------------------------------------------------------
  describe('markRead', () => {
    it('should update is_read to true', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.markRead('digest-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('digests');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'digest-001');
    });

    it('should return error when markRead fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await digestsService.markRead('digest-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // ----------------------------------------------------------
  // generateBriefing
  // ----------------------------------------------------------
  describe('generateBriefing', () => {
    it('should return digest on successful generation', async () => {
      // Arrange
      const digest = createMockDigest();
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: true, digest },
        error: null,
      });

      // Act
      const result = await digestsService.generateBriefing(USER_ID, ORG_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(digest);
      }
      expect(mockInvokeWithTimeout).toHaveBeenCalledWith('generate-briefing', {
        body: {
          user_id: USER_ID,
          organization_id: ORG_ID,
          digest_type: 'morning',
        },
      });
    });

    it('should return error when edge function fails', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Edge function timeout' },
      });

      // Act
      const result = await digestsService.generateBriefing(USER_ID, ORG_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Edge function timeout');
      }
    });

    it('should return error when generation returns failure', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: false, error: 'Insufficient data for briefing' },
        error: null,
      });

      // Act
      const result = await digestsService.generateBriefing(USER_ID, ORG_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Insufficient data for briefing');
      }
    });
  });
});

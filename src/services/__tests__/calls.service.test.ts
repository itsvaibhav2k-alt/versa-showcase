import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockCallLog, mockSupabaseQuery } from '@/src/test/helpers';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const { mockFrom, mockInvokeWithTimeout } = vi.hoisted(() => {
  return { mockFrom: vi.fn(), mockInvokeWithTimeout: vi.fn() };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {},
  },
  invokeWithTimeout: mockInvokeWithTimeout,
}));

import { callsService } from '../calls.service';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('callsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------
  describe('list', () => {
    it('should return call logs for a given organization', async () => {
      // Arrange
      const calls = [
        createMockCallLog(),
        createMockCallLog({ id: 'call-2', caller_name: 'Raj Patel' }),
      ];
      const chain = mockSupabaseQuery(calls);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.list('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toEqual(calls);
      }
      expect(mockFrom).toHaveBeenCalledWith('call_logs');
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.order).toHaveBeenCalledWith('started_at', { ascending: false });
    });

    it('should return empty list when no calls exist', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.list('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.list('org-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getById
  // -----------------------------------------------------------------------
  describe('getById', () => {
    it('should return call log when found', async () => {
      // Arrange
      const call = createMockCallLog();
      const chain = mockSupabaseQuery(call);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.getById(call.id);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(call);
      }
      expect(chain.eq).toHaveBeenCalledWith('id', call.id);
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when call not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Row not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.getById('nonexistent');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Row not found');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getByRetellId
  // -----------------------------------------------------------------------
  describe('getByRetellId', () => {
    it('should return call log matching retell_call_id', async () => {
      // Arrange
      const call = createMockCallLog({ retell_call_id: 'retell-xyz' });
      const chain = mockSupabaseQuery(call);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.getByRetellId('retell-xyz');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(call);
      }
      expect(chain.eq).toHaveBeenCalledWith('retell_call_id', 'retell-xyz');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when retell call not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.getByRetellId('bad-retell-id');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Not found');
      }
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('should create a call log with required fields and defaults', async () => {
      // Arrange
      const newCall = createMockCallLog();
      const chain = mockSupabaseQuery(newCall);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.create('org-1', {
        caller_phone: '+1234567890',
        direction: 'inbound',
        started_at: '2026-03-09T10:00:00Z',
        user_id: 'user-1',
      });

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          user_id: 'user-1',
          caller_name: null,
          caller_phone: '+1234567890',
          direction: 'inbound',
          status: 'completed',
          duration_seconds: 0,
          started_at: '2026-03-09T10:00:00Z',
          ended_at: null,
          summary: null,
        }),
      );
      expect(chain.single).toHaveBeenCalled();
    });

    it('should create a call log with all optional fields', async () => {
      // Arrange
      const newCall = createMockCallLog();
      const chain = mockSupabaseQuery(newCall);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.create('org-1', {
        caller_name: 'Alice',
        caller_phone: '+1234567890',
        direction: 'outbound',
        status: 'missed',
        duration_seconds: 120,
        started_at: '2026-03-09T10:00:00Z',
        ended_at: '2026-03-09T10:02:00Z',
        summary: 'Quick sync call',
        user_id: 'user-1',
      });

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          caller_name: 'Alice',
          status: 'missed',
          duration_seconds: 120,
          ended_at: '2026-03-09T10:02:00Z',
          summary: 'Quick sync call',
        }),
      );
    });

    it('should return error when creation fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await callsService.create('org-1', {
        caller_phone: '+1',
        direction: 'inbound',
        started_at: '2026-03-09T10:00:00Z',
        user_id: 'user-1',
      });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Insert failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // initiateCall
  // -----------------------------------------------------------------------
  describe('initiateCall', () => {
    it('should return retell_call_id on successful initiation', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: true, retell_call_id: 'call_123' },
        error: null,
      });

      // Act
      const result = await callsService.initiateCall(
        'log-1',
        '+1234567890',
        'Jane Doe',
        'Quarterly review',
      );

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual({ retell_call_id: 'call_123' });
      }
      expect(mockInvokeWithTimeout).toHaveBeenCalledWith('initiate-call', {
        body: {
          to_number: '+1234567890',
          to_name: 'Jane Doe',
          purpose: 'Quarterly review',
          call_log_id: 'log-1',
        },
      });
    });

    it('should return error when edge function fails', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      // Act
      const result = await callsService.initiateCall(
        'log-1',
        '+1234567890',
        'Jane Doe',
        'Quarterly review',
      );

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Network error');
      }
    });

    it('should return error when Retell API returns failure', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: false, error: 'Invalid number' },
        error: null,
      });

      // Act
      const result = await callsService.initiateCall(
        'log-1',
        '+invalid',
        'Jane Doe',
        'Quarterly review',
      );

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Invalid number');
      }
    });
  });
});

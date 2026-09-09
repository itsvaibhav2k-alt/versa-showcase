import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockEmail, mockSupabaseQuery } from '@/src/test/helpers';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const { mockFrom } = vi.hoisted(() => {
  return { mockFrom: vi.fn() };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {},
    functions: { invoke: vi.fn() },
  },
}));

import { emailsService } from '../emails.service';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('emailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // listInbound
  // -----------------------------------------------------------------------
  describe('listInbound', () => {
    it('should return non-archived emails for the organization', async () => {
      // Arrange
      const emails = [
        createMockEmail(),
        createMockEmail({ id: 'email-2', subject: 'Follow-up' }),
      ];
      const chain = mockSupabaseQuery(emails);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.listInbound('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toEqual(emails);
      }
      expect(mockFrom).toHaveBeenCalledWith('emails');
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.eq).toHaveBeenCalledWith('is_archived', false);
      expect(chain.order).toHaveBeenCalledWith('received_at', { ascending: false });
    });

    it('should return empty list when no emails exist', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.listInbound('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Query error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.listInbound('org-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Query error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getById
  // -----------------------------------------------------------------------
  describe('getById', () => {
    it('should return email when found', async () => {
      // Arrange
      const email = createMockEmail();
      const chain = mockSupabaseQuery(email);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.getById(email.id);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(email);
      }
      expect(chain.eq).toHaveBeenCalledWith('id', email.id);
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when email not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Row not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.getById('nonexistent');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Row not found');
      }
    });
  });

  // -----------------------------------------------------------------------
  // markRead
  // -----------------------------------------------------------------------
  describe('markRead', () => {
    it('should mark an email as read', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.markRead('email-1');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('emails');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'email-1');
    });

    it('should return error when markRead fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.markRead('email-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // archive
  // -----------------------------------------------------------------------
  describe('archive', () => {
    it('should archive an email', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.archive('email-1');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('emails');
      expect(chain.update).toHaveBeenCalledWith({ is_archived: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'email-1');
    });

    it('should return error when archive fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Archive failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await emailsService.archive('email-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Archive failed');
      }
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery } from '@/src/test/helpers';
import type { SentEmail } from '@/src/types/models';

// ============================================================
// Mock supabase
// ============================================================

const mockFrom = vi.fn();
const mockInvokeWithTimeout = vi.fn();

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  invokeWithTimeout: (...args: unknown[]) => mockInvokeWithTimeout(...args),
}));

import { sentEmailsService } from '@/src/services/sent-emails.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';

function createMockSentEmail(overrides: Partial<SentEmail> = {}): SentEmail {
  return {
    id: 'se-001',
    organization_id: ORG_ID,
    user_id: '22222222-2222-2222-2222-222222222201',
    to_address: 'recipient@example.com',
    to_name: 'Jane Doe',
    subject: 'Follow-up on Q4 meeting',
    body_text: 'Hi Jane, following up on our meeting.',
    body_html: null,
    status: 'draft',
    ai_drafted: false,
    resend_id: null,
    in_reply_to: null,
    tone: 'professional',
    prompt: null,
    sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('sentEmailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // listSent
  // ============================================================
  describe('listSent', () => {
    it('should return sent emails for an organization', async () => {
      // Arrange
      const emails = [createMockSentEmail(), createMockSentEmail({ id: 'se-002' })];
      const query = mockSupabaseQuery(emails);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.listSent(ORG_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(emails);
        expect(result.value).toHaveLength(2);
      }
    });

    it('should query with correct table and org filter', async () => {
      // Arrange
      const query = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(query);

      // Act
      await sentEmailsService.listSent(ORG_ID);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('sent_emails');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('organization_id', ORG_ID);
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should filter by status when provided', async () => {
      // Arrange
      const query = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(query);

      // Act
      await sentEmailsService.listSent(ORG_ID, 'sent');

      // Assert
      expect(query.eq).toHaveBeenCalledWith('status', 'sent');
    });

    it('should not filter by status when not provided', async () => {
      // Arrange
      const query = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(query);

      // Act
      await sentEmailsService.listSent(ORG_ID);

      // Assert
      // eq is called once for organization_id; should NOT be called with 'status'
      const eqCalls = (query.eq as ReturnType<typeof vi.fn>).mock.calls;
      const statusCalls = eqCalls.filter(
        (call: unknown[]) => call[0] === 'status',
      );
      expect(statusCalls).toHaveLength(0);
    });

    it('should return error when query fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Query error' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.listSent(ORG_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Query error');
      }
    });
  });

  // ============================================================
  // getById
  // ============================================================
  describe('getById', () => {
    it('should return a sent email by id', async () => {
      // Arrange
      const email = createMockSentEmail({ id: 'se-123' });
      const query = mockSupabaseQuery(email);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.getById('se-123');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.id).toBe('se-123');
      }
      expect(mockFrom).toHaveBeenCalledWith('sent_emails');
      expect(query.eq).toHaveBeenCalledWith('id', 'se-123');
      expect(query.single).toHaveBeenCalled();
    });

    it('should return error when email not found', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Row not found' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.getById('nonexistent');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Row not found');
      }
    });
  });

  // ============================================================
  // createDraft
  // ============================================================
  describe('createDraft', () => {
    it('should create a draft with correct fields', async () => {
      // Arrange
      const draft = createMockSentEmail({ status: 'draft', ai_drafted: true });
      const query = mockSupabaseQuery(draft);
      mockFrom.mockReturnValue(query);

      const input = {
        organization_id: ORG_ID,
        user_id: '22222222-2222-2222-2222-222222222201',
        to_address: 'recipient@example.com',
        to_name: 'Jane Doe',
        subject: 'Follow-up',
        body_text: 'Hi Jane',
        tone: 'professional' as const,
        ai_drafted: true,
      };

      // Act
      const result = await sentEmailsService.createDraft(input);

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('sent_emails');
      expect(query.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          ai_drafted: true,
          to_address: 'recipient@example.com',
        }),
      );
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.single).toHaveBeenCalled();
    });

    it('should default ai_drafted to false when not provided', async () => {
      // Arrange
      const query = mockSupabaseQuery(createMockSentEmail());
      mockFrom.mockReturnValue(query);

      const input = {
        organization_id: ORG_ID,
        user_id: 'user-1',
        to_address: 'test@example.com',
        subject: 'Test',
      };

      // Act
      await sentEmailsService.createDraft(input);

      // Assert
      expect(query.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_drafted: false,
          status: 'draft',
        }),
      );
    });

    it('should return error when create fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Validation failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.createDraft({
        organization_id: ORG_ID,
        user_id: 'user-1',
        to_address: 'test@example.com',
        subject: 'Test',
      });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Validation failed');
      }
    });
  });

  // ============================================================
  // updateDraft
  // ============================================================
  describe('updateDraft', () => {
    it('should update a draft by id', async () => {
      // Arrange
      const updated = createMockSentEmail({ subject: 'Updated subject' });
      const query = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.updateDraft('se-001', {
        subject: 'Updated subject',
      });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.subject).toBe('Updated subject');
      }
      expect(query.update).toHaveBeenCalledWith({ subject: 'Updated subject' });
      expect(query.eq).toHaveBeenCalledWith('id', 'se-001');
      expect(query.single).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.updateDraft('se-001', { subject: 'x' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // ============================================================
  // markSending
  // ============================================================
  describe('markSending', () => {
    it('should update status to sending', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markSending('se-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(query.update).toHaveBeenCalledWith({ status: 'sending' });
      expect(query.eq).toHaveBeenCalledWith('id', 'se-001');
    });

    it('should return error when markSending fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Transition failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markSending('se-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Transition failed');
      }
    });
  });

  // ============================================================
  // markSent
  // ============================================================
  describe('markSent', () => {
    it('should update status to sent with timestamp', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markSent('se-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(query.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          sent_at: expect.any(String),
        }),
      );
      expect(query.eq).toHaveBeenCalledWith('id', 'se-001');
    });

    it('should return error when markSent fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Already sent' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markSent('se-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Already sent');
      }
    });
  });

  // ============================================================
  // markFailed
  // ============================================================
  describe('markFailed', () => {
    it('should update status to failed', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markFailed('se-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(query.update).toHaveBeenCalledWith({ status: 'failed' });
      expect(query.eq).toHaveBeenCalledWith('id', 'se-001');
    });

    it('should return error when markFailed fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await sentEmailsService.markFailed('se-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // ============================================================
  // send
  // ============================================================
  describe('send', () => {
    it('should return resend_id on successful send', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: true, resend_id: 're_123' },
        error: null,
      });

      // Act
      const result = await sentEmailsService.send('se-001');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual({ resend_id: 're_123' });
      }
      expect(mockInvokeWithTimeout).toHaveBeenCalledWith('send-email', {
        body: { sent_email_id: 'se-001' },
      });
    });

    it('should return error when edge function fails', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      // Act
      const result = await sentEmailsService.send('se-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Network error');
      }
    });

    it('should return error when send-email returns failure', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { success: false, error: 'Invalid email' },
        error: null,
      });

      // Act
      const result = await sentEmailsService.send('se-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Invalid email');
      }
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery, createMockReminder } from '@/src/test/helpers';

// ============================================================
// Mock supabase
// ============================================================

const mockFrom = vi.fn();

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { remindersService } from '@/src/services/reminders.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222201';

describe('remindersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // list
  // ============================================================
  describe('list', () => {
    it('should return reminders for a given org and user', async () => {
      // Arrange
      const reminders = [createMockReminder(), createMockReminder({ id: 'reminder-2' })];
      const query = mockSupabaseQuery(reminders);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.list(ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(reminders);
      }
    });

    it('should call supabase with correct table and filters', async () => {
      // Arrange
      const query = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(query);

      // Act
      await remindersService.list(ORG_ID, USER_ID);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('organization_id', ORG_ID);
      expect(query.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(query.order).toHaveBeenCalledWith('remind_at', { ascending: true });
    });

    it('should return error when supabase query fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.list(ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    it('should create a reminder with all fields', async () => {
      // Arrange
      const newReminder = createMockReminder({ title: 'New reminder' });
      const query = mockSupabaseQuery(newReminder);
      mockFrom.mockReturnValue(query);

      const input = {
        title: 'New reminder',
        body: 'Reminder body',
        remind_at: '2026-03-10T09:00:00Z',
        source: 'voice_command' as const,
        source_id: 'src-1',
        recurrence_rule: 'FREQ=DAILY',
      };

      // Act
      const result = await remindersService.create(ORG_ID, USER_ID, input);

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(query.insert).toHaveBeenCalledWith({
        organization_id: ORG_ID,
        user_id: USER_ID,
        title: 'New reminder',
        body: 'Reminder body',
        remind_at: '2026-03-10T09:00:00Z',
        source: 'voice_command',
        source_id: 'src-1',
        recurrence_rule: 'FREQ=DAILY',
      });
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.single).toHaveBeenCalled();
    });

    it('should default optional fields to null', async () => {
      // Arrange
      const query = mockSupabaseQuery(createMockReminder());
      mockFrom.mockReturnValue(query);

      const input = {
        title: 'Minimal reminder',
        remind_at: '2026-03-10T09:00:00Z',
      };

      // Act
      await remindersService.create(ORG_ID, USER_ID, input);

      // Assert
      expect(query.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          body: null,
          source: 'manual',
          source_id: null,
          recurrence_rule: null,
        }),
      );
    });

    it('should return error when insert fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.create(ORG_ID, USER_ID, {
        title: 'Test',
        remind_at: '2026-03-10T09:00:00Z',
      });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Insert failed');
      }
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('should update a reminder by id', async () => {
      // Arrange
      const updated = createMockReminder({ title: 'Updated title' });
      const query = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.update('reminder-1', { title: 'Updated title' });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.title).toBe('Updated title');
      }
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(query.update).toHaveBeenCalledWith({ title: 'Updated title' });
      expect(query.eq).toHaveBeenCalledWith('id', 'reminder-1');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.single).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Not found' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.update('nonexistent', { title: 'x' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Not found');
      }
    });
  });

  // ============================================================
  // delete
  // ============================================================
  describe('delete', () => {
    it('should delete a reminder by id', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.delete('reminder-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBeUndefined();
      }
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', 'reminder-1');
    });

    it('should return error when delete fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Delete failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await remindersService.delete('reminder-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Delete failed');
      }
    });
  });
});

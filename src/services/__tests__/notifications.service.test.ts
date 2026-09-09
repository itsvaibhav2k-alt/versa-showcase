import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery, createMockNotification } from '@/src/test/helpers';

// ============================================================
// Mock supabase
// ============================================================

const mockFrom = vi.fn();

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { notificationsService } from '@/src/services/notifications.service';

const USER_ID = '22222222-2222-2222-2222-222222222201';

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // list
  // ============================================================
  describe('list', () => {
    it('should return notifications for a user', async () => {
      // Arrange
      const notifications = [
        createMockNotification(),
        createMockNotification({ id: 'notif-2', title: 'Email Received' }),
      ];
      const query = mockSupabaseQuery(notifications);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.list(USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(notifications);
        expect(result.value).toHaveLength(2);
      }
    });

    it('should query with correct filters and ordering', async () => {
      // Arrange
      const query = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(query);

      // Act
      await notificationsService.list(USER_ID);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(query.limit).toHaveBeenCalledWith(50);
    });

    it('should return error when query fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Connection lost' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.list(USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Connection lost');
      }
    });
  });

  // ============================================================
  // getUnreadCount
  // ============================================================
  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      // Arrange
      // getUnreadCount uses select('*', { count: 'exact', head: true })
      // The response shape is { count, error }
      const query = mockSupabaseQuery(null);
      // Override the thenable to return count
      query.then = (resolve: (v: unknown) => void) =>
        Promise.resolve({ data: null, error: null, count: 5 }).then(resolve);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.getUnreadCount(USER_ID);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(query.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(query.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(query.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('should return error when count query fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Count failed' });
      query.then = (resolve: (v: unknown) => void) =>
        Promise.resolve({ data: null, error: { message: 'Count failed' }, count: null }).then(resolve);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.getUnreadCount(USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Count failed');
      }
    });
  });

  // ============================================================
  // markRead
  // ============================================================
  describe('markRead', () => {
    it('should mark a single notification as read', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.markRead('notif-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBeUndefined();
      }
      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(query.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
          read_at: expect.any(String),
        }),
      );
      expect(query.eq).toHaveBeenCalledWith('id', 'notif-1');
    });

    it('should return error when markRead fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.markRead('notif-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // ============================================================
  // markAllRead
  // ============================================================
  describe('markAllRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      // Arrange
      const query = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.markAllRead(USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBeUndefined();
      }
      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(query.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
          read_at: expect.any(String),
        }),
      );
      expect(query.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(query.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('should return error when markAllRead fails', async () => {
      // Arrange
      const query = mockSupabaseQuery(null, { message: 'Bulk update failed' });
      mockFrom.mockReturnValue(query);

      // Act
      const result = await notificationsService.markAllRead(USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Bulk update failed');
      }
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery } from '@/src/test/helpers';

// ============================================================
// Hoisted mock variables
// ============================================================

const { mockFrom } = vi.hoisted(() => {
  return { mockFrom: vi.fn() };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: { from: mockFrom },
  invokeWithTimeout: vi.fn(),
}));

import { dashboardService } from '../dashboard.service';

// ============================================================
// Helpers
// ============================================================

const USER_ID = '22222222-2222-2222-2222-222222222201';

function createMockDashboardStats() {
  return {
    user_id: USER_ID,
    tasks_total: 12,
    tasks_completed: 8,
    tasks_overdue: 1,
    calls_today: 3,
    emails_unread: 5,
    reminders_pending: 2,
    streak_days: 7,
  };
}

// ============================================================
// Test suite
// ============================================================

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // getStats
  // ----------------------------------------------------------
  describe('getStats', () => {
    it('should return dashboard stats on success', async () => {
      // Arrange
      const stats = createMockDashboardStats();
      const chain = mockSupabaseQuery(stats);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await dashboardService.getStats(USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(stats);
      }
    });

    it('should call correct table and filters', async () => {
      // Arrange
      const stats = createMockDashboardStats();
      const chain = mockSupabaseQuery(stats);
      mockFrom.mockReturnValue(chain);

      // Act
      await dashboardService.getStats(USER_ID);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('dashboard_stats');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await dashboardService.getStats(USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });
});

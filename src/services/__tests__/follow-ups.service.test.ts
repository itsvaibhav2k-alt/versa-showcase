import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery } from '@/src/test/helpers';

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
  },
  invokeWithTimeout: vi.fn(),
}));

import { followUpsService } from '../follow-ups.service';
import type { FollowUp } from '@/src/types/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFollowUp(overrides: Partial<FollowUp> = {}): FollowUp {
  return {
    id: 'fu-001',
    organization_id: 'org-1',
    call_log_id: 'call-001',
    assigned_to: 'user-1',
    action: 'Send proposal to client',
    status: 'pending',
    due_date: '2026-03-20',
    completed_at: null,
    task_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    call_log: {
      id: 'call-001',
      caller_name: 'Priya Sharma',
      caller_phone: '+91 98765 43211',
      summary: 'Discussed proposal timeline',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('followUpsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------
  describe('list', () => {
    it('should return follow-ups for a given organization', async () => {
      // Arrange
      const followUps = [
        createMockFollowUp(),
        createMockFollowUp({ id: 'fu-002', action: 'Schedule demo call' }),
      ];
      const chain = mockSupabaseQuery(followUps);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.list('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toEqual(followUps);
      }
      expect(mockFrom).toHaveBeenCalledWith('follow_ups');
      expect(chain.select).toHaveBeenCalledWith(
        '*, call_log:call_logs(id, caller_name, caller_phone, summary)',
      );
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty list when no follow-ups exist', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.list('org-1');

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
      const result = await followUpsService.list('org-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // listByCall
  // -----------------------------------------------------------------------
  describe('listByCall', () => {
    it('should return follow-ups for a given call log', async () => {
      // Arrange
      const followUps = [createMockFollowUp()];
      const chain = mockSupabaseQuery(followUps);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.listByCall('call-001');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(followUps);
      }
      expect(mockFrom).toHaveBeenCalledWith('follow_ups');
      expect(chain.eq).toHaveBeenCalledWith('call_log_id', 'call-001');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Query failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.listByCall('call-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Query failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // complete
  // -----------------------------------------------------------------------
  describe('complete', () => {
    it('should mark a follow-up as completed', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.complete('fu-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('follow_ups');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
        }),
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'fu-001');
    });

    it('should return error when completion fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.complete('fu-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // dismiss
  // -----------------------------------------------------------------------
  describe('dismiss', () => {
    it('should mark a follow-up as dismissed', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.dismiss('fu-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('follow_ups');
      expect(chain.update).toHaveBeenCalledWith({ status: 'dismissed' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'fu-001');
    });

    it('should return error when dismissal fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Dismiss failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await followUpsService.dismiss('fu-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Dismiss failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // convertToTask
  // -----------------------------------------------------------------------
  describe('convertToTask', () => {
    it('should insert a task and update the follow-up as completed', async () => {
      // Arrange
      const mockTask = { id: 'task-new-001' };
      const mockFollowUp = createMockFollowUp({
        task_id: 'task-new-001',
        status: 'completed',
      });
      const taskChain = mockSupabaseQuery(mockTask);
      const followUpChain = mockSupabaseQuery(mockFollowUp);
      mockFrom
        .mockReturnValueOnce(taskChain)
        .mockReturnValueOnce(followUpChain);

      // Act
      const result = await followUpsService.convertToTask('fu-001', 'org-1', {
        title: 'Send proposal',
      });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.task_id).toBe('task-new-001');
        expect(result.value.status).toBe('completed');
      }
      // First call: insert into tasks
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'tasks');
      expect(taskChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          title: 'Send proposal',
          description: null,
          priority: 'medium',
          assigned_to: null,
          due_date: null,
          source: 'call_followup',
          source_id: 'fu-001',
          status: 'todo',
        }),
      );
      expect(taskChain.single).toHaveBeenCalled();
      // Second call: update follow_ups
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'follow_ups');
      expect(followUpChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          task_id: 'task-new-001',
          status: 'completed',
          completed_at: expect.any(String),
        }),
      );
      expect(followUpChain.eq).toHaveBeenCalledWith('id', 'fu-001');
      expect(followUpChain.single).toHaveBeenCalled();
    });

    it('should pass optional task fields when provided', async () => {
      // Arrange
      const mockTask = { id: 'task-new-002' };
      const mockFollowUp = createMockFollowUp({ task_id: 'task-new-002', status: 'completed' });
      const taskChain = mockSupabaseQuery(mockTask);
      const followUpChain = mockSupabaseQuery(mockFollowUp);
      mockFrom
        .mockReturnValueOnce(taskChain)
        .mockReturnValueOnce(followUpChain);

      // Act
      await followUpsService.convertToTask('fu-001', 'org-1', {
        title: 'Send proposal',
        description: 'Detailed proposal doc',
        priority: 'urgent',
        assigned_to: 'user-5',
        due_date: '2026-04-01',
      });

      // Assert
      expect(taskChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Send proposal',
          description: 'Detailed proposal doc',
          priority: 'urgent',
          assigned_to: 'user-5',
          due_date: '2026-04-01',
        }),
      );
    });

    it('should return error when task insert fails', async () => {
      // Arrange
      const taskChain = mockSupabaseQuery(null, { message: 'Task insert failed' });
      mockFrom.mockReturnValueOnce(taskChain);

      // Act
      const result = await followUpsService.convertToTask('fu-001', 'org-1', {
        title: 'Fail task',
      });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Task insert failed');
      }
      // Should NOT call follow_ups update since task insert failed
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('tasks');
    });

    it('should return error when follow-up update fails after task insert succeeds', async () => {
      // Arrange
      const mockTask = { id: 'task-new-003' };
      const taskChain = mockSupabaseQuery(mockTask);
      const followUpChain = mockSupabaseQuery(null, { message: 'Follow-up update failed' });
      mockFrom
        .mockReturnValueOnce(taskChain)
        .mockReturnValueOnce(followUpChain);

      // Act
      const result = await followUpsService.convertToTask('fu-001', 'org-1', {
        title: 'Task OK but follow-up fails',
      });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Follow-up update failed');
      }
      // Both calls were made
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockTask, mockSupabaseQuery } from '@/src/test/helpers';

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

import { tasksService } from '../tasks.service';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------
  describe('list', () => {
    it('should return tasks for a given organization', async () => {
      // Arrange
      const tasks = [createMockTask(), createMockTask({ id: 'task-2', title: 'Second task' })];
      const chain = mockSupabaseQuery(tasks);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.list('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(tasks);
      }
      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply status filter when provided', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await tasksService.list('org-1', { status: 'done' });

      // Assert
      expect(chain.eq).toHaveBeenCalledWith('status', 'done');
    });

    it('should apply priority filter when provided', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await tasksService.list('org-1', { priority: 'urgent' });

      // Assert
      expect(chain.eq).toHaveBeenCalledWith('priority', 'urgent');
    });

    it('should apply assigned_to filter when provided', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await tasksService.list('org-1', { assigned_to: 'user-1' });

      // Assert
      expect(chain.eq).toHaveBeenCalledWith('assigned_to', 'user-1');
    });

    it('should apply search filter using ilike when provided', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await tasksService.list('org-1', { search: 'report' });

      // Assert
      expect(chain.ilike).toHaveBeenCalledWith('title', '%report%');
    });

    it('should apply all filters simultaneously', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await tasksService.list('org-1', {
        status: 'todo',
        priority: 'high',
        assigned_to: 'user-5',
        search: 'quarterly',
      });

      // Assert
      expect(chain.eq).toHaveBeenCalledWith('status', 'todo');
      expect(chain.eq).toHaveBeenCalledWith('priority', 'high');
      expect(chain.eq).toHaveBeenCalledWith('assigned_to', 'user-5');
      expect(chain.ilike).toHaveBeenCalledWith('title', '%quarterly%');
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.list('org-1');

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
    it('should return task when found', async () => {
      // Arrange
      const task = createMockTask();
      const chain = mockSupabaseQuery(task);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.getById(task.id);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(task);
      }
      expect(chain.eq).toHaveBeenCalledWith('id', task.id);
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when task not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Row not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.getById('nonexistent');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Row not found');
      }
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('should create a task with required fields and defaults', async () => {
      // Arrange
      const newTask = createMockTask({ title: 'New task', status: 'todo' });
      const chain = mockSupabaseQuery(newTask);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.create('org-1', { title: 'New task' });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.title).toBe('New task');
      }
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          title: 'New task',
          description: null,
          priority: 'medium',
          assigned_to: null,
          assigned_by: null,
          due_date: null,
          source: 'manual',
          status: 'todo',
        }),
      );
      expect(chain.single).toHaveBeenCalled();
    });

    it('should create a task with all optional fields', async () => {
      // Arrange
      const newTask = createMockTask();
      const chain = mockSupabaseQuery(newTask);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.create('org-1', {
        title: 'Full task',
        description: 'A detailed description',
        priority: 'urgent',
        assigned_to: 'user-1',
        assigned_by: 'user-2',
        due_date: '2026-04-01',
        source: 'ai_suggested',
      });

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Full task',
          description: 'A detailed description',
          priority: 'urgent',
          assigned_to: 'user-1',
          assigned_by: 'user-2',
          due_date: '2026-04-01',
          source: 'ai_suggested',
        }),
      );
    });

    it('should return error when creation fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.create('org-1', { title: 'Fail' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Insert failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('should update a task and return the updated version', async () => {
      // Arrange
      const updated = createMockTask({ title: 'Updated' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.update('task-1', { title: 'Updated' });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.title).toBe('Updated');
      }
      expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.update('task-1', { title: 'X' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('should delete a task successfully', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.delete('task-1');

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'task-1');
    });

    it('should return error when delete fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Delete failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.delete('task-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Delete failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // assign
  // -----------------------------------------------------------------------
  describe('assign', () => {
    it('should delegate to update with assigned_to', async () => {
      // Arrange
      const updated = createMockTask({ assigned_to: 'user-42' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.assign('task-1', 'user-42');

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.update).toHaveBeenCalledWith({ assigned_to: 'user-42' });
    });
  });

  // -----------------------------------------------------------------------
  // updateStatus
  // -----------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update status without completed_at for non-done statuses', async () => {
      // Arrange
      const updated = createMockTask({ status: 'in_progress' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.updateStatus('task-1', 'in_progress');

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.update).toHaveBeenCalledWith({ status: 'in_progress' });
    });

    it('should set completed_at when status is done', async () => {
      // Arrange
      const updated = createMockTask({ status: 'done' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.updateStatus('task-1', 'done');

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'done',
          completed_at: expect.any(String),
        }),
      );
    });

    it('should return error when updateStatus fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Status update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await tasksService.updateStatus('task-1', 'done');

      // Assert
      expect(result.isOk).toBe(false);
    });
  });
});

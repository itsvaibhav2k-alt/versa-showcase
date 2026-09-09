import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================
// Hoisted mock variables
// ============================================================

const { mockInvokeWithTimeout } = vi.hoisted(() => {
  return { mockInvokeWithTimeout: vi.fn() };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
  invokeWithTimeout: mockInvokeWithTimeout,
}));

import { commandService } from '../command.service';
import type { CommandResponse } from '../command.service';

// ============================================================
// Helpers
// ============================================================

const USER_ID = '22222222-2222-2222-2222-222222222201';
const ORG_ID = '11111111-1111-1111-1111-111111111111';

// ============================================================
// Test suite
// ============================================================

describe('commandService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // processCommand
  // ----------------------------------------------------------
  describe('processCommand', () => {
    it('should return CommandResponse on success', async () => {
      // Arrange
      const commandResponse: CommandResponse = {
        message: 'Task created successfully',
        actions: [{ type: 'create_task', title: 'Review report' }],
      };
      mockInvokeWithTimeout.mockResolvedValue({
        data: commandResponse,
        error: null,
      });

      // Act
      const result = await commandService.processCommand('Create a task to review report', ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(commandResponse);
        expect(result.value.message).toBe('Task created successfully');
        expect(result.value.actions).toHaveLength(1);
      }
    });

    it('should pass correct params to invokeWithTimeout', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: { message: 'OK' },
        error: null,
      });

      // Act
      await commandService.processCommand('Schedule a meeting', ORG_ID, USER_ID);

      // Assert
      expect(mockInvokeWithTimeout).toHaveBeenCalledWith('process-command', {
        body: {
          text: 'Schedule a meeting',
          organization_id: ORG_ID,
          user_id: USER_ID,
        },
      });
    });

    it('should return error when invokeWithTimeout returns error', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Edge function timeout' },
      });

      // Act
      const result = await commandService.processCommand('Do something', ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Edge function timeout');
      }
    });

    it('should return error when invokeWithTimeout throws', async () => {
      // Arrange
      mockInvokeWithTimeout.mockRejectedValue(new Error('Network failure'));

      // Act
      const result = await commandService.processCommand('Do something', ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Network failure');
      }
    });

    it('should return fallback message when non-Error is thrown', async () => {
      // Arrange
      mockInvokeWithTimeout.mockRejectedValue('string error');

      // Act
      const result = await commandService.processCommand('Do something', ORG_ID, USER_ID);

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Unknown error processing command');
      }
    });
  });
});

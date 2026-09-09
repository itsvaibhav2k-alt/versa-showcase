import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery } from '@/src/test/helpers';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const { mockFrom, mockInvokeWithTimeout } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockInvokeWithTimeout: vi.fn(),
  };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {},
  },
  invokeWithTimeout: mockInvokeWithTimeout,
}));

import { integrationsService, type Integration } from '../integrations.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    id: 'int-001',
    user_id: 'user-1',
    organization_id: 'org-1',
    provider: 'google_calendar',
    account_email: 'user@gmail.com',
    is_active: true,
    last_synced_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('integrationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------
  describe('list', () => {
    it('should return active integrations for a user', async () => {
      // Arrange
      const integrations = [
        createMockIntegration(),
        createMockIntegration({ id: 'int-002', provider: 'outlook_calendar' }),
      ];
      const chain = mockSupabaseQuery(integrations);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.list('user-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toEqual(integrations);
      }
      expect(mockFrom).toHaveBeenCalledWith('integrations');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty list when user has no active integrations', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.list('user-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Permission denied' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.list('user-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Permission denied');
      }
    });
  });

  // -----------------------------------------------------------------------
  // upsert
  // -----------------------------------------------------------------------
  describe('upsert', () => {
    it('should create or update an integration with token data', async () => {
      // Arrange
      const integration = createMockIntegration();
      const chain = mockSupabaseQuery(integration);
      mockFrom.mockReturnValue(chain);

      const tokens = {
        access_token: 'access-tok',
        refresh_token: 'refresh-tok',
        expires_in: 3600,
        email: 'user@gmail.com',
      };

      // Act
      const result = await integrationsService.upsert(
        'user-1',
        'org-1',
        'google_calendar',
        tokens,
      );

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(integration);
      }
      expect(mockFrom).toHaveBeenCalledWith('integrations');
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          organization_id: 'org-1',
          provider: 'google_calendar',
          access_token: 'access-tok',
          refresh_token: 'refresh-tok',
          account_email: 'user@gmail.com',
          is_active: true,
          scope: 'calendar.readonly,userinfo.email',
        }),
        { onConflict: 'user_id,provider' },
      );
      expect(chain.single).toHaveBeenCalled();
    });

    it('should compute token_expires_at from expires_in', async () => {
      // Arrange
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const integration = createMockIntegration();
      const chain = mockSupabaseQuery(integration);
      mockFrom.mockReturnValue(chain);

      const tokens = {
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 7200,
        email: 'a@b.com',
      };

      // Act
      await integrationsService.upsert('user-1', 'org-1', 'google_calendar', tokens);

      // Assert
      const expectedExpiry = new Date(now + 7200 * 1000).toISOString();
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          token_expires_at: expectedExpiry,
        }),
        expect.anything(),
      );

      vi.restoreAllMocks();
    });

    it('should return error when upsert fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Upsert failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.upsert(
        'user-1',
        'org-1',
        'google_calendar',
        { access_token: 'a', refresh_token: 'r', expires_in: 3600, email: 'e@x.com' },
      );

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Upsert failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // disconnect
  // -----------------------------------------------------------------------
  describe('disconnect', () => {
    it('should deactivate integration by setting is_active to false', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.disconnect('user-1', 'google_calendar');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('integrations');
      expect(chain.update).toHaveBeenCalledWith({ is_active: false });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).toHaveBeenCalledWith('provider', 'google_calendar');
    });

    it('should return error when disconnect fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Disconnect failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await integrationsService.disconnect('user-1', 'google_calendar');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Disconnect failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // triggerSync
  // -----------------------------------------------------------------------
  describe('triggerSync', () => {
    it('should invoke the sync edge function and return synced count', async () => {
      // Arrange
      const syncResult = { synced_count: 15 };
      mockInvokeWithTimeout.mockResolvedValue({ data: syncResult, error: null });

      // Act
      const result = await integrationsService.triggerSync('int-001');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual({ synced_count: 15 });
      }
      expect(mockInvokeWithTimeout).toHaveBeenCalledWith('sync-google-calendar', {
        body: { integration_id: 'int-001' },
      });
    });

    it('should return error when edge function fails', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Function invocation failed' },
      });

      // Act
      const result = await integrationsService.triggerSync('int-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Function invocation failed');
      }
    });

    it('should return error when network call to edge function rejects', async () => {
      // Arrange
      mockInvokeWithTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Network timeout' },
      });

      // Act
      const result = await integrationsService.triggerSync('int-bad');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Network timeout');
      }
    });
  });
});

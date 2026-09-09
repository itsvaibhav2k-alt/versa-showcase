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

import { eventsService } from '../events.service';
import type { CalendarEvent } from '@/src/types/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'evt-001',
    organization_id: 'org-1',
    user_id: 'user-1',
    title: 'Team Standup',
    description: 'Daily sync',
    location: 'Zoom',
    start_time: '2026-03-18T09:00:00Z',
    end_time: '2026-03-18T09:30:00Z',
    is_all_day: false,
    recurrence_rule: null,
    external_id: null,
    external_source: null,
    attendees: [{ email: 'raj@contoso.com', name: 'Raj', status: 'accepted' }],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('eventsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // listByDateRange
  // -----------------------------------------------------------------------
  describe('listByDateRange', () => {
    it('should return events for a given date range', async () => {
      // Arrange
      const events = [
        createMockEvent(),
        createMockEvent({ id: 'evt-002', title: 'Lunch Meeting' }),
      ];
      const chain = mockSupabaseQuery(events);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.listByDateRange(
        'org-1',
        '2026-03-18T00:00:00Z',
        '2026-03-18T23:59:59Z',
      );

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toEqual(events);
      }
    });

    it('should query the calendar_events table', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await eventsService.listByDateRange('org-1', '2026-03-18T00:00:00Z', '2026-03-18T23:59:59Z');

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    });

    it('should filter by organization_id', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await eventsService.listByDateRange('org-42', '2026-03-18T00:00:00Z', '2026-03-18T23:59:59Z');

      // Assert
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-42');
    });

    it('should filter with gte on start param and lte on end param', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await eventsService.listByDateRange(
        'org-1',
        '2026-03-01T00:00:00Z',
        '2026-03-31T23:59:59Z',
      );

      // Assert
      expect(chain.gte).toHaveBeenCalledWith('start_time', '2026-03-01T00:00:00Z');
      expect(chain.lte).toHaveBeenCalledWith('start_time', '2026-03-31T23:59:59Z');
    });

    it('should order results by start_time ascending', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      await eventsService.listByDateRange('org-1', '2026-03-18T00:00:00Z', '2026-03-18T23:59:59Z');

      // Assert
      expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: true });
    });

    it('should return empty array when no events exist', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.listByDateRange(
        'org-1',
        '2026-03-18T00:00:00Z',
        '2026-03-18T23:59:59Z',
      );

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
      const result = await eventsService.listByDateRange(
        'org-1',
        '2026-03-18T00:00:00Z',
        '2026-03-18T23:59:59Z',
      );

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getToday
  // -----------------------------------------------------------------------
  describe('getToday', () => {
    it('should return today\'s events for a user', async () => {
      // Arrange
      const events = [createMockEvent()];
      const chain = mockSupabaseQuery(events);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.getToday('org-1', 'user-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(events);
      }
      expect(mockFrom).toHaveBeenCalledWith('calendar_events');
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: true });
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Connection lost' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.getToday('org-1', 'user-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Connection lost');
      }
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('should create an event with required fields and defaults', async () => {
      // Arrange
      const newEvent = createMockEvent();
      const chain = mockSupabaseQuery(newEvent);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.create('org-1', 'user-1', {
        title: 'Team Standup',
        start_time: '2026-03-18T09:00:00Z',
        end_time: '2026-03-18T09:30:00Z',
      });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(newEvent);
      }
      expect(mockFrom).toHaveBeenCalledWith('calendar_events');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          user_id: 'user-1',
          title: 'Team Standup',
          description: null,
          location: null,
          start_time: '2026-03-18T09:00:00Z',
          end_time: '2026-03-18T09:30:00Z',
          is_all_day: false,
          attendees: [],
        }),
      );
      expect(chain.single).toHaveBeenCalled();
    });

    it('should create an event with all optional fields', async () => {
      // Arrange
      const newEvent = createMockEvent();
      const chain = mockSupabaseQuery(newEvent);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.create('org-1', 'user-1', {
        title: 'Board Meeting',
        description: 'Quarterly review',
        location: 'Conference Room A',
        start_time: '2026-03-20T14:00:00Z',
        end_time: '2026-03-20T16:00:00Z',
        is_all_day: false,
        attendees: [{ email: 'cfo@contoso.com', name: 'CFO', status: 'pending' }],
      });

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Quarterly review',
          location: 'Conference Room A',
          is_all_day: false,
          attendees: [{ email: 'cfo@contoso.com', name: 'CFO', status: 'pending' }],
        }),
      );
    });

    it('should return error when creation fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.create('org-1', 'user-1', {
        title: 'Fail event',
        start_time: '2026-03-18T09:00:00Z',
        end_time: '2026-03-18T09:30:00Z',
      });

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
    it('should update an event and return the updated version', async () => {
      // Arrange
      const updated = createMockEvent({ title: 'Updated Standup' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.update('evt-001', { title: 'Updated Standup' });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.title).toBe('Updated Standup');
      }
      expect(mockFrom).toHaveBeenCalledWith('calendar_events');
      expect(chain.update).toHaveBeenCalledWith({ title: 'Updated Standup' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'evt-001');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await eventsService.update('evt-001', { title: 'X' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });
});

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
    functions: { invoke: vi.fn() },
  },
}));

import { searchService } from '../search.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock chain that also includes the `or` method (needed for call_logs).
 * Extends the standard mockSupabaseQuery chain.
 */
function mockSearchQuery(returnData: unknown, returnError: { message: string } | null = null) {
  const chain = mockSupabaseQuery(returnData, returnError);
  chain.or = vi.fn().mockReturnValue(chain);
  return chain;
}

// Sample data ---

const mockTasks = [
  { id: 'task-1', title: 'Review Q4 report', status: 'todo', priority: 'urgent' },
  { id: 'task-2', title: 'Review budget', status: 'in_progress', priority: 'high' },
];

const mockCallLogs = [
  {
    id: 'call-1',
    caller_name: 'Priya Sharma',
    caller_phone: '+91 98765 43211',
    status: 'completed',
    summary: 'Discussed Q4 review',
  },
];

const mockEmails = [
  {
    id: 'email-1',
    subject: 'Q4 Returns & Portfolio Review',
    from_address: 'investor@acmecapital.com',
    classification: 'action_required',
  },
];

const mockTeamMembers = [
  { id: 'tm-1', user: { full_name: 'Priya Sharma' }, title: 'VP Engineering' },
  { id: 'tm-2', user: { full_name: 'Raj Patel' }, title: 'CTO' },
];

/**
 * Sets up mockFrom to return a different chain per table.
 * Each table gets its own mockSearchQuery with the specified data/error.
 */
function setupMockFrom(config: {
  tasks?: { data: unknown; error?: { message: string } | null };
  call_logs?: { data: unknown; error?: { message: string } | null };
  emails?: { data: unknown; error?: { message: string } | null };
  team_members?: { data: unknown; error?: { message: string } | null };
}) {
  const chains: Record<string, ReturnType<typeof mockSearchQuery>> = {
    tasks: mockSearchQuery(
      config.tasks?.data ?? [],
      config.tasks?.error ?? null,
    ),
    call_logs: mockSearchQuery(
      config.call_logs?.data ?? [],
      config.call_logs?.error ?? null,
    ),
    emails: mockSearchQuery(
      config.emails?.data ?? [],
      config.emails?.error ?? null,
    ),
    team_members: mockSearchQuery(
      config.team_members?.data ?? [],
      config.team_members?.error ?? null,
    ),
  };

  mockFrom.mockImplementation((table: string) => chains[table]);

  return chains;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // search
  // -----------------------------------------------------------------------
  describe('search', () => {
    it('should return results from all 4 tables when query matches', async () => {
      // Arrange
      const chains = setupMockFrom({
        tasks: { data: mockTasks },
        call_logs: { data: mockCallLogs },
        emails: { data: mockEmails },
        team_members: { data: mockTeamMembers },
      });

      // Act
      const result = await searchService.search('org-1', 'Priya');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.tasks).toEqual(mockTasks);
        expect(result.value.callLogs).toEqual(mockCallLogs);
        expect(result.value.emails).toEqual(mockEmails);
        // team_members are filtered client-side by full_name match
        expect(result.value.teamMembers).toEqual([
          { id: 'tm-1', user: { full_name: 'Priya Sharma' }, title: 'VP Engineering' },
        ]);
      }

      // Verify all 4 tables were queried
      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(mockFrom).toHaveBeenCalledWith('call_logs');
      expect(mockFrom).toHaveBeenCalledWith('emails');
      expect(mockFrom).toHaveBeenCalledWith('team_members');

      // Verify organization_id filter on each chain
      expect(chains.tasks.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chains.call_logs.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chains.emails.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chains.team_members.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('should return empty arrays when nothing matches', async () => {
      // Arrange
      setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      const result = await searchService.search('org-1', 'xyznonexistent');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.tasks).toEqual([]);
        expect(result.value.callLogs).toEqual([]);
        expect(result.value.emails).toEqual([]);
        expect(result.value.teamMembers).toEqual([]);
      }
    });

    it('should return error when Supabase query fails', async () => {
      // Arrange — tasks query fails
      setupMockFrom({
        tasks: { data: null, error: { message: 'Database error' } },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      const result = await searchService.search('org-1', 'test');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });

    it('should filter by organization_id', async () => {
      // Arrange
      const chains = setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      await searchService.search('org-42', 'test');

      // Assert — each table query should filter by the provided org ID
      expect(chains.tasks.eq).toHaveBeenCalledWith('organization_id', 'org-42');
      expect(chains.call_logs.eq).toHaveBeenCalledWith('organization_id', 'org-42');
      expect(chains.emails.eq).toHaveBeenCalledWith('organization_id', 'org-42');
      expect(chains.team_members.eq).toHaveBeenCalledWith('organization_id', 'org-42');
    });

    it('should handle partial matches (ilike pattern)', async () => {
      // Arrange
      const chains = setupMockFrom({
        tasks: { data: mockTasks },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      await searchService.search('org-1', 'review');

      // Assert — tasks and emails use ilike with %query% pattern
      expect(chains.tasks.ilike).toHaveBeenCalledWith('title', '%review%');
      expect(chains.emails.ilike).toHaveBeenCalledWith('subject', '%review%');

      // call_logs use .or() with ilike patterns
      expect(chains.call_logs.or).toHaveBeenCalledWith(
        'caller_name.ilike.%review%,caller_phone.ilike.%review%',
      );

      // team_members don't use ilike — they filter client-side
      expect(chains.team_members.ilike).not.toHaveBeenCalled();
    });

    it('should return error when call_logs query fails', async () => {
      // Arrange
      setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: null, error: { message: 'Call logs fetch failed' } },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      const result = await searchService.search('org-1', 'test');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Call logs fetch failed');
      }
    });

    it('should return error when emails query fails', async () => {
      // Arrange
      setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: null, error: { message: 'Email query error' } },
        team_members: { data: [] },
      });

      // Act
      const result = await searchService.search('org-1', 'test');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Email query error');
      }
    });

    it('should return error when team_members query fails', async () => {
      // Arrange
      setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: null, error: { message: 'Team fetch failed' } },
      });

      // Act
      const result = await searchService.search('org-1', 'test');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Team fetch failed');
      }
    });

    it('should filter team members client-side by full_name', async () => {
      // Arrange — team_members returns multiple, only one matches query
      const allMembers = [
        { id: 'tm-1', user: { full_name: 'Priya Sharma' }, title: 'VP Engineering' },
        { id: 'tm-2', user: { full_name: 'Raj Patel' }, title: 'CTO' },
        { id: 'tm-3', user: { full_name: 'Ananya Priya' }, title: 'Designer' },
        { id: 'tm-4', user: null, title: 'Vacant' },
      ];
      setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: allMembers },
      });

      // Act
      const result = await searchService.search('org-1', 'priya');

      // Assert — case-insensitive match on full_name
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.teamMembers).toHaveLength(2);
        expect(result.value.teamMembers[0].id).toBe('tm-1');
        expect(result.value.teamMembers[1].id).toBe('tm-3');
      }
    });

    it('should apply limit and order on tasks query', async () => {
      // Arrange
      const chains = setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      await searchService.search('org-1', 'test');

      // Assert
      expect(chains.tasks.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(chains.tasks.limit).toHaveBeenCalledWith(10);
      expect(chains.call_logs.order).toHaveBeenCalledWith('started_at', { ascending: false });
      expect(chains.call_logs.limit).toHaveBeenCalledWith(10);
      expect(chains.emails.order).toHaveBeenCalledWith('received_at', { ascending: false });
      expect(chains.emails.limit).toHaveBeenCalledWith(10);
    });

    it('should check is_active on team_members query', async () => {
      // Arrange
      const chains = setupMockFrom({
        tasks: { data: [] },
        call_logs: { data: [] },
        emails: { data: [] },
        team_members: { data: [] },
      });

      // Act
      await searchService.search('org-1', 'test');

      // Assert
      expect(chains.team_members.eq).toHaveBeenCalledWith('is_active', true);
    });
  });
});

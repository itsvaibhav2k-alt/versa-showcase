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
  invokeWithTimeout: vi.fn(),
}));

import { teamService } from '../team.service';

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function createMockTeamMember(overrides = {}) {
  return {
    id: 'tm-001',
    organization_id: 'org-1',
    user_id: 'user-1',
    title: 'CTO',
    department: 'Engineering',
    skills: ['TypeScript', 'React'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 'user-1', full_name: 'Jane Doe', email: 'jane@example.com', avatar_url: null },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // listMembers
  // -----------------------------------------------------------------------
  describe('listMembers', () => {
    it('should return team members for a given organization', async () => {
      // Arrange
      const members = [
        createMockTeamMember(),
        createMockTeamMember({ id: 'tm-002', user_id: 'user-2', title: 'VP Design' }),
      ];
      const chain = mockSupabaseQuery(members);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.listMembers('org-1');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(members);
        expect(result.value).toHaveLength(2);
      }
      expect(mockFrom).toHaveBeenCalledWith('team_members');
      expect(chain.select).toHaveBeenCalledWith('*, user:users!team_members_user_id_fkey(*)');
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should return empty array when no members exist', async () => {
      // Arrange
      const chain = mockSupabaseQuery([]);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.listMembers('org-empty');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual([]);
        expect(result.value).toHaveLength(0);
      }
    });

    it('should return error when query fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Database error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.listMembers('org-1');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getMember
  // -----------------------------------------------------------------------
  describe('getMember', () => {
    it('should return a team member when found', async () => {
      // Arrange
      const member = createMockTeamMember();
      const chain = mockSupabaseQuery(member);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.getMember('tm-001');

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(member);
      }
      expect(mockFrom).toHaveBeenCalledWith('team_members');
      expect(chain.select).toHaveBeenCalledWith('*, user:users!team_members_user_id_fkey(*)');
      expect(chain.eq).toHaveBeenCalledWith('id', 'tm-001');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when member not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Row not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.getMember('nonexistent');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Row not found');
      }
    });
  });

  // -----------------------------------------------------------------------
  // createMember
  // -----------------------------------------------------------------------
  describe('createMember', () => {
    it('should create a member with all fields provided', async () => {
      // Arrange
      const newMember = createMockTeamMember();
      const chain = mockSupabaseQuery(newMember);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.createMember('org-1', {
        user_id: 'user-1',
        title: 'CTO',
        department: 'Engineering',
      });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(newMember);
      }
      expect(mockFrom).toHaveBeenCalledWith('team_members');
      expect(chain.insert).toHaveBeenCalledWith({
        organization_id: 'org-1',
        user_id: 'user-1',
        title: 'CTO',
        department: 'Engineering',
      });
      expect(chain.select).toHaveBeenCalledWith('*, user:users!team_members_user_id_fkey(*)');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should create a member with optional fields as null', async () => {
      // Arrange
      const newMember = createMockTeamMember({ title: null, department: null });
      const chain = mockSupabaseQuery(newMember);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.createMember('org-1', {
        user_id: 'user-1',
      });

      // Assert
      expect(result.isOk).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith({
        organization_id: 'org-1',
        user_id: 'user-1',
        title: null,
        department: null,
      });
    });

    it('should return error when creation fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.createMember('org-1', { user_id: 'user-1' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Insert failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // updateMember
  // -----------------------------------------------------------------------
  describe('updateMember', () => {
    it('should update a member and return the updated version', async () => {
      // Arrange
      const updated = createMockTeamMember({ title: 'VP Engineering' });
      const chain = mockSupabaseQuery(updated);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.updateMember('tm-001', { title: 'VP Engineering' });

      // Assert
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.title).toBe('VP Engineering');
      }
      expect(mockFrom).toHaveBeenCalledWith('team_members');
      expect(chain.update).toHaveBeenCalledWith({ title: 'VP Engineering' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'tm-001');
      expect(chain.select).toHaveBeenCalledWith('*, user:users!team_members_user_id_fkey(*)');
      expect(chain.single).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.updateMember('tm-001', { title: 'X' });

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Update failed');
      }
    });
  });

  // -----------------------------------------------------------------------
  // removeMember
  // -----------------------------------------------------------------------
  describe('removeMember', () => {
    it('should soft-delete a member by setting is_active to false', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.removeMember('tm-001');

      // Assert
      expect(result.isOk).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('team_members');
      expect(chain.update).toHaveBeenCalledWith({ is_active: false });
      expect(chain.eq).toHaveBeenCalledWith('id', 'tm-001');
    });

    it('should return error when remove fails', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Remove failed' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await teamService.removeMember('tm-001');

      // Assert
      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBe('Remove failed');
      }
    });
  });
});

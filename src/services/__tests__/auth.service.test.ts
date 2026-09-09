import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockUser, createMockOrganization, mockSupabaseQuery } from '@/src/test/helpers';

// ---------------------------------------------------------------------------
// Hoisted mock variables (available before vi.mock factory runs)
// ---------------------------------------------------------------------------

const { mockFrom, mockAuth, mockStoreState } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  };
  const mockStoreState = {
    setSession: vi.fn(),
    setUser: vi.fn(),
    setOrganization: vi.fn(),
    setLoading: vi.fn(),
    setInitialized: vi.fn(),
    reset: vi.fn(),
  };
  return { mockFrom, mockAuth, mockStoreState };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: mockAuth,
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/src/stores/auth-store', () => ({
  useAuthStore: {
    getState: vi.fn(() => mockStoreState),
  },
}));

import { authService } from '../auth.service';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // signIn
  // -----------------------------------------------------------------------
  describe('signIn', () => {
    it('should return data when credentials are valid', async () => {
      // Arrange
      const mockData = { user: { id: 'u1' }, session: { access_token: 'tok' } };
      mockAuth.signInWithPassword.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error when credentials are invalid', async () => {
      // Arrange
      const authError = { message: 'Invalid login credentials', status: 400 };
      mockAuth.signInWithPassword.mockResolvedValue({ data: null, error: authError });

      // Act & Assert
      await expect(authService.signIn('bad@example.com', 'wrong'))
        .rejects.toEqual(authError);
    });
  });

  // -----------------------------------------------------------------------
  // signUp
  // -----------------------------------------------------------------------
  describe('signUp', () => {
    it('should create auth user, organization, and user row on success', async () => {
      // Arrange
      const mockUser = { id: 'new-user-id', email: 'new@example.com' };
      const mockOrg = { id: 'org-123', name: 'My Org', slug: 'my-org' };
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const orgChain = mockSupabaseQuery(mockOrg);
      const userChain = mockSupabaseQuery(null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? orgChain : userChain;
      });

      // Act
      const result = await authService.signUp(
        'new@example.com',
        'pass123',
        'John Doe',
        'My Org',
      );

      // Assert
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'pass123',
        options: { data: { full_name: 'John Doe' } },
      });
      expect(mockFrom).toHaveBeenCalledWith('organizations');
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual({ user: mockUser, session: null });
    });

    it('should throw error when auth signUp fails', async () => {
      // Arrange
      const authError = { message: 'Email already registered' };
      mockAuth.signUp.mockResolvedValue({ data: { user: null }, error: authError });

      // Act & Assert
      await expect(
        authService.signUp('dup@example.com', 'pass', 'Jane', 'Org'),
      ).rejects.toEqual(authError);
    });

    it('should throw error when organization creation fails', async () => {
      // Arrange
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });
      const orgChain = mockSupabaseQuery(null, { message: 'Org insert failed' });
      mockFrom.mockReturnValue(orgChain);

      // Act & Assert
      await expect(
        authService.signUp('a@b.com', 'p', 'Name', 'Org'),
      ).rejects.toEqual({ message: 'Org insert failed' });
    });

    it('should throw error when user row creation fails', async () => {
      // Arrange
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });
      const orgChain = mockSupabaseQuery({ id: 'org-1', name: 'Org' });
      const userChain = mockSupabaseQuery(null, { message: 'User insert failed' });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? orgChain : userChain;
      });

      // Act & Assert
      await expect(
        authService.signUp('a@b.com', 'p', 'Name', 'Org'),
      ).rejects.toEqual({ message: 'User insert failed' });
    });

    it('should return authData without creating org/user when auth user is null', async () => {
      // Arrange
      mockAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act
      const result = await authService.signUp('a@b.com', 'p', 'Name', 'Org');

      // Assert
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({ user: null, session: null });
    });
  });

  // -----------------------------------------------------------------------
  // signOut
  // -----------------------------------------------------------------------
  describe('signOut', () => {
    it('should sign out and reset store on success', async () => {
      // Arrange
      mockAuth.signOut.mockResolvedValue({ error: null });

      // Act
      await authService.signOut();

      // Assert
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(mockStoreState.reset).toHaveBeenCalled();
    });

    it('should throw error when signOut fails', async () => {
      // Arrange
      const error = { message: 'Network error' };
      mockAuth.signOut.mockResolvedValue({ error });

      // Act & Assert
      await expect(authService.signOut()).rejects.toEqual(error);
      expect(mockStoreState.reset).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // forgotPassword
  // -----------------------------------------------------------------------
  describe('forgotPassword', () => {
    it('should call resetPasswordForEmail on success', async () => {
      // Arrange
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      // Act
      await authService.forgotPassword('test@example.com');

      // Assert
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'versa://reset-password' },
      );
    });

    it('should throw error when reset fails', async () => {
      // Arrange
      const error = { message: 'User not found' };
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error });

      // Act & Assert
      await expect(authService.forgotPassword('x@x.com')).rejects.toEqual(error);
    });
  });

  // -----------------------------------------------------------------------
  // fetchUserProfile
  // -----------------------------------------------------------------------
  describe('fetchUserProfile', () => {
    it('should return user when found', async () => {
      // Arrange
      const user = createMockUser();
      const chain = mockSupabaseQuery(user);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchUserProfile(user.id);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchUserProfile('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Connection error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchUserProfile('any-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // fetchOrganization
  // -----------------------------------------------------------------------
  describe('fetchOrganization', () => {
    it('should return organization when found', async () => {
      // Arrange
      const org = createMockOrganization();
      const chain = mockSupabaseQuery(org);
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchOrganization(org.id);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('organizations');
      expect(result).toEqual(org);
    });

    it('should return null when organization is not found', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'Not found' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchOrganization('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      // Arrange
      const chain = mockSupabaseQuery(null, { message: 'DB error' });
      mockFrom.mockReturnValue(chain);

      // Act
      const result = await authService.fetchOrganization('any-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // initializeAuth
  // -----------------------------------------------------------------------
  describe('initializeAuth', () => {
    it('should set user and organization when session exists', async () => {
      // Arrange
      const user = createMockUser();
      const org = createMockOrganization();
      const session = { user: { id: user.id }, access_token: 'tok' };
      mockAuth.getSession.mockResolvedValue({ data: { session } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSupabaseQuery(user);
        return mockSupabaseQuery(org);
      });

      // Act
      await authService.initializeAuth();

      // Assert
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(true);
      expect(mockStoreState.setSession).toHaveBeenCalledWith(session);
      expect(mockStoreState.setUser).toHaveBeenCalledWith(user);
      expect(mockStoreState.setOrganization).toHaveBeenCalledWith(org);
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
      expect(mockStoreState.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should reset and sign out when user profile not found', async () => {
      // Arrange
      const session = { user: { id: 'missing-user' }, access_token: 'tok' };
      mockAuth.getSession.mockResolvedValue({ data: { session } });
      mockAuth.signOut.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(mockSupabaseQuery(null, { message: 'Not found' }));

      // Act
      await authService.initializeAuth();

      // Assert
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(mockStoreState.reset).toHaveBeenCalled();
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
      expect(mockStoreState.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should only set session when no active session', async () => {
      // Arrange
      mockAuth.getSession.mockResolvedValue({ data: { session: null } });

      // Act
      await authService.initializeAuth();

      // Assert
      expect(mockStoreState.setSession).toHaveBeenCalledWith(null);
      expect(mockStoreState.setUser).not.toHaveBeenCalled();
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
      expect(mockStoreState.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should reset store on network error', async () => {
      // Arrange
      mockAuth.getSession.mockRejectedValue(new Error('Network unreachable'));

      // Act
      await authService.initializeAuth();

      // Assert
      expect(mockStoreState.reset).toHaveBeenCalled();
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
      expect(mockStoreState.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should skip org fetch when user has no organization_id', async () => {
      // Arrange
      const user = createMockUser();
      (user as unknown as Record<string, unknown>).organization_id = null;
      const session = { user: { id: user.id }, access_token: 'tok' };
      mockAuth.getSession.mockResolvedValue({ data: { session } });
      mockFrom.mockReturnValue(mockSupabaseQuery(user));

      // Act
      await authService.initializeAuth();

      // Assert
      expect(mockStoreState.setUser).toHaveBeenCalledWith(user);
      expect(mockStoreState.setOrganization).not.toHaveBeenCalled();
    });
  });
});

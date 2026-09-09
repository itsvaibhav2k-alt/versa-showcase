import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================
// Mocks
// ============================================================

const mockInsert = vi.fn().mockReturnValue({
  then: (resolve: (v: unknown) => void) =>
    Promise.resolve({ error: null }).then(resolve),
});
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

let mockBaseUrl = 'https://n8n.example.com/webhook';
let mockAuthToken = 'test-token';

vi.mock('@/src/lib/constants', () => ({
  get N8N_WEBHOOK_BASE_URL() {
    return mockBaseUrl;
  },
  get N8N_AUTH_TOKEN() {
    return mockAuthToken;
  },
}));

// Spy on global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { webhookService } from '@/src/services/webhook.service';

describe('webhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaseUrl = 'https://n8n.example.com/webhook';
    mockAuthToken = 'test-token';
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  // ============================================================
  // Endpoint construction
  // ============================================================
  describe('endpoint construction', () => {
    it('should call the correct URL for triggerPostCallProcessing', async () => {
      await webhookService.triggerPostCallProcessing({
        call_log_id: 'call-1',
        user_id: 'user-1',
        organization_id: 'org-1',
        caller_phone: '+1234567890',
        duration_seconds: 120,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/retell-call-completed',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should strip trailing slash from base URL', async () => {
      mockBaseUrl = 'https://n8n.example.com/webhook/';

      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/generate-briefing',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call the correct URL for triggerNotification', async () => {
      await webhookService.triggerNotification({
        event_type: 'task_overdue',
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/notification-route',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call the correct URL for triggerBriefing', async () => {
      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/generate-briefing',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call the correct URL for triggerSendEmail', async () => {
      await webhookService.triggerSendEmail({
        to_email: 'recipient@example.com',
        intent: 'follow_up',
        context: 'Q4 review discussion',
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/send-email',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // ============================================================
  // Payload mapping
  // ============================================================
  describe('payload mapping', () => {
    it('should map triggerPostCallProcessing payload correctly', async () => {
      await webhookService.triggerPostCallProcessing({
        call_log_id: 'call-1',
        user_id: 'user-1',
        organization_id: 'org-1',
        caller_name: 'Priya',
        caller_phone: '+91 98765 43211',
        transcript: 'Hello world',
        duration_seconds: 60,
        recording_url: 'https://recording.url',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.call_id).toBe('call-1');
      expect(body.from_name).toBe('Priya');
      expect(body.from_number).toBe('+91 98765 43211');
      expect(body.transcript).toBe('Hello world');
      expect(body.duration_ms).toBe(60000);
      expect(body.recording_url).toBe('https://recording.url');
      expect(body.metadata.organization_id).toBe('org-1');
      expect(body.metadata.user_id).toBe('user-1');
    });

    it('should set recording_url to null when not provided', async () => {
      await webhookService.triggerPostCallProcessing({
        call_log_id: 'call-1',
        user_id: 'user-1',
        organization_id: 'org-1',
        caller_phone: '+1234567890',
        duration_seconds: 30,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.recording_url).toBeNull();
    });

    it('should include Authorization header when N8N_AUTH_TOKEN is set', async () => {
      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should omit Authorization header when N8N_AUTH_TOKEN is empty', async () => {
      mockAuthToken = '';

      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should send Content-Type application/json', async () => {
      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  // ============================================================
  // Workflow triggering
  // ============================================================
  describe('workflow triggering', () => {
    it('should return the fetch response on success', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(result).toBe(mockResponse);
    });

    it('should return null when N8N_WEBHOOK_BASE_URL is empty', async () => {
      mockBaseUrl = '';

      const result = await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Error handling
  // ============================================================
  describe('error handling', () => {
    it('should log webhook error to app_events on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      await webhookService.triggerNotification({
        event_type: 'missed_call',
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      // Should log to app_events
      expect(mockFrom).toHaveBeenCalledWith('app_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'webhook_error',
          source_workflow: 'notification-route',
        }),
      );
    });

    it('should retry once on 500 server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      // fetch should be called twice (initial + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ok: true, status: 200 });
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 422 });

      await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return null when fetch throws and all retries exhausted', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(result).toBeNull();
    });

    it('should retry on fetch exception before giving up', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await webhookService.triggerBriefing({
        user_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ok: true, status: 200 });
    });
  });
});

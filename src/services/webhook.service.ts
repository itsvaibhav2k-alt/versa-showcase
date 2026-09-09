import { supabase } from '@/src/lib/supabase';
import { N8N_WEBHOOK_BASE_URL, N8N_AUTH_TOKEN } from '@/src/lib/constants';

/**
 * Resolves the organization_id from a webhook payload.
 * Handles both top-level and nested (metadata) organization_id.
 */
function resolveOrgId(payload: Record<string, unknown>): string | undefined {
  return (
    (payload.organization_id as string) ||
    (payload.org_id as string) ||
    ((payload.metadata as Record<string, unknown>)?.organization_id as string) ||
    undefined
  );
}

const callWebhook = async (
  path: string,
  payload: Record<string, unknown>,
  retries = 1,
): Promise<Response | null> => {
  if (!N8N_WEBHOOK_BASE_URL) return null;

  const base = N8N_WEBHOOK_BASE_URL.replace(/\/+$/, '');
  const url = `${base}/${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_AUTH_TOKEN ? { Authorization: `Bearer ${N8N_AUTH_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`n8n webhook ${path} failed: ${response.status}`);
        // Retry on server errors (5xx), not on client errors (4xx)
        if (response.status >= 500 && attempt < retries) {
          continue;
        }
        supabase.from('app_events').insert({
          organization_id: resolveOrgId(payload),
          event_type: 'webhook_error',
          source_workflow: path,
          payload: { path, status: response.status, attempt },
        }).then(({ error }) => {
          if (error) console.warn('Failed to log webhook error:', error);
        });
      }

      return response;
    } catch (error) {
      if (attempt === retries) {
        console.warn(`n8n webhook ${path} error:`, error);
        return null;
      }
    }
  }
  return null;
};

export const webhookService = {
  triggerPostCallProcessing(payload: {
    call_log_id: string;
    user_id: string;
    organization_id: string;
    caller_name?: string | null;
    caller_phone: string;
    transcript?: string | null;
    duration_seconds: number;
    recording_url?: string;
  }) {
    return callWebhook('retell-call-completed', {
      call_id: payload.call_log_id,
      from_name: payload.caller_name,
      from_number: payload.caller_phone,
      transcript: payload.transcript,
      duration_ms: payload.duration_seconds * 1000,
      recording_url: payload.recording_url ?? null,
      metadata: {
        organization_id: payload.organization_id,
        user_id: payload.user_id,
      },
    });
  },

  triggerNotification(payload: {
    event_type: 'task_overdue' | 'meeting_reminder' | 'follow_up_due' | 'missed_call';
    user_id: string;
    organization_id: string;
    reference_id?: string;
    reference_type?: string;
    metadata?: Record<string, unknown>;
  }) {
    return callWebhook('notification-route', payload);
  },

  triggerBriefing(payload: {
    user_id: string;
    organization_id: string;
  }) {
    return callWebhook('generate-briefing', payload);
  },

  triggerSendEmail(payload: {
    to_email: string;
    to_name?: string;
    intent: string;
    context: string;
    user_id: string;
    organization_id: string;
    reply_to_id?: string;
  }) {
    return callWebhook('send-email', payload);
  },
};

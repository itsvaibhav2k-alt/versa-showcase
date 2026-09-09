import { vi } from 'vitest';
import type { User, Organization, Task, CallLog, Email, Reminder, Notification } from '@/src/types/models';

// ============================================================
// Mock Supabase Client Factory
// ============================================================

export function createMockSupabaseClient() {
  return (globalThis as Record<string, unknown>).__createMockSupabaseClient as () => ReturnType<typeof import('@supabase/supabase-js').createClient>;
}

// ============================================================
// Factory Functions
// ============================================================

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: '22222222-2222-2222-2222-222222222201',
    organization_id: '11111111-1111-1111-1111-111111111111',
    email: 'satya@contoso.com',
    full_name: 'Satya Nadella',
    avatar_url: null,
    phone: '+91 98765 43210',
    role: 'owner',
    timezone: 'Asia/Kolkata',
    notification_preferences: {
      push_enabled: true,
      email_enabled: true,
      digest_time: '07:00',
      quiet_hours_start: '23:00',
      quiet_hours_end: '06:00',
    },
    expo_push_token: null,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Contoso Corp',
    slug: 'contoso-corp',
    logo_url: null,
    plan: 'pro',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '33333333-3333-3333-3333-333333333301',
    organization_id: '11111111-1111-1111-1111-111111111111',
    title: 'Review Q4 financial report',
    description: 'Review the Q4 financial report.',
    status: 'todo',
    priority: 'urgent',
    assigned_to: '22222222-2222-2222-2222-222222222201',
    assigned_by: '22222222-2222-2222-2222-222222222202',
    due_date: new Date().toISOString(),
    completed_at: null,
    source: 'manual',
    source_id: null,
    tags: ['finance'],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCallLog(overrides: Partial<CallLog> = {}): CallLog {
  return {
    id: '44444444-4444-4444-4444-444444444401',
    organization_id: '11111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222201',
    caller_name: 'Priya Sharma',
    caller_phone: '+91 98765 43211',
    direction: 'inbound',
    status: 'completed',
    duration_seconds: 480,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    transcript: 'Test transcript',
    summary: 'Test summary',
    action_items: [{ title: 'Follow up', due_date: null }],
    sentiment: 'positive',
    retell_call_id: null,
    recording_url: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: '88888888-8888-8888-8888-888888888801',
    organization_id: '11111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222201',
    from_address: 'investor@acmecapital.com',
    from_name: 'Meera Kapoor',
    to_address: 'satya@contoso.com',
    subject: 'Q4 Returns & Portfolio Review',
    body_text: 'Test email body',
    body_html: null,
    classification: 'action_required',
    summary: 'Investor requesting Q4 review.',
    is_read: false,
    is_archived: false,
    sendgrid_message_id: null,
    received_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: '77777777-7777-7777-7777-777777777701',
    organization_id: '11111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222201',
    title: 'Call Sarah about project update',
    body: 'Follow up with Sarah.',
    remind_at: new Date().toISOString(),
    is_fired: false,
    fired_at: null,
    source: 'voice_command',
    source_id: null,
    recurrence_rule: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: '99999999-9999-9999-9999-999999999901',
    organization_id: '11111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222201',
    title: 'Task Assigned',
    body: 'You have been assigned a task.',
    channel: 'in_app',
    category: 'task',
    action_url: null,
    reference_type: 'task',
    reference_id: '33333333-3333-3333-3333-333333333301',
    is_read: false,
    read_at: null,
    expo_push_ticket: null,
    delivered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// Supabase Query Mock Builder
// ============================================================

export function mockSupabaseQuery(returnData: unknown, returnError: { message: string } | null = null) {
  const resolved = { data: returnData, error: returnError };

  // Declare chain as a mutable record so self-references inside the object literal work.
  const chain: Record<string, ReturnType<typeof vi.fn> | unknown> = {};

  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.ilike = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);

  // Make the chain itself thenable (resolves when awaited directly)
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve(resolved).then(resolve);

  return chain;
}

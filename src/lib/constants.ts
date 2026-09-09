import { colors } from './design-tokens';

export const N8N_WEBHOOK_BASE_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || '';
export const N8N_AUTH_TOKEN = process.env.EXPO_PUBLIC_N8N_AUTH_TOKEN || '';
export const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';

export const QUERY_KEYS = {
  tasks: 'tasks',
  callLogs: 'call-logs',
  teamMembers: 'team-members',
  notifications: 'notifications',
  unreadCount: 'unread-count',
  events: 'events',
  todayEvents: 'today-events',
  emails: 'emails',
  sentEmails: 'sent-emails',
  followUps: 'follow-ups',
  digests: 'digests',
  integrations: 'integrations',
  reminders: 'reminders',
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: colors.status.low,
  medium: colors.status.medium,
  high: colors.status.high,
  urgent: colors.status.urgent,
};

export const CALL_STATUS_COLORS: Record<string, string> = {
  completed: colors.status.done,
  missed: colors.status.urgent,
  voicemail: colors.status.high,
  failed: colors.status.low,
};

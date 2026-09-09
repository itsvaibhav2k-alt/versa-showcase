export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'completed' | 'missed' | 'voicemail' | 'failed';
export type FollowUpStatus = 'pending' | 'completed' | 'dismissed';
export type EmailClassification = 'action_required' | 'fyi' | 'meeting' | 'follow_up' | 'spam' | 'other';
export type NotificationChannel = 'push' | 'in_app' | 'email';
export type NotificationCategory = 'task' | 'call' | 'email' | 'reminder' | 'digest' | 'team' | 'system';
export type UserRole = 'owner' | 'admin' | 'member';
export type CalendarSource = 'google' | 'outlook' | 'manual';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  timezone: string;
  notification_preferences: NotificationPreferences;
  expo_push_token: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  digest_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  manager_id: string | null;
  title: string | null;
  department: string | null;
  skills: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  source: 'manual' | 'voice_command' | 'call_followup' | 'email' | 'ai_suggested' | null;
  source_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  assigned_to_user?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

export interface CallLog {
  id: string;
  organization_id: string;
  user_id: string;
  caller_name: string | null;
  caller_phone: string;
  direction: CallDirection;
  status: CallStatus;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  transcript: string | null;
  summary: string | null;
  action_items: ActionItem[] | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  retell_call_id: string | null;
  recording_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  title: string;
  due_date: string | null;
}

export interface FollowUp {
  id: string;
  organization_id: string;
  call_log_id: string;
  assigned_to: string | null;
  action: string;
  status: FollowUpStatus;
  due_date: string | null;
  completed_at: string | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
  call_log?: Pick<CallLog, 'id' | 'caller_name' | 'caller_phone' | 'summary'>;
}

export interface Email {
  id: string;
  organization_id: string;
  user_id: string;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  classification: EmailClassification | null;
  summary: string | null;
  is_read: boolean;
  is_archived: boolean;
  sendgrid_message_id: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface SentEmail {
  id: string;
  organization_id: string;
  user_id: string;
  to_address: string;
  to_name: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  ai_drafted: boolean;
  resend_id: string | null;
  in_reply_to: string | null;
  tone: 'professional' | 'friendly' | 'urgent' | null;
  prompt: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  recurrence_rule: string | null;
  external_id: string | null;
  external_source: CalendarSource | null;
  attendees: EventAttendee[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  email: string;
  name: string | null;
  status: 'accepted' | 'declined' | 'tentative' | 'pending';
}

export interface Reminder {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string | null;
  remind_at: string;
  is_fired: boolean;
  fired_at: string | null;
  source: 'manual' | 'voice_command' | 'event' | 'task' | null;
  source_id: string | null;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface Digest {
  id: string;
  organization_id: string;
  user_id: string;
  digest_type: 'morning' | 'evening' | 'weekly';
  content: DigestContent;
  summary: string;
  delivered_at: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DigestContent {
  tasks: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'due_date'>[];
  events: Pick<CalendarEvent, 'id' | 'title' | 'start_time' | 'end_time' | 'location'>[];
  follow_ups: Pick<FollowUp, 'id' | 'action' | 'due_date'>[];
  reminders: Pick<Reminder, 'id' | 'title' | 'remind_at'>[];
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  category: NotificationCategory | null;
  action_url: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  read_at: string | null;
  expo_push_ticket: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface AppEvent {
  id: string;
  organization_id: string;
  event_type: string;
  source_workflow: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  user_id: string;
  organization_id: string;
  active_tasks_count: number;
  completed_today_count: number;
  urgent_tasks_count: number;
  today_events_count: number;
  pending_followups_count: number;
  unread_notifications_count: number;
  upcoming_reminders_count: number;
}

-- ============================================================
-- AI Executive Assistant - Initial Schema
-- ============================================================

-- Custom enum types
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE call_status AS ENUM ('completed', 'missed', 'voicemail', 'failed');
CREATE TYPE followup_status AS ENUM ('pending', 'completed', 'dismissed');
CREATE TYPE notification_channel AS ENUM ('push', 'in_app', 'email');

-- ============================================================
-- 1. Organizations
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Users
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  notification_preferences JSONB NOT NULL DEFAULT '{
    "push_enabled": true,
    "email_enabled": true,
    "digest_time": "08:00",
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00"
  }',
  expo_push_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_organization ON public.users(organization_id);

-- ============================================================
-- 3. Team Members
-- ============================================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT,
  department TEXT,
  skills TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_team_members_org ON public.team_members(organization_id);

-- ============================================================
-- 4. Tasks
-- ============================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('manual', 'voice_command', 'call_followup', 'email', 'ai_suggested')),
  source_id UUID,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(organization_id, status);
CREATE INDEX idx_tasks_due ON public.tasks(due_date) WHERE due_date IS NOT NULL;

-- ============================================================
-- 5. Call Logs
-- ============================================================
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caller_name TEXT,
  caller_phone TEXT NOT NULL,
  direction call_direction NOT NULL,
  status call_status NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  transcript TEXT,
  summary TEXT,
  action_items JSONB,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  retell_call_id TEXT,
  recording_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_logs_org ON public.call_logs(organization_id);
CREATE INDEX idx_call_logs_user ON public.call_logs(user_id);
CREATE INDEX idx_call_logs_started ON public.call_logs(started_at DESC);

-- ============================================================
-- 6. Follow Ups
-- ============================================================
CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_log_id UUID NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  status followup_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_follow_ups_org ON public.follow_ups(organization_id);
CREATE INDEX idx_follow_ups_call ON public.follow_ups(call_log_id);

-- ============================================================
-- 7. Emails (inbound)
-- ============================================================
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  classification TEXT CHECK (classification IN (
    'action_required', 'fyi', 'meeting', 'follow_up', 'spam', 'other'
  )),
  summary TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  sendgrid_message_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_org ON public.emails(organization_id);
CREATE INDEX idx_emails_classification ON public.emails(organization_id, classification);
CREATE INDEX idx_emails_received ON public.emails(received_at DESC);

-- ============================================================
-- 8. Sent Emails
-- ============================================================
CREATE TABLE public.sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_address TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  ai_drafted BOOLEAN NOT NULL DEFAULT false,
  resend_id TEXT,
  in_reply_to UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sent_emails_org ON public.sent_emails(organization_id);

-- ============================================================
-- 9. Calendar Events
-- ============================================================
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  external_id TEXT,
  external_source TEXT CHECK (external_source IN ('google', 'outlook', 'manual')),
  attendees JSONB DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_org ON public.calendar_events(organization_id);
CREATE INDEX idx_calendar_events_time ON public.calendar_events(start_time, end_time);

-- ============================================================
-- 10. Reminders
-- ============================================================
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  is_fired BOOLEAN NOT NULL DEFAULT false,
  fired_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('manual', 'voice_command', 'event', 'task')),
  source_id UUID,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_org ON public.reminders(organization_id);
CREATE INDEX idx_reminders_pending ON public.reminders(remind_at) WHERE is_fired = false;

-- ============================================================
-- 11. Digests
-- ============================================================
CREATE TABLE public.digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL DEFAULT 'morning' CHECK (digest_type IN ('morning', 'evening', 'weekly')),
  content JSONB NOT NULL,
  summary TEXT NOT NULL,
  delivered_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_digests_org ON public.digests(organization_id);
CREATE INDEX idx_digests_created ON public.digests(created_at DESC);

-- ============================================================
-- 12. Notifications
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  category TEXT CHECK (category IN (
    'task', 'call', 'email', 'reminder', 'digest', 'team', 'system'
  )),
  action_url TEXT,
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  expo_push_ticket TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================================
-- 13. App Events (analytics / audit log)
-- ============================================================
CREATE TABLE public.app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_workflow TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_events_org ON public.app_events(organization_id);
CREATE INDEX idx_app_events_type ON public.app_events(event_type);
CREATE INDEX idx_app_events_created ON public.app_events(created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

-- Organizations
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (id = public.get_user_org_id());
CREATE POLICY "Owners can update organization" ON public.organizations
  FOR UPDATE USING (id = public.get_user_org_id());
CREATE POLICY "Anyone can create organization" ON public.organizations
  FOR INSERT WITH CHECK (true);

-- Users
CREATE POLICY "Users can view org members" ON public.users
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Anyone can insert user on signup" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Team Members
CREATE POLICY "Team members visible to org" ON public.team_members
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can manage team" ON public.team_members
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Tasks
CREATE POLICY "Tasks visible to org" ON public.tasks
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org can update tasks" ON public.tasks
  FOR UPDATE USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org can delete tasks" ON public.tasks
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Call Logs
CREATE POLICY "Call logs visible to org" ON public.call_logs
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Can insert call logs" ON public.call_logs
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- Follow Ups
CREATE POLICY "Follow ups visible to org" ON public.follow_ups
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org can manage follow ups" ON public.follow_ups
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Emails
CREATE POLICY "Emails visible to org" ON public.emails
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Can insert emails" ON public.emails
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- Sent Emails
CREATE POLICY "Sent emails visible to org" ON public.sent_emails
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org can manage sent emails" ON public.sent_emails
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Calendar Events
CREATE POLICY "Events visible to org" ON public.calendar_events
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org can manage events" ON public.calendar_events
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Reminders
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own reminders" ON public.reminders
  FOR ALL USING (user_id = auth.uid());

-- Digests
CREATE POLICY "Users can view own digests" ON public.digests
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Can insert digests" ON public.digests
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- App Events
CREATE POLICY "Events visible to org" ON public.app_events
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Can insert app events" ON public.app_events
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sent_emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;

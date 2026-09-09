-- ============================================================
-- Additional Performance Indexes
-- ============================================================
-- NOTE: 27 indexes already exist in 00001. These are NEW composite/partial
-- indexes for specific query patterns found in src/services/.

-- Active tasks by assignee (for task list with filters)
CREATE INDEX idx_tasks_assigned_active
  ON public.tasks(assigned_to, status)
  WHERE status NOT IN ('done', 'cancelled');

-- Org-level active tasks by priority (dashboard queries)
CREATE INDEX idx_tasks_org_active
  ON public.tasks(organization_id, priority)
  WHERE status IN ('todo', 'in_progress');

-- Follow-up to task lookups by source
CREATE INDEX idx_tasks_source
  ON public.tasks(source, source_id)
  WHERE source IS NOT NULL;

-- Upcoming reminders per user (briefing/dashboard)
CREATE INDEX idx_reminders_user_upcoming
  ON public.reminders(user_id, remind_at)
  WHERE is_fired = false;

-- Pending follow-ups per org (dashboard stats, briefing)
CREATE INDEX idx_follow_ups_pending
  ON public.follow_ups(organization_id, status)
  WHERE status = 'pending';

-- Calendar events by org, user, and time (getToday queries)
CREATE INDEX idx_calendar_events_user_time
  ON public.calendar_events(organization_id, user_id, start_time);

-- Latest digest lookup by user and type
CREATE INDEX idx_digests_user_type
  ON public.digests(user_id, digest_type, created_at DESC);

-- Filtered notification feeds by category
CREATE INDEX idx_notifications_user_category
  ON public.notifications(user_id, category);

-- Call log queries by user and status
CREATE INDEX idx_call_logs_user_status
  ON public.call_logs(user_id, status);

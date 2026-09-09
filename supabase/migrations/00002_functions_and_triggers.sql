-- ============================================================
-- Functions, Triggers, and Views
-- ============================================================
-- NOTE: handle_updated_at() and its 10 triggers already exist in 00001.

-- ============================================================
-- on_task_assigned()
-- Notify user when a task is assigned to them
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
     AND (NEW.assigned_by IS NULL OR NEW.assigned_to != NEW.assigned_by)
  THEN
    INSERT INTO public.notifications (
      organization_id,
      user_id,
      title,
      body,
      channel,
      category,
      reference_type,
      reference_id
    ) VALUES (
      NEW.organization_id,
      NEW.assigned_to,
      'New Task Assigned',
      'You have been assigned: ' || NEW.title,
      'in_app',
      'task',
      'task',
      NEW.id
    );
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_on_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_task_assigned();

-- ============================================================
-- on_task_status_changed()
-- Auto-set completed_at and notify assigner when task is done
-- BEFORE trigger so we can modify NEW.completed_at
-- Trigger name trg_on_task_status_changed sorts after set_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_task_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();

    IF NEW.assigned_by IS NOT NULL
       AND NEW.assigned_to IS NOT NULL
       AND NEW.assigned_by != NEW.assigned_to
    THEN
      INSERT INTO public.notifications (
        organization_id,
        user_id,
        title,
        body,
        channel,
        category,
        reference_type,
        reference_id
      ) VALUES (
        NEW.organization_id,
        NEW.assigned_by,
        'Task Completed',
        'Task completed: ' || NEW.title,
        'in_app',
        'task',
        'task',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_task_status_changed
  BEFORE UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_task_status_changed();

-- ============================================================
-- on_call_completed()
-- Notify user when a call is completed and summary is ready
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_call_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (
      organization_id,
      user_id,
      title,
      body,
      channel,
      category,
      reference_type,
      reference_id
    ) VALUES (
      NEW.organization_id,
      NEW.user_id,
      'Call Summary Ready',
      'Your call with ' || COALESCE(NEW.caller_name, NEW.caller_phone) || ' has been processed.',
      'in_app',
      'call',
      'call_log',
      NEW.id
    );
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_on_call_completed
  AFTER INSERT ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_call_completed();

-- ============================================================
-- on_follow_up_created()
-- Auto-create a task from a follow-up (unless task_id already set)
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_follow_up_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_task_id UUID;
BEGIN
  IF NEW.task_id IS NULL THEN
    INSERT INTO public.tasks (
      title,
      priority,
      source,
      source_id,
      assigned_to,
      due_date,
      organization_id,
      status
    ) VALUES (
      NEW.action,
      'medium',
      'call_followup',
      NEW.id,
      NEW.assigned_to,
      NEW.due_date,
      NEW.organization_id,
      'todo'
    )
    RETURNING id INTO new_task_id;

    UPDATE public.follow_ups
    SET task_id = new_task_id
    WHERE id = NEW.id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_on_follow_up_created
  AFTER INSERT ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.on_follow_up_created();

-- ============================================================
-- dashboard_stats view
-- ============================================================
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  u.id AS user_id,
  u.organization_id,
  (
    SELECT COUNT(*)
    FROM public.tasks t
    WHERE t.organization_id = u.organization_id
      AND t.assigned_to = u.id
      AND t.status IN ('todo', 'in_progress')
  ) AS active_tasks_count,
  (
    SELECT COUNT(*)
    FROM public.tasks t
    WHERE t.organization_id = u.organization_id
      AND t.assigned_to = u.id
      AND t.status = 'done'
      AND t.completed_at >= CURRENT_DATE
  ) AS completed_today_count,
  (
    SELECT COUNT(*)
    FROM public.tasks t
    WHERE t.organization_id = u.organization_id
      AND t.assigned_to = u.id
      AND t.priority = 'urgent'
      AND t.status IN ('todo', 'in_progress')
  ) AS urgent_tasks_count,
  (
    SELECT COUNT(*)
    FROM public.calendar_events ce
    WHERE ce.organization_id = u.organization_id
      AND ce.user_id = u.id
      AND ce.start_time >= CURRENT_DATE
      AND ce.start_time < CURRENT_DATE + INTERVAL '1 day'
  ) AS today_events_count,
  (
    SELECT COUNT(*)
    FROM public.follow_ups fu
    WHERE fu.organization_id = u.organization_id
      AND fu.assigned_to = u.id
      AND fu.status = 'pending'
  ) AS pending_followups_count,
  (
    SELECT COUNT(*)
    FROM public.notifications n
    WHERE n.user_id = u.id
      AND n.is_read = false
  ) AS unread_notifications_count,
  (
    SELECT COUNT(*)
    FROM public.reminders r
    WHERE r.user_id = u.id
      AND r.is_fired = false
      AND r.remind_at >= now()
  ) AS upcoming_reminders_count
FROM public.users u
WHERE u.is_active = true;

GRANT SELECT ON public.dashboard_stats TO authenticated;

-- ============================================================
-- 7. Add unique constraint on calendar_events.external_id
-- Required for upsert during Google Calendar sync
-- ============================================================

CREATE UNIQUE INDEX idx_calendar_events_external_id
  ON public.calendar_events(external_id)
  WHERE external_id IS NOT NULL;

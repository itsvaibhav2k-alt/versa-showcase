-- ============================================================
-- 6. Integrations table for calendar sync tracking
-- ============================================================

CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_email TEXT,
  scope TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON public.integrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations"
  ON public.integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations"
  ON public.integrations FOR DELETE
  USING (user_id = auth.uid());

-- Index for fast lookups by user
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);

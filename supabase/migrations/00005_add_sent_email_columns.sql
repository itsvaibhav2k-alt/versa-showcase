-- Add tone and prompt columns to sent_emails for AI compose tracking
ALTER TABLE public.sent_emails
  ADD COLUMN tone TEXT CHECK (tone IN ('professional', 'friendly', 'urgent')),
  ADD COLUMN prompt TEXT;

CREATE INDEX idx_sent_emails_status ON public.sent_emails(status);
CREATE INDEX idx_sent_emails_created ON public.sent_emails(created_at DESC);

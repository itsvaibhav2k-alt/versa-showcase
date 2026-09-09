# n8n Workflows — Versa Backend Automation

n8n serves as the workflow automation layer in Versa's architecture. It handles event-driven processing (webhooks from Retell, SendGrid, Supabase database triggers), scheduled jobs (daily briefings, reminders, overdue checks), and AI-powered content generation (call summaries, email drafting, email classification) using Claude.

All workflows interact with Supabase via its REST API and send push notifications through the Expo Push API.

---

## Workflow Inventory

| # | Workflow | File | Trigger | Description |
|---|---------|------|---------|-------------|
| 1 | Post-Call Processing | `post-call-processing.json` | Webhook POST | Processes completed Retell calls — summarizes transcript with Claude, inserts call log, creates follow-ups, sends push notification |
| 2 | Daily Briefing | `daily-briefing.json` | Cron (7 AM) | Generates personalized morning digest for each active user — aggregates tasks, events, follow-ups, reminders and summarizes with Claude |
| 3 | AI Email Sender | `ai-email-sender.json` | Webhook POST | Drafts professional emails using Claude based on intent, sends via Resend, logs to database |
| 4 | Email Inbound Processor | `email-inbound-processor.json` | Webhook POST | Processes inbound emails from SendGrid — classifies with Claude, stores, notifies user if urgent |
| 5 | Task Assignment Notifier | `task-assignment-notifier.json` | Webhook POST | Routes task assignment notifications via push, email (Resend), or SMS (Twilio) based on user preferences |
| 6 | Reminder Engine | `reminder-engine.json` | Cron (every 15m) | Checks for due reminders, marks as fired, inserts notifications, sends push |
| 7 | Event Logger | `event-logger.json` | Sub-workflow | Centralized event logging — called by other workflows to insert records into `app_events` table |
| 8 | Notification Router | `notification-router.json` | Webhook POST | Generic notification routing — accepts event_type (task_overdue, meeting_reminder, follow_up_due, missed_call), builds contextual notification, inserts + pushes |
| 9 | Overdue Checker | `overdue-checker.json` | Cron (9 AM) | Daily scan for overdue tasks and due follow-ups — deduplicates against today's notifications, inserts + pushes per item |

---

## Environment Variables

These must be configured in n8n under Settings > Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project REST API URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (full access) | `eyJhbGci...` |
| `CLAUDE_API_KEY` | Anthropic API key for Claude | `sk-ant-...` |
| `RESEND_API_KEY` | Resend email sending API key | `re_...` |
| `FROM_EMAIL` | Sender email address for outbound emails | `assistant@yourdomain.com` |
| `EVENT_LOGGER_WORKFLOW_ID` | n8n workflow ID of the Event Logger | `42` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for SMS) | `AC...` |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number | `+1234567890` |

---

## Webhook Endpoints

| Path | Method | Workflow | Payload |
|------|--------|----------|---------|
| `/webhook/retell-call-completed` | POST | Post-Call Processing | Retell call completed event |
| `/webhook/send-email` | POST | AI Email Sender | `{ to_email, intent, context, user_id, organization_id }` |
| `/webhook/inbound-email` | POST | Email Inbound Processor | SendGrid Inbound Parse payload |
| `/webhook/task-assigned` | POST | Task Assignment Notifier | Supabase task insert/update trigger |
| `/webhook/notification-route` | POST | Notification Router | `{ event_type, user_id, organization_id, reference_id, reference_type, metadata }` |

---

## Cron Schedules

| Schedule | Workflow | Description |
|----------|----------|-------------|
| `0 7 * * *` | Daily Briefing | 7 AM daily — morning digest generation |
| `*/15 * * * *` | Reminder Engine | Every 15 minutes — fire due reminders |
| `0 9 * * *` | Overdue Checker | 9 AM daily — find overdue tasks and due follow-ups |

---

## Import Instructions

1. Open your n8n instance (self-hosted or cloud)
2. Go to **Workflows** in the left sidebar
3. Click **Add Workflow** (or use the `+` button)
4. Click the **...** menu in the top-right corner of the workflow editor
5. Select **Import from File...**
6. Choose the JSON file from `n8n/workflows/`
7. Save and activate the workflow
8. Repeat for each workflow file

**Import order recommendation:**
1. `event-logger.json` first (other workflows reference it)
2. All other workflows in any order
3. After importing Event Logger, note its workflow ID and set it as the `EVENT_LOGGER_WORKFLOW_ID` environment variable

---

## Supabase Trigger Integration

Several workflows are designed to be triggered by Supabase database webhooks (configured in Supabase Dashboard > Database > Webhooks):

- **Task Assignment Notifier**: Triggered on `INSERT` or `UPDATE` to `tasks` table when `assigned_to` changes
- **Post-Call Processing**: Triggered by Retell's webhook callback after call completion
- **Notification Router**: Generic endpoint — can be called from Supabase Edge Functions or database triggers via `pg_net`

Example Supabase trigger SQL (using pg_net):
```sql
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-n8n.com/webhook/task-assigned',
    body := json_build_object('record', NEW, 'old_record', OLD)::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing

Use the provided `test-webhooks.sh` script to test webhook endpoints against a local n8n instance:

```bash
chmod +x n8n/test-webhooks.sh
./n8n/test-webhooks.sh
```

See the script for individual curl commands per workflow.

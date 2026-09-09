# n8n Setup Guide — Versa Backend Automation

Complete setup guide for connecting Versa's n8n workflow automation layer.

---

## Prerequisites

- n8n instance (self-hosted or cloud) — v1.30+ recommended
- Supabase project with tables deployed (see `supabase/migrations/`)
- API keys for external services (see Credentials below)

---

## 1. Required Credentials

Configure these credentials in your n8n instance under **Settings > Credentials**:

| Credential | Type | Required For |
|------------|------|-------------|
| **Supabase** | HTTP Header Auth or Postgres | All workflows — database reads/writes |
| **Anthropic (Claude)** | HTTP Header Auth | Post-Call Processing, Daily Briefing, AI Email Sender, Email Inbound Processor |
| **Expo Push** | HTTP Header Auth | All notification workflows — push notifications |
| **Resend** | HTTP Header Auth | AI Email Sender, Task Assignment Notifier |
| **Twilio** | Twilio API | Task Assignment Notifier (SMS channel) |

### Supabase Credential Setup

- **URL**: Your Supabase project REST API URL (e.g., `https://abc123.supabase.co/rest/v1`)
- **Key**: Use the **service_role** key (NOT the anon key) — workflows need full database access
- Header Name: `apikey`
- Header Value: `<your-service-role-key>`
- Also set `Authorization: Bearer <your-service-role-key>` header

### Anthropic (Claude) Credential Setup

- Header Name: `x-api-key`
- Header Value: `sk-ant-...`
- Model: `claude-sonnet-4-20250514` (recommended for cost/quality balance)

### Expo Push Credential Setup

- No authentication required for Expo Push API
- Endpoint: `https://exp.host/--/api/v2/push/send`

### Resend Credential Setup

- Header Name: `Authorization`
- Header Value: `Bearer re_...`
- Configure a verified sending domain in Resend dashboard

### Twilio Credential Setup

- Account SID: `AC...`
- Auth Token: from Twilio console
- Phone Number: your Twilio sender number (e.g., `+1234567890`)

---

## 2. n8n Environment Variables

Set these under **Settings > Variables** in your n8n instance:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
CLAUDE_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
FROM_EMAIL=assistant@yourdomain.com
EVENT_LOGGER_WORKFLOW_ID=<set after importing event-logger.json>
TWILIO_ACCOUNT_SID=AC...
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 3. App Environment Variables

Set these in your Versa app `.env` file:

```
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n.com/webhook
EXPO_PUBLIC_N8N_AUTH_TOKEN=<optional-bearer-token>
```

- `EXPO_PUBLIC_N8N_WEBHOOK_URL`: Base URL for n8n webhook endpoints (without trailing slash)
- `EXPO_PUBLIC_N8N_AUTH_TOKEN`: Optional Bearer token for authenticating webhook requests from the app to n8n

The app's `webhookService` constructs full URLs as `${EXPO_PUBLIC_N8N_WEBHOOK_URL}/<path>`.

### Webhook Paths Used by the App

| Path | Triggered By | Workflow |
|------|-------------|----------|
| `retell-call-completed` | Call log creation, "Generate AI Summary" button | Post-Call Processing |
| `notification-route` | Notification triggers | Notification Router |
| `generate-briefing` | Morning briefing card refresh | Daily Briefing |
| `send-email` | Email composition | AI Email Sender |

---

## 4. Import Order

Import workflows in this order:

1. **`event-logger.json`** — Import FIRST. Other workflows call this as a sub-workflow.
2. After importing, note the Event Logger's **workflow ID** (visible in the URL: `/workflow/<ID>`).
3. Set `EVENT_LOGGER_WORKFLOW_ID` variable to this ID.
4. Import all remaining workflows in any order:
   - `post-call-processing.json`
   - `daily-briefing.json`
   - `ai-email-sender.json`
   - `email-inbound-processor.json`
   - `task-assignment-notifier.json`
   - `reminder-engine.json`
   - `notification-router.json`
   - `overdue-checker.json`
5. Activate all workflows after import.

---

## 5. Adding a Manual Briefing Webhook Trigger

The `daily-briefing.json` workflow runs on a cron schedule (7 AM daily). To also support on-demand briefing generation from the app:

1. Open the Daily Briefing workflow in n8n
2. Add a **Webhook** node alongside the existing **Cron** trigger
   - Path: `generate-briefing`
   - Method: POST
   - Authentication: Header Auth (if using `N8N_AUTH_TOKEN`)
3. Connect the Webhook node's output to the same node the Cron trigger connects to
4. The webhook accepts: `{ "user_id": "...", "organization_id": "..." }`
5. Add a **Filter** node after the webhook to process only the requesting user (instead of all users)
6. Save and re-activate the workflow

This allows the app's `webhookService.triggerBriefing()` to generate briefings on demand.

---

## 6. Testing

### Using the Test Script

```bash
# Default: tests against local n8n at localhost:5678
chmod +x n8n/test-webhooks.sh
./n8n/test-webhooks.sh

# Against a remote instance
BASE_URL=https://your-n8n.com/webhook-test ./n8n/test-webhooks.sh
```

The script sends mock payloads to all webhook endpoints using seed data UUIDs from `supabase/seed.sql`.

### Manual Testing

Test individual endpoints with curl:

```bash
# Post-Call Processing
curl -X POST http://localhost:5678/webhook-test/retell-call-completed \
  -H "Content-Type: application/json" \
  -d '{"call_id":"test","from_name":"Test","from_number":"+1234567890","transcript":"Hello","duration_ms":30000,"metadata":{"organization_id":"11111111-1111-1111-1111-111111111111","user_id":"22222222-2222-2222-2222-222222222201"}}'

# Generate Briefing (on-demand)
curl -X POST http://localhost:5678/webhook-test/generate-briefing \
  -H "Content-Type: application/json" \
  -d '{"user_id":"22222222-2222-2222-2222-222222222201","organization_id":"11111111-1111-1111-1111-111111111111"}'
```

---

## 7. End-to-End Verification Checklist

After setup, verify each integration point:

- [ ] **Event Logger**: Import and note workflow ID. Set `EVENT_LOGGER_WORKFLOW_ID`.
- [ ] **Post-Call Processing**: Log a call in the app. Verify AI summary appears on the call detail screen.
- [ ] **Notification Router**: Trigger a test notification. Verify it appears in the app's notifications tab.
- [ ] **Daily Briefing**: Wait for cron trigger (or use manual webhook). Verify briefing card on dashboard.
- [ ] **AI Email Sender**: Send an email from the app. Verify it arrives and is logged in `emails` table.
- [ ] **Reminder Engine**: Create a reminder due in < 15 minutes. Verify push notification fires.
- [ ] **Overdue Checker**: Create an overdue task. Wait for 9 AM cron. Verify notification.
- [ ] **Task Assignment**: Assign a task. Verify assignee receives push/email notification.
- [ ] **Realtime Updates**: On the call detail screen, trigger "Generate AI Summary". Verify the summary appears automatically without page refresh (via Supabase realtime subscription).
- [ ] **Error Logging**: Check the `app_events` table for any `webhook_error` entries.

---

## Troubleshooting

- **Webhooks return 404**: Ensure workflows are activated and webhook paths match exactly.
- **No push notifications**: Verify Expo push tokens are stored in the `profiles` table and the Expo Push endpoint is reachable from n8n.
- **AI summaries not appearing**: Check that the Post-Call Processing workflow can reach the Anthropic API and that Supabase realtime is enabled for the `call_logs` table.
- **Briefing not generating**: Verify the cron schedule timezone matches your users' timezone. For manual triggers, ensure the webhook node is added per Section 5.
- **Auth errors**: If using `N8N_AUTH_TOKEN`, ensure the n8n webhook nodes are configured with matching Header Auth.

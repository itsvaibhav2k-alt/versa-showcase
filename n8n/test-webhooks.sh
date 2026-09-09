#!/usr/bin/env bash
#
# test-webhooks.sh — Test all n8n webhook endpoints with mock payloads
#
# Usage:
#   ./n8n/test-webhooks.sh                          # uses default localhost:5678
#   BASE_URL=https://n8n.example.com ./n8n/test-webhooks.sh  # custom base URL
#

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5678/webhook-test}"

# Seed UUIDs matching supabase/seed.sql
ORG_ID="11111111-1111-1111-1111-111111111111"
USER_SATYA="22222222-2222-2222-2222-222222222201"
USER_PRIYA="22222222-2222-2222-2222-222222222202"
TASK_ID="44444444-4444-4444-4444-444444444401"
FOLLOW_UP_ID="77777777-7777-7777-7777-777777777701"
CALL_LOG_ID="55555555-5555-5555-5555-555555555501"

echo "============================================"
echo "  Versa n8n Webhook Tests"
echo "  Base URL: ${BASE_URL}"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Post-Call Processing (retell-call-completed)
# ---------------------------------------------------------------------------
echo "--- [1/7] Post-Call Processing ---"
curl -s -X POST "${BASE_URL}/retell-call-completed" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "retell_test_001",
    "from_name": "John Smith",
    "from_number": "+14155551234",
    "direction": "inbound",
    "call_status": "missed",
    "duration_ms": 45000,
    "start_time": "2026-02-25T10:00:00Z",
    "end_time": "2026-02-25T10:00:45Z",
    "transcript": "Hello, this is John Smith calling about the quarterly report. I need the updated numbers by Friday. Please call me back at your earliest convenience.",
    "recording_url": "https://storage.retellai.com/recordings/test_001.wav",
    "metadata": {
      "organization_id": "'"${ORG_ID}"'",
      "user_id": "'"${USER_SATYA}"'"
    }
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 2. Notification Router — task_overdue
# ---------------------------------------------------------------------------
echo "--- [2/7] Notification Router: task_overdue ---"
curl -s -X POST "${BASE_URL}/notification-route" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "task_overdue",
    "user_id": "'"${USER_SATYA}"'",
    "organization_id": "'"${ORG_ID}"'",
    "reference_id": "'"${TASK_ID}"'",
    "reference_type": "task",
    "metadata": {
      "title": "Prepare quarterly board deck",
      "priority": "high",
      "due_date": "2026-02-23T00:00:00Z"
    }
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 3. Notification Router — meeting_reminder
# ---------------------------------------------------------------------------
echo "--- [3/7] Notification Router: meeting_reminder ---"
curl -s -X POST "${BASE_URL}/notification-route" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "meeting_reminder",
    "user_id": "'"${USER_SATYA}"'",
    "organization_id": "'"${ORG_ID}"'",
    "reference_id": "event_001",
    "reference_type": "calendar_event",
    "metadata": {
      "event_title": "Board Strategy Meeting",
      "starts_in": "in 15 minutes",
      "location": "Conference Room A"
    }
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 4. Notification Router — follow_up_due
# ---------------------------------------------------------------------------
echo "--- [4/7] Notification Router: follow_up_due ---"
curl -s -X POST "${BASE_URL}/notification-route" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "follow_up_due",
    "user_id": "'"${USER_PRIYA}"'",
    "organization_id": "'"${ORG_ID}"'",
    "reference_id": "'"${FOLLOW_UP_ID}"'",
    "reference_type": "follow_up",
    "metadata": {
      "action": "Send updated financials to investor group",
      "call_log_id": "'"${CALL_LOG_ID}"'"
    }
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 5. Notification Router — missed_call
# ---------------------------------------------------------------------------
echo "--- [5/7] Notification Router: missed_call ---"
curl -s -X POST "${BASE_URL}/notification-route" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "missed_call",
    "user_id": "'"${USER_SATYA}"'",
    "organization_id": "'"${ORG_ID}"'",
    "reference_id": "'"${CALL_LOG_ID}"'",
    "reference_type": "call_log",
    "metadata": {
      "caller_name": "Rajesh Patel",
      "caller_phone": "+14155559876"
    }
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 6. AI Email Sender
# ---------------------------------------------------------------------------
echo "--- [6/7] AI Email Sender ---"
curl -s -X POST "${BASE_URL}/send-email" \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "to_name": "Test Recipient",
    "intent": "Follow up on our meeting yesterday about the partnership proposal. Express enthusiasm and suggest next steps.",
    "context": "Met with Test Recipient from Acme Corp to discuss a strategic partnership for Q2 2026.",
    "user_id": "'"${USER_SATYA}"'",
    "organization_id": "'"${ORG_ID}"'"
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

# ---------------------------------------------------------------------------
# 7. Task Assignment Notifier
# ---------------------------------------------------------------------------
echo "--- [7/7] Task Assignment Notifier ---"
curl -s -X POST "${BASE_URL}/task-assigned" \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "'"${TASK_ID}"'",
      "title": "Review partnership contract",
      "description": "Review the draft partnership contract with Acme Corp and provide feedback by EOD.",
      "status": "todo",
      "priority": "high",
      "assigned_to": "'"${USER_PRIYA}"'",
      "assigned_by": "'"${USER_SATYA}"'",
      "due_date": "2026-02-26T00:00:00Z",
      "organization_id": "'"${ORG_ID}"'",
      "source": "delegation"
    },
    "old_record": {}
  }' | jq . 2>/dev/null || echo "(response received)"
echo ""

echo "============================================"
echo "  All tests completed."
echo "============================================"

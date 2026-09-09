# Versa — AI-Powered Executive Assistant

## What It Is

Versa is a mobile-first AI executive assistant that manages the daily chaos of running a business. It unifies calls, tasks, emails, calendar, and team coordination into a single app — with AI that listens, summarizes, and acts so you don't have to.

Think of it as a chief of staff in your pocket: it answers calls when you can't, summarizes what was said, creates follow-ups automatically, writes emails in your voice, and delivers a morning briefing so you know exactly what needs your attention before your first meeting.

## Who It's For

- **Founders and CEOs** juggling investor calls, board prep, and team management
- **Senior executives** who need to stay on top of 50+ daily decisions
- **Chiefs of Staff** coordinating across departments and stakeholders
- **Anyone whose assistant is overwhelmed** — Versa handles the overflow

## Core Features

### AI Call Processing
When a call ends, Versa's AI automatically generates a summary, identifies action items, detects sentiment, and creates follow-up tasks assigned to the right people. Missed calls are flagged with caller context. Voicemails are transcribed and summarized.

### Morning Briefing
Every morning at your preferred time, Versa delivers an AI-generated digest: your urgent tasks, today's meetings, pending follow-ups, and key highlights — written in natural language, not bullet soup. Generated daily via n8n automation with Claude AI.

### Voice & Text Commands
"Remind me to call Sarah at 3 PM." "Draft a thank-you email to Meera." "What's on my calendar today?" — Versa understands natural language commands and executes them instantly, creating tasks, reminders, emails, and calendar queries.

### Smart Task Management
Tasks flow in from everywhere — manual creation, voice commands, call follow-ups, email triage, AI suggestions. Each task tracks its source, priority, assignee, and due date. Kanban views, grouped sections (Today / Upcoming), and one-tap completion with undo.

### Team Coordination
See your team at a glance — who's working on what, their active task counts, and workload distribution. Delegate tasks with a tap. Automatic notifications when tasks are assigned or completed. Manager hierarchy and department views.

### AI Email Triage & Drafting
Inbound emails are classified by AI (action required, FYI, meeting, follow-up, spam) with one-line summaries. Reply with AI-drafted responses that match your tone and context. Sent email tracking.

### Calendar Integration
Google Calendar and Outlook sync. Today's schedule visible on the dashboard with join buttons for Zoom and Google Meet links. Meeting attendee details, locations, and descriptions at a glance.

### Smart Reminders
Create reminders via voice, text, or manually. AI also suggests reminders based on call context ("You mentioned following up with Deepak — should I remind you?"). Recurrence support. Push notifications when due.

### Real-Time Notifications
Push, in-app, and email notifications for task assignments, call summaries, meeting reminders, missed calls, and digest delivery. Quiet hours support. Category-based filtering.

## Technical Architecture

### Frontend
- **React Native (Expo)** — iOS, Android, and Web from one codebase
- **Design System** — Warm, confident aesthetic (DM Sans + JetBrains Mono, amber accent, warm shadows)
- **Real-time** — Supabase Realtime subscriptions for instant updates on tasks, calls, and notifications

### Backend
- **Supabase** — PostgreSQL database, Auth, Storage, Row-Level Security
- **13 tables** with full RLS policies, auto-timestamps, and database triggers
- **Triggers** auto-create tasks from follow-ups, send notifications on assignments, set completed timestamps

### AI & Automation
- **n8n Cloud** — 10 production workflows for call processing, briefings, email, reminders, and notifications
- **Claude AI (Anthropic)** — Call summarization, email drafting, email classification, briefing generation, voice command processing
- **Deepgram** — Real-time speech-to-text for voice commands

### Integrations
- **Retell AI** — AI phone agent for call handling
- **Resend** — Transactional email delivery
- **SendGrid** — Inbound email processing
- **Expo Push** — Mobile push notifications
- **Google Calendar / Outlook** — Calendar sync

## n8n Workflow Summary

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| Post-Call Processing | Webhook | Receives call transcript → Claude summarizes → creates call log + follow-ups + notifications |
| Daily Briefing | Cron (7 AM) | Aggregates tasks, events, follow-ups → Claude writes natural briefing → delivers to digest |
| Overdue Checker | Cron (9 AM) | Scans for overdue tasks and due follow-ups → creates notifications |
| Reminder Engine | Cron (15 min) | Fires due reminders → push notification + in-app notification |
| Notification Router | Webhook | Routes events (task_overdue, meeting_reminder, follow_up_due, missed_call) to proper channels |
| AI Email Sender | Webhook | Takes intent + context → Claude drafts email → sends via Resend |
| Email Inbound | Webhook | Receives email → Claude classifies → stores with summary |
| Task Assignment | Webhook | Notifies assignees via push, email, or SMS based on preferences |
| Calendar Sync | Cron | Syncs Google/Outlook events to Supabase |
| Event Logger | Sub-workflow | Centralized audit logging for all workflows |

## Demo Account

| Field | Value |
|-------|-------|
| Email | `satya@contoso.com` |
| Password | `password123` |
| Organization | Contoso Corp |
| Role | Owner (CEO) |

**Team:** Priya Sharma (Chief of Staff), Rahul Mehta (EA), Anita Desai (Ops Lead), Vikram Singh (Finance Lead)

**Demo data includes:** 16 tasks across all statuses and priorities, 7 call logs (completed with AI summaries, missed, voicemail), 3 follow-ups from a real call, 6 calendar events (today + upcoming), 4 reminders, 5 inbound emails with AI classification, 2 AI-drafted sent emails, 27 notifications, and a morning briefing digest.

## What Makes Versa Different

1. **Calls are first-class citizens** — Most productivity apps ignore phone calls entirely. Versa treats every call as a data source that generates tasks, follow-ups, and insights.

2. **AI that acts, not just answers** — Versa doesn't just summarize — it creates tasks, assigns them to the right people, drafts replies, and sends reminders. The AI is embedded in the workflow, not bolted on.

3. **One unified inbox for executives** — Instead of context-switching between phone, email, calendar, Slack, and a task manager, everything flows into one prioritized view.

4. **Designed for delegation** — Built for people who manage teams. Every call, email, and task can be delegated in one tap with automatic notification to the assignee.

5. **Morning briefing, not morning dread** — Wake up knowing exactly what matters today, written by AI that understands your priorities, not a generic dashboard of numbers.

-- ============================================================
-- Versa App — Comprehensive Seed Data
-- ============================================================
-- WARNING: auth.users inserts are for LOCAL DEVELOPMENT ONLY.
-- Do NOT run this against a production Supabase instance.
-- ============================================================

BEGIN;

-- ============================================================
-- Fixed UUIDs
-- ============================================================
-- org:          11111111-1111-1111-1111-111111111111
-- satya:        22222222-2222-2222-2222-222222222201
-- priya:        22222222-2222-2222-2222-222222222202
-- rahul:        22222222-2222-2222-2222-222222222203
-- anita:        22222222-2222-2222-2222-222222222204
-- vikram:       22222222-2222-2222-2222-222222222205
-- tasks:        33333333-3333-3333-3333-33333333330X
-- call_logs:    44444444-4444-4444-4444-44444444440X
-- follow_ups:   55555555-5555-5555-5555-55555555550X
-- events:       66666666-6666-6666-6666-66666666660X
-- reminders:    77777777-7777-7777-7777-77777777770X
-- emails:       88888888-8888-8888-8888-88888888880X
-- notifications:99999999-9999-9999-9999-99999999990X
-- digests:      aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa01

-- ============================================================
-- 1. auth.users (LOCAL DEV ONLY)
-- ============================================================
-- These inserts bootstrap Supabase Auth users so that public.users
-- can reference them via FK. In production, users sign up via the app.

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  role, aud,
  confirmation_token, recovery_token,
  email_change_token_new, email_change_token_current,
  email_change, phone, phone_change, phone_change_token,
  reauthentication_token, is_sso_user
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  '00000000-0000-0000-0000-000000000000',
  'satya@contoso.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Satya Nadella"}'::jsonb,
  'authenticated', 'authenticated',
  '', '', '', '', '', NULL, '', '', '', false
),
(
  '22222222-2222-2222-2222-222222222202',
  '00000000-0000-0000-0000-000000000000',
  'priya@contoso.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Priya Sharma"}'::jsonb,
  'authenticated', 'authenticated',
  '', '', '', '', '', NULL, '', '', '', false
),
(
  '22222222-2222-2222-2222-222222222203',
  '00000000-0000-0000-0000-000000000000',
  'rahul@contoso.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rahul Mehta"}'::jsonb,
  'authenticated', 'authenticated',
  '', '', '', '', '', NULL, '', '', '', false
),
(
  '22222222-2222-2222-2222-222222222204',
  '00000000-0000-0000-0000-000000000000',
  'anita@contoso.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Anita Desai"}'::jsonb,
  'authenticated', 'authenticated',
  '', '', '', '', '', NULL, '', '', '', false
),
(
  '22222222-2222-2222-2222-222222222205',
  '00000000-0000-0000-0000-000000000000',
  'vikram@contoso.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Vikram Singh"}'::jsonb,
  'authenticated', 'authenticated',
  '', '', '', '', '', NULL, '', '', '', false
);

-- auth.identities — required by GoTrue for email/password sign-in
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222201',
  'satya@contoso.com', 'email',
  '{"sub":"22222222-2222-2222-2222-222222222201","email":"satya@contoso.com"}'::jsonb,
  now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222202',
  'priya@contoso.com', 'email',
  '{"sub":"22222222-2222-2222-2222-222222222202","email":"priya@contoso.com"}'::jsonb,
  now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222203',
  'rahul@contoso.com', 'email',
  '{"sub":"22222222-2222-2222-2222-222222222203","email":"rahul@contoso.com"}'::jsonb,
  now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222204',
  'anita@contoso.com', 'email',
  '{"sub":"22222222-2222-2222-2222-222222222204","email":"anita@contoso.com"}'::jsonb,
  now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222205',
  'vikram@contoso.com', 'email',
  '{"sub":"22222222-2222-2222-2222-222222222205","email":"vikram@contoso.com"}'::jsonb,
  now(), now(), now()
);

-- ============================================================
-- 2. Organization
-- ============================================================
INSERT INTO public.organizations (id, name, slug, plan, settings) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Contoso Corp',
  'contoso-corp',
  'pro',
  '{
    "timezone": "Asia/Kolkata",
    "features": {
      "ai_call_summary": true,
      "email_classification": true,
      "voice_commands": true,
      "daily_digest": true
    },
    "branding": {
      "primary_color": "#D4930D"
    }
  }'::jsonb
);

-- ============================================================
-- 3. Users
-- ============================================================
INSERT INTO public.users (
  id, organization_id, email, full_name, phone, role, timezone,
  notification_preferences, is_active, last_seen_at
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111111',
  'satya@contoso.com',
  'Satya Nadella',
  '+91 98765 43210',
  'owner',
  'Asia/Kolkata',
  '{"push_enabled":true,"email_enabled":true,"digest_time":"07:00","quiet_hours_start":"23:00","quiet_hours_end":"06:00"}'::jsonb,
  true,
  now() - interval '5 minutes'
),
(
  '22222222-2222-2222-2222-222222222202',
  '11111111-1111-1111-1111-111111111111',
  'priya@contoso.com',
  'Priya Sharma',
  '+91 98765 43211',
  'admin',
  'Asia/Kolkata',
  '{"push_enabled":true,"email_enabled":true,"digest_time":"08:00","quiet_hours_start":"22:00","quiet_hours_end":"07:00"}'::jsonb,
  true,
  now() - interval '15 minutes'
),
(
  '22222222-2222-2222-2222-222222222203',
  '11111111-1111-1111-1111-111111111111',
  'rahul@contoso.com',
  'Rahul Mehta',
  '+91 98765 43212',
  'member',
  'Asia/Kolkata',
  '{"push_enabled":true,"email_enabled":true,"digest_time":"08:00","quiet_hours_start":"22:00","quiet_hours_end":"07:00"}'::jsonb,
  true,
  now() - interval '30 minutes'
),
(
  '22222222-2222-2222-2222-222222222204',
  '11111111-1111-1111-1111-111111111111',
  'anita@contoso.com',
  'Anita Desai',
  '+91 98765 43213',
  'member',
  'Asia/Kolkata',
  '{"push_enabled":true,"email_enabled":false,"digest_time":"08:00","quiet_hours_start":"22:00","quiet_hours_end":"07:00"}'::jsonb,
  true,
  now() - interval '1 hour'
),
(
  '22222222-2222-2222-2222-222222222205',
  '11111111-1111-1111-1111-111111111111',
  'vikram@contoso.com',
  'Vikram Singh',
  '+91 98765 43214',
  'member',
  'Asia/Kolkata',
  '{"push_enabled":true,"email_enabled":true,"digest_time":"08:30","quiet_hours_start":"22:00","quiet_hours_end":"07:00"}'::jsonb,
  true,
  now() - interval '2 hours'
);

-- ============================================================
-- 4. Team Members
-- ============================================================
INSERT INTO public.team_members (
  organization_id, user_id, manager_id, title, department, skills, is_active
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  NULL,
  'Chief Executive Officer',
  'Executive',
  ARRAY['strategy', 'leadership', 'fundraising', 'public-speaking'],
  true
),
(
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222201',
  'Chief of Staff',
  'Executive',
  ARRAY['project-management', 'operations', 'communications', 'analytics'],
  true
),
(
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222201',
  'Executive Assistant',
  'Operations',
  ARRAY['scheduling', 'travel-planning', 'coordination', 'documentation'],
  true
),
(
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222201',
  'Operations Lead',
  'Operations',
  ARRAY['process-optimization', 'vendor-management', 'budgeting', 'compliance'],
  true
),
(
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222201',
  'Finance Lead',
  'Finance',
  ARRAY['financial-analysis', 'budgeting', 'forecasting', 'reporting'],
  true
);

-- ============================================================
-- 5. Tasks (8 with varied statuses/priorities)
-- ============================================================
INSERT INTO public.tasks (
  id, organization_id, title, description, status, priority,
  assigned_to, assigned_by, due_date, completed_at,
  source, tags, metadata
) VALUES
-- Task 1: urgent, due today, todo
(
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'Review Q4 financial report',
  'Final review of Q4 FY2025 financial report before board circulation. Check revenue figures, EBITDA margins, and cash flow projections.',
  'todo',
  'urgent',
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  CURRENT_DATE::timestamptz,
  NULL,
  'manual',
  ARRAY['finance', 'board'],
  '{"estimated_minutes": 45}'::jsonb
),
-- Task 2: high, due tomorrow, todo
(
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  'Prepare board meeting slides',
  'Create presentation deck for upcoming board meeting. Include Q4 results, Q1 outlook, and strategic initiatives update.',
  'todo',
  'high',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222201',
  (CURRENT_DATE + 1)::timestamptz,
  NULL,
  'manual',
  ARRAY['board', 'presentation'],
  '{}'::jsonb
),
-- Task 3: medium, done (completed)
(
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  'Follow up with Acme Corp on proposal',
  'Send follow-up email regarding the partnership proposal shared last week. Confirm pricing terms and timeline.',
  'done',
  'medium',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222201',
  CURRENT_DATE::timestamptz,
  now() - interval '3 hours',
  'manual',
  ARRAY['partnerships', 'sales'],
  '{}'::jsonb
),
-- Task 4: high, due today, in_progress, source=email
(
  '33333333-3333-3333-3333-333333333304',
  '11111111-1111-1111-1111-111111111111',
  'Draft investor update email',
  'Compose quarterly investor update covering key metrics, milestones, and next quarter roadmap.',
  'in_progress',
  'high',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222201',
  CURRENT_DATE::timestamptz,
  NULL,
  'email',
  ARRAY['investors', 'communications'],
  '{"email_thread_id": "inv-update-q4"}'::jsonb
),
-- Task 5: medium, due tomorrow, todo
(
  '33333333-3333-3333-3333-333333333305',
  '11111111-1111-1111-1111-111111111111',
  'Book flights for Mumbai trip',
  'Book round-trip flights Delhi to Mumbai for March 5-7. Preferred morning departure, aisle seat. Check Vistara and IndiGo.',
  'todo',
  'medium',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222201',
  (CURRENT_DATE + 1)::timestamptz,
  NULL,
  'manual',
  ARRAY['travel'],
  '{"trip": "mumbai-march-2026"}'::jsonb
),
-- Task 6: low, due in 2 days, todo
(
  '33333333-3333-3333-3333-333333333306',
  '11111111-1111-1111-1111-111111111111',
  'Review vendor contracts',
  'Annual review of IT vendor contracts. Check SLA compliance, renewal terms, and potential cost optimizations.',
  'todo',
  'low',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222201',
  (CURRENT_DATE + 2)::timestamptz,
  NULL,
  'manual',
  ARRAY['operations', 'contracts'],
  '{}'::jsonb
),
-- Task 7: high, due in 3 days, in_progress
(
  '33333333-3333-3333-3333-333333333307',
  '11111111-1111-1111-1111-111111111111',
  'Prepare Q1 budget presentation',
  'Build Q1 FY2026 budget presentation with department-level breakdowns, headcount plan, and capex projections.',
  'in_progress',
  'high',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222201',
  (CURRENT_DATE + 3)::timestamptz,
  NULL,
  'manual',
  ARRAY['finance', 'budget', 'presentation'],
  '{"progress_percent": 40}'::jsonb
),
-- Task 8: low, due in 5 days, todo
(
  '33333333-3333-3333-3333-333333333308',
  '11111111-1111-1111-1111-111111111111',
  'Schedule team building event',
  'Plan and schedule a team building event for the Operations and Finance teams. Consider outdoor activities near Gurgaon.',
  'todo',
  'low',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222201',
  (CURRENT_DATE + 5)::timestamptz,
  NULL,
  'manual',
  ARRAY['team', 'culture'],
  '{}'::jsonb
);

-- ============================================================
-- 6. Call Logs (4)
-- ============================================================
INSERT INTO public.call_logs (
  id, organization_id, user_id,
  caller_name, caller_phone, direction, status,
  duration_seconds, started_at, ended_at,
  transcript, summary, action_items, sentiment,
  metadata
) VALUES
-- Call 1: Priya, completed, 25 min ago, full AI summary
(
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Priya Sharma',
  '+91 98765 43211',
  'inbound',
  'completed',
  480,
  now() - interval '33 minutes',
  now() - interval '25 minutes',
  'Priya: Hi Satya, I wanted to discuss the Q1 marketing budget. We have the numbers from the agency and the digital spend is up 18% from last quarter. Satya: Okay, what is driving the increase? Priya: Mostly the new LinkedIn campaign and the TechVentures partnership. The ROI on LinkedIn has been strong — 3.2x — so I would recommend increasing allocation there. Satya: Makes sense. Can you get me the channel-by-channel breakdown from finance? I want to see the ad spend split before I sign off. Priya: Sure, I will have Vikram pull that together by Wednesday. Also, I will send you the TechVentures partnership email for review. Satya: Perfect. Let us also schedule a Q1 budget review meeting with marketing for next week. Priya: Will do. Talk soon.',
  'Priya called to discuss Q1 marketing budget. Digital spend is up 18% driven by LinkedIn campaigns (3.2x ROI) and TechVentures partnership. Satya requested channel-by-channel ad spend breakdown from finance before sign-off. Three action items identified: get finance breakdown, review TechVentures email, schedule budget review meeting.',
  '[
    {"title": "Request Q1 channel-by-channel ad spend breakdown from finance", "due_date": null},
    {"title": "Review TechVentures partnership email from Priya", "due_date": null},
    {"title": "Schedule Q1 budget review meeting with marketing", "due_date": null}
  ]'::jsonb,
  'positive',
  '{"ai_processed": true}'::jsonb
),
-- Call 2: Unknown number, missed, 1 hour ago
(
  '44444444-4444-4444-4444-444444444402',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  NULL,
  '+91 87654 32100',
  'inbound',
  'missed',
  0,
  now() - interval '1 hour',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{}'::jsonb
),
-- Call 3: Acme Corp Sales, completed, 2 hours ago
(
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Acme Corp - Sales',
  '+91 11 2345 6789',
  'inbound',
  'completed',
  128,
  now() - interval '2 hours 10 minutes',
  now() - interval '2 hours 8 minutes',
  'Acme Rep: Hello, this is Deepak from Acme Corp. I wanted to follow up on the pricing proposal we sent last Thursday. Satya: Yes, I saw it. We are reviewing internally but the enterprise tier pricing seems a bit steep. Acme Rep: We can offer a 15% volume discount for annual commitment. Satya: That is helpful. Let me discuss with my team and get back to you by end of week.',
  'Follow-up call from Acme Corp regarding pricing proposal. Enterprise tier pricing flagged as high. Acme offered 15% volume discount for annual commitment. Decision pending internal review, response expected by end of week.',
  '[{"title": "Review Acme Corp enterprise pricing internally", "due_date": null}]'::jsonb,
  'neutral',
  '{"ai_processed": true}'::jsonb
),
-- Call 4: Rahul Patel, voicemail, 3 hours ago
(
  '44444444-4444-4444-4444-444444444404',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Rahul Mehta',
  '+91 98765 43212',
  'inbound',
  'voicemail',
  45,
  now() - interval '3 hours',
  now() - interval '2 hours 59 minutes',
  'Hi Satya, this is Rahul. Just a quick heads up — the board meeting venue has been confirmed for the 28th at the Oberoi, Gurgaon. Conference room Durbar Hall, 10 AM. I have sent the calendar invite. Also, the AV setup will be ready by 9:30. Let me know if you need anything else. Thanks.',
  'Voicemail from Rahul confirming board meeting venue — Oberoi Gurgaon, Durbar Hall, 28th at 10 AM. AV setup at 9:30. Calendar invite sent.',
  NULL,
  NULL,
  '{}'::jsonb
);

-- ============================================================
-- 7. Follow Ups (3, linked to call_log #1)
-- ============================================================
INSERT INTO public.follow_ups (
  id, organization_id, call_log_id, assigned_to,
  action, status, due_date, task_id
) VALUES
(
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444401',
  '22222222-2222-2222-2222-222222222205',
  'Request Q1 channel-by-channel ad spend breakdown from finance',
  'pending',
  (CURRENT_DATE + 2)::timestamptz,
  NULL
),
(
  '55555555-5555-5555-5555-555555555502',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444401',
  '22222222-2222-2222-2222-222222222201',
  'Review TechVentures partnership email from Priya',
  'pending',
  (CURRENT_DATE + 1)::timestamptz,
  NULL
),
(
  '55555555-5555-5555-5555-555555555503',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444401',
  '22222222-2222-2222-2222-222222222202',
  'Schedule Q1 budget review meeting with marketing',
  'pending',
  (CURRENT_DATE + 3)::timestamptz,
  NULL
);

-- ============================================================
-- 8. Calendar Events (3 for today)
-- ============================================================
INSERT INTO public.calendar_events (
  id, organization_id, user_id,
  title, description, location,
  start_time, end_time, is_all_day,
  external_source, attendees, metadata
) VALUES
-- Event 1: Product Standup 10:00-11:00
(
  '66666666-6666-6666-6666-666666666601',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Product Standup',
  'Daily product standup — review sprint progress, blockers, and priorities.',
  'Google Meet',
  CURRENT_DATE::timestamptz + interval '10 hours',
  CURRENT_DATE::timestamptz + interval '11 hours',
  false,
  'google',
  '[
    {"email": "satya@contoso.com", "name": "Satya Nadella", "status": "accepted"},
    {"email": "priya@contoso.com", "name": "Priya Sharma", "status": "accepted"},
    {"email": "rahul@contoso.com", "name": "Rahul Mehta", "status": "accepted"}
  ]'::jsonb,
  '{"meet_link": "https://meet.google.com/abc-defg-hij"}'::jsonb
),
-- Event 2: Client Review 13:00-14:00
(
  '66666666-6666-6666-6666-666666666602',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Client Review - Acme Corp',
  'Quarterly business review with Acme Corp. Review engagement metrics, upcoming deliverables, and contract renewal.',
  'Zoom',
  CURRENT_DATE::timestamptz + interval '13 hours',
  CURRENT_DATE::timestamptz + interval '14 hours',
  false,
  'google',
  '[
    {"email": "satya@contoso.com", "name": "Satya Nadella", "status": "accepted"},
    {"email": "anita@contoso.com", "name": "Anita Desai", "status": "accepted"},
    {"email": "deepak@acmecorp.com", "name": "Deepak Verma", "status": "tentative"}
  ]'::jsonb,
  '{"zoom_link": "https://zoom.us/j/1234567890"}'::jsonb
),
-- Event 3: Weekly Sync 16:00-16:30
(
  '66666666-6666-6666-6666-666666666603',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Weekly Sync',
  'Weekly leadership sync — review OKR progress, escalations, and upcoming week priorities.',
  'Google Meet',
  CURRENT_DATE::timestamptz + interval '16 hours',
  CURRENT_DATE::timestamptz + interval '16 hours 30 minutes',
  false,
  'google',
  '[
    {"email": "satya@contoso.com", "name": "Satya Nadella", "status": "accepted"},
    {"email": "priya@contoso.com", "name": "Priya Sharma", "status": "accepted"},
    {"email": "vikram@contoso.com", "name": "Vikram Singh", "status": "accepted"},
    {"email": "anita@contoso.com", "name": "Anita Desai", "status": "pending"}
  ]'::jsonb,
  '{"meet_link": "https://meet.google.com/xyz-uvwx-yz1"}'::jsonb
);

-- ============================================================
-- 9. Reminders (2)
-- ============================================================
INSERT INTO public.reminders (
  id, organization_id, user_id,
  title, body, remind_at,
  is_fired, source
) VALUES
(
  '77777777-7777-7777-7777-777777777701',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Call Sarah about project update',
  'Follow up with Sarah regarding the Bangalore office project timeline and contractor availability.',
  CURRENT_DATE::timestamptz + interval '15 hours',
  false,
  'voice_command'
),
(
  '77777777-7777-7777-7777-777777777702',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Review contracts before Thursday',
  'Annual vendor contract review must be completed before Thursday board meeting.',
  (CURRENT_DATE + 2)::timestamptz + interval '9 hours',
  false,
  'manual'
);

-- ============================================================
-- 10. Emails (3 inbound)
-- ============================================================
INSERT INTO public.emails (
  id, organization_id, user_id,
  from_address, from_name, to_address,
  subject, body_text, classification, summary,
  is_read, is_archived, received_at
) VALUES
-- Email 1: Investor — action required, unread
(
  '88888888-8888-8888-8888-888888888801',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'investor@acmecapital.com',
  'Meera Kapoor',
  'satya@contoso.com',
  'Q4 Returns & Portfolio Review Request',
  'Hi Satya,

Hope you are doing well. I wanted to schedule a call to discuss the Q4 returns and our portfolio allocation for the next quarter. We have seen strong performance in the SaaS vertical and would like to explore increasing our position.

Could you share the latest investor deck and block 30 minutes this week?

Best regards,
Meera Kapoor
Partner, Acme Capital',
  'action_required',
  'Investor Meera Kapoor requesting Q4 returns discussion and portfolio review. Wants latest investor deck and a 30-minute call this week.',
  false,
  false,
  now() - interval '2 hours'
),
-- Email 2: Priya — FYI, read
(
  '88888888-8888-8888-8888-888888888802',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'priya@contoso.com',
  'Priya Sharma',
  'satya@contoso.com',
  'FYI: Team Offsite Venue Confirmed',
  'Hi Satya,

Just a heads up — I have confirmed the venue for next month team offsite. We will be at the Taj Rishikesh Resort, March 14-16. Activities include rafting, team workshops, and a leadership dinner.

Budget is within the approved INR 8L. I will share the detailed itinerary by Friday.

Thanks,
Priya',
  'fyi',
  'Priya confirmed team offsite at Taj Rishikesh Resort, March 14-16. Budget within approved INR 8L. Itinerary to follow by Friday.',
  true,
  false,
  now() - interval '5 hours'
),
-- Email 3: Zoom notification — meeting, read
(
  '88888888-8888-8888-8888-888888888803',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'noreply@zoom.us',
  'Zoom',
  'satya@contoso.com',
  'Meeting Scheduled: Client Review - Acme Corp',
  'A meeting has been scheduled.

Topic: Client Review - Acme Corp
Date: Today, 1:00 PM - 2:00 PM IST
Join Link: https://zoom.us/j/1234567890

Do not reply to this email.',
  'meeting',
  'Zoom notification for Client Review - Acme Corp meeting scheduled today 1:00-2:00 PM IST.',
  true,
  false,
  now() - interval '6 hours'
);

-- ============================================================
-- 11. Notifications (5)
-- ============================================================
INSERT INTO public.notifications (
  id, organization_id, user_id,
  title, body, channel, category,
  reference_type, reference_id,
  is_read, delivered_at
) VALUES
-- Notification 1: Task assigned, unread
(
  '99999999-9999-9999-9999-999999999901',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Task Assigned: Review Q4 financial report',
  'Priya Sharma assigned you a task: Review Q4 financial report (urgent, due today)',
  'in_app',
  'task',
  'task',
  '33333333-3333-3333-3333-333333333301',
  false,
  now() - interval '1 hour'
),
-- Notification 2: Call summary ready, unread
(
  '99999999-9999-9999-9999-999999999902',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Call Summary Ready: Priya Sharma',
  'AI summary generated for your 8-minute call with Priya Sharma. 3 follow-up items identified.',
  'in_app',
  'call',
  'call_log',
  '44444444-4444-4444-4444-444444444401',
  false,
  now() - interval '25 minutes'
),
-- Notification 3: Meeting reminder, read
(
  '99999999-9999-9999-9999-999999999903',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Meeting in 15 min: Product Standup',
  'Product Standup starts at 10:00 AM on Google Meet with Priya Sharma and Rahul Mehta.',
  'in_app',
  'reminder',
  'calendar_event',
  '66666666-6666-6666-6666-666666666601',
  true,
  now() - interval '3 hours'
),
-- Notification 4: Task completed, read
(
  '99999999-9999-9999-9999-999999999904',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Task Completed: Follow up with Acme Corp',
  'Anita Desai completed the task: Follow up with Acme Corp on proposal.',
  'in_app',
  'task',
  'task',
  '33333333-3333-3333-3333-333333333303',
  true,
  now() - interval '3 hours'
),
-- Notification 5: Missed call, unread
(
  '99999999-9999-9999-9999-999999999905',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'Missed Call: +91 87654 32100',
  'You missed a call from +91 87654 32100 at ' || to_char(now() - interval '1 hour', 'HH:MI AM') || '.',
  'in_app',
  'call',
  'call_log',
  '44444444-4444-4444-4444-444444444402',
  false,
  now() - interval '1 hour'
);

-- ============================================================
-- 12. Digests (1 — morning briefing)
-- ============================================================
INSERT INTO public.digests (
  id, organization_id, user_id,
  digest_type, content, summary,
  delivered_at, is_read
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'morning',
  '{
    "tasks": [
      {"id": "33333333-3333-3333-3333-333333333301", "title": "Review Q4 financial report", "status": "todo", "priority": "urgent", "due_date": null},
      {"id": "33333333-3333-3333-3333-333333333304", "title": "Draft investor update email", "status": "in_progress", "priority": "high", "due_date": null},
      {"id": "33333333-3333-3333-3333-333333333302", "title": "Prepare board meeting slides", "status": "todo", "priority": "high", "due_date": null}
    ],
    "events": [
      {"id": "66666666-6666-6666-6666-666666666601", "title": "Product Standup", "start_time": null, "end_time": null, "location": "Google Meet"},
      {"id": "66666666-6666-6666-6666-666666666602", "title": "Client Review - Acme Corp", "start_time": null, "end_time": null, "location": "Zoom"},
      {"id": "66666666-6666-6666-6666-666666666603", "title": "Weekly Sync", "start_time": null, "end_time": null, "location": "Google Meet"}
    ],
    "follow_ups": [
      {"id": "55555555-5555-5555-5555-555555555501", "action": "Request Q1 channel-by-channel ad spend breakdown from finance", "due_date": null},
      {"id": "55555555-5555-5555-5555-555555555502", "action": "Review TechVentures partnership email from Priya", "due_date": null}
    ],
    "reminders": [
      {"id": "77777777-7777-7777-7777-777777777701", "title": "Call Sarah about project update", "remind_at": null}
    ]
  }'::jsonb,
  'Good morning, Satya. You have 1 urgent task (Q4 financial report review), 2 high-priority items in progress, 3 meetings today, and 2 pending follow-ups from your call with Priya. Your first meeting is Product Standup at 10 AM.',
  CURRENT_DATE::timestamptz + interval '7 hours',
  false
);

-- ============================================================
-- 13. App Events (2 — audit log)
-- ============================================================
INSERT INTO public.app_events (
  organization_id, event_type, source_workflow, payload
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'user_login',
  NULL,
  '{
    "user_id": "22222222-2222-2222-2222-222222222201",
    "user_email": "satya@contoso.com",
    "device": "iPhone 15 Pro",
    "os": "iOS 18.3",
    "app_version": "1.0.0",
    "ip_city": "New Delhi"
  }'::jsonb
),
(
  '11111111-1111-1111-1111-111111111111',
  'command_executed',
  'voice_command',
  '{
    "user_id": "22222222-2222-2222-2222-222222222201",
    "command_text": "Remind me to call Sarah about the project update at 3 PM",
    "intent": "set_reminder",
    "confidence": 0.95,
    "processing_ms": 320,
    "result": "success"
  }'::jsonb
);

COMMIT;

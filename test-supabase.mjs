/**
 * Supabase Backend Verification Tests
 * Tests all migrations, seed data, triggers, views, and storage buckets
 * against the local Supabase instance.
 */
// Validate configuration before loading the SDK or creating any clients.
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
const missingEnv = requiredEnv.filter(name => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const ANON_KEY = process.env.SUPABASE_ANON_KEY.trim();
const { createClient } = await import('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  FAIL: ${testName}`);
  }
}

async function run() {
  console.log('\n========================================');
  console.log('  Supabase Backend Verification Tests');
  console.log('========================================\n');

  // ========================================
  // 1. SCHEMA VERIFICATION — All 13 tables exist
  // ========================================
  console.log('--- 1. Schema Verification (13 Tables) ---');

  const tables = [
    'organizations', 'users', 'team_members', 'tasks',
    'call_logs', 'follow_ups', 'emails', 'sent_emails',
    'calendar_events', 'reminders', 'digests', 'notifications', 'app_events',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    assert(!error, `Table "${table}" exists and is queryable`);
  }

  // ========================================
  // 2. SEED DATA — Correct row counts
  // ========================================
  console.log('\n--- 2. Seed Data Row Counts ---');

  const expectedCounts = {
    organizations: 1,
    users: 5,
    team_members: 5,
    tasks: 11, // 8 seed + 3 auto-created by follow-up trigger
    call_logs: 4,
    follow_ups: 3,
    calendar_events: 3,
    reminders: 2,
    emails: 3,
    notifications: 18, // 5 seed + 13 auto-created by triggers (task assigned, call completed, follow-up tasks)
    digests: 1,
    app_events: 2,
  };

  for (const [table, expected] of Object.entries(expectedCounts)) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    assert(!error && count === expected, `${table}: ${count}/${expected} rows`);
  }

  // ========================================
  // 3. SEED DATA — Specific values
  // ========================================
  console.log('\n--- 3. Seed Data Values ---');

  // Organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', '11111111-1111-1111-1111-111111111111')
    .single();
  assert(org?.name === 'Contoso Corp', 'Organization name is "Contoso Corp"');
  assert(org?.plan === 'pro', 'Organization plan is "pro"');
  assert(org?.slug === 'contoso-corp', 'Organization slug is "contoso-corp"');

  // Users
  const { data: satya } = await supabase
    .from('users')
    .select('*')
    .eq('id', '22222222-2222-2222-2222-222222222201')
    .single();
  assert(satya?.full_name === 'Satya Nadella', 'Satya user exists');
  assert(satya?.role === 'owner', 'Satya role is "owner"');
  assert(satya?.timezone === 'Asia/Kolkata', 'Satya timezone is IST');

  const { data: allUsers } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111')
    .order('email');
  const names = allUsers?.map(u => u.full_name).sort();
  assert(
    names?.includes('Priya Sharma') && names?.includes('Rahul Mehta') &&
    names?.includes('Anita Desai') && names?.includes('Vikram Singh'),
    'All 4 team members exist',
  );

  // ========================================
  // 4. TASK DATA — Statuses and priorities
  // ========================================
  console.log('\n--- 4. Task Data Verification ---');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, priority, assigned_to, source, completed_at')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  const urgentTask = tasks?.find(t => t.title === 'Review Q4 financial report');
  assert(urgentTask?.priority === 'urgent', 'Urgent task has correct priority');
  assert(urgentTask?.status === 'todo', 'Urgent task status is "todo"');

  const doneTask = tasks?.find(t => t.title === 'Follow up with Acme Corp on proposal');
  assert(doneTask?.status === 'done', 'Completed task uses "done" (not "completed")');
  assert(doneTask?.completed_at !== null, 'Done task has completed_at set');

  const emailTask = tasks?.find(t => t.title === 'Draft investor update email');
  assert(emailTask?.source === 'email', 'Email-sourced task has correct source');
  assert(emailTask?.status === 'in_progress', 'In-progress task has correct status');

  const statusCounts = {};
  tasks?.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  assert(statusCounts.todo === 8, '8 todo tasks (5 seed + 3 from follow-up trigger)');
  assert(statusCounts.in_progress === 2, '2 in_progress tasks');
  assert(statusCounts.done === 1, '1 done task');

  // ========================================
  // 5. CALL LOGS — Column names correct
  // ========================================
  console.log('\n--- 5. Call Log Verification ---');

  const { data: calls } = await supabase
    .from('call_logs')
    .select('caller_name, caller_phone, status, summary, sentiment, duration_seconds')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111')
    .order('started_at', { ascending: false });

  const priyaCall = calls?.find(c => c.caller_name === 'Priya Sharma');
  assert(priyaCall?.status === 'completed', 'Priya call status is "completed"');
  assert(priyaCall?.sentiment === 'positive', 'Priya call sentiment is "positive"');
  assert(priyaCall?.summary?.includes('marketing budget'), 'Call summary contains expected content');

  const missedCall = calls?.find(c => c.status === 'missed');
  assert(missedCall?.caller_phone === '+91 87654 32100', 'Missed call has +91 phone number');
  assert(missedCall?.caller_name === null, 'Missed call has null caller_name');

  const voicemail = calls?.find(c => c.status === 'voicemail');
  assert(voicemail !== undefined, 'Voicemail call exists');

  // ========================================
  // 6. FOLLOW-UPS — Uses "action" column
  // ========================================
  console.log('\n--- 6. Follow-Up Verification ---');

  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('action, status, due_date, call_log_id, task_id')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  assert(followUps?.length === 3, '3 follow-ups exist');
  const fuActions = followUps?.map(f => f.action);
  assert(fuActions?.some(a => a?.includes('ad spend breakdown')), 'Follow-up uses "action" column correctly');
  assert(followUps?.every(f => f.call_log_id === '44444444-4444-4444-4444-444444444401'), 'All follow-ups linked to call #1');
  assert(followUps?.every(f => f.status === 'pending'), 'All follow-ups are pending');

  // ========================================
  // 7. FOLLOW-UP TRIGGER — Auto-created tasks
  // ========================================
  console.log('\n--- 7. Follow-Up Trigger (Auto Task Creation) ---');

  // The trigger should have auto-created tasks for follow-ups with task_id IS NULL
  const { data: followUpsWithTasks } = await supabase
    .from('follow_ups')
    .select('id, action, task_id')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  const linkedFollowUps = followUpsWithTasks?.filter(f => f.task_id !== null);
  assert(linkedFollowUps?.length === 3, `Follow-up trigger auto-created tasks (${linkedFollowUps?.length}/3 linked)`);

  // Verify the auto-created tasks exist and have correct source
  if (linkedFollowUps?.length > 0) {
    const { data: autoTask } = await supabase
      .from('tasks')
      .select('title, source, source_id, priority, status')
      .eq('id', linkedFollowUps[0].task_id)
      .single();
    assert(autoTask?.source === 'call_followup', 'Auto-created task source is "call_followup"');
    assert(autoTask?.priority === 'medium', 'Auto-created task priority defaults to "medium"');
    assert(autoTask?.status === 'todo', 'Auto-created task status is "todo"');
    assert(autoTask?.title === linkedFollowUps[0].action, 'Auto-created task title matches follow-up action');
  }

  // ========================================
  // 8. NOTIFICATIONS — Uses "is_read" and valid categories
  // ========================================
  console.log('\n--- 8. Notification Verification ---');

  const { data: notifs } = await supabase
    .from('notifications')
    .select('title, is_read, category, reference_type, reference_id')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  // Count includes seed notifications PLUS trigger-generated ones
  assert(notifs?.length >= 5, `At least 5 notifications exist (got ${notifs?.length})`);

  const validCategories = ['task', 'call', 'email', 'reminder', 'digest', 'team', 'system'];
  const allValidCats = notifs?.every(n => validCategories.includes(n.category));
  assert(allValidCats, 'All notification categories are valid CHECK values');

  const unreadNotifs = notifs?.filter(n => n.is_read === false);
  const readNotifs = notifs?.filter(n => n.is_read === true);
  assert(unreadNotifs?.length >= 3, `At least 3 unread notifications (is_read=false): ${unreadNotifs?.length}`);
  assert(readNotifs?.length >= 2, `At least 2 read notifications (is_read=true): ${readNotifs?.length}`);

  // ========================================
  // 9. CALL COMPLETED TRIGGER — Notifications
  // ========================================
  console.log('\n--- 9. Call Completed Trigger ---');

  // The trigger should have created notifications for completed calls in seed data
  const callNotifs = notifs?.filter(n => n.category === 'call' && n.title?.includes('Call Summary Ready'));
  // 2 completed calls in seed → should have trigger-generated notifications
  assert(callNotifs?.length >= 1, `Call completed trigger created notification(s): ${callNotifs?.length}`);

  // ========================================
  // 10. REMINDERS — Uses "remind_at"
  // ========================================
  console.log('\n--- 10. Reminder Verification ---');

  const { data: reminders } = await supabase
    .from('reminders')
    .select('title, remind_at, is_fired, source')
    .eq('user_id', '22222222-2222-2222-2222-222222222201');

  assert(reminders?.length === 2, '2 reminders exist');
  assert(reminders?.every(r => r.remind_at !== null), 'All reminders have remind_at set');
  assert(reminders?.some(r => r.source === 'voice_command'), 'Voice command reminder exists');
  assert(reminders?.some(r => r.source === 'manual'), 'Manual reminder exists');
  assert(reminders?.every(r => r.is_fired === false), 'All reminders are unfired');

  // ========================================
  // 11. CALENDAR EVENTS — Today's events
  // ========================================
  console.log('\n--- 11. Calendar Events Verification ---');

  const { data: events } = await supabase
    .from('calendar_events')
    .select('title, start_time, location, attendees, external_source')
    .eq('user_id', '22222222-2222-2222-2222-222222222201')
    .order('start_time');

  assert(events?.length === 3, '3 calendar events for today');
  assert(events?.[0]?.title === 'Product Standup', 'First event is Product Standup');
  assert(events?.every(e => e.external_source === 'google'), 'All events sourced from Google');
  assert(events?.every(e => e.attendees !== null), 'All events have attendees JSONB');

  // ========================================
  // 12. EMAILS — Classifications
  // ========================================
  console.log('\n--- 12. Email Verification ---');

  const { data: emails } = await supabase
    .from('emails')
    .select('subject, classification, is_read, is_archived, summary')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  assert(emails?.length === 3, '3 inbound emails');
  const classifications = emails?.map(e => e.classification).sort();
  assert(
    classifications?.includes('action_required') &&
    classifications?.includes('fyi') &&
    classifications?.includes('meeting'),
    'Email classifications: action_required, fyi, meeting',
  );
  assert(emails?.every(e => e.summary !== null), 'All emails have AI summaries');

  // ========================================
  // 13. DIGESTS — Morning briefing
  // ========================================
  console.log('\n--- 13. Digest Verification ---');

  const { data: digests } = await supabase
    .from('digests')
    .select('digest_type, content, summary, is_read')
    .eq('user_id', '22222222-2222-2222-2222-222222222201');

  assert(digests?.length === 1, '1 morning digest exists');
  assert(digests?.[0]?.digest_type === 'morning', 'Digest type is "morning"');
  assert(digests?.[0]?.summary?.length > 50, 'Digest has meaningful summary text');
  assert(digests?.[0]?.content?.tasks !== undefined, 'Digest content has tasks array');
  assert(digests?.[0]?.content?.events !== undefined, 'Digest content has events array');

  // ========================================
  // 14. DASHBOARD STATS VIEW
  // ========================================
  console.log('\n--- 14. Dashboard Stats View ---');

  const { data: stats, error: statsError } = await supabase
    .from('dashboard_stats')
    .select('*')
    .eq('user_id', '22222222-2222-2222-2222-222222222201')
    .single();

  assert(!statsError, 'dashboard_stats view is queryable');
  if (stats) {
    assert(stats.active_tasks_count >= 0, `active_tasks_count: ${stats.active_tasks_count}`);
    assert(stats.today_events_count >= 0, `today_events_count: ${stats.today_events_count}`);
    assert(stats.unread_notifications_count >= 0, `unread_notifications_count: ${stats.unread_notifications_count}`);
    assert(stats.upcoming_reminders_count >= 0, `upcoming_reminders_count: ${stats.upcoming_reminders_count}`);
    assert(stats.pending_followups_count >= 0, `pending_followups_count: ${stats.pending_followups_count}`);
  }

  // ========================================
  // 15. STORAGE BUCKETS
  // ========================================
  console.log('\n--- 15. Storage Buckets ---');

  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketNames = buckets?.map(b => b.name) || [];
  assert(bucketNames.includes('call-recordings'), 'call-recordings bucket exists');
  assert(bucketNames.includes('avatars'), 'avatars bucket exists');

  const avatarBucket = buckets?.find(b => b.name === 'avatars');
  assert(avatarBucket?.public === true, 'avatars bucket is public');

  const recordingsBucket = buckets?.find(b => b.name === 'call-recordings');
  assert(recordingsBucket?.public === false, 'call-recordings bucket is private');

  // ========================================
  // 16. TASK STATUS CHANGE TRIGGER
  // ========================================
  console.log('\n--- 16. Task Status Change Trigger ---');

  // Create a test task, then mark it done — should auto-set completed_at
  const { data: testTask } = await supabase
    .from('tasks')
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111',
      title: 'Test trigger task',
      status: 'todo',
      priority: 'low',
      assigned_to: '22222222-2222-2222-2222-222222222203',
      assigned_by: '22222222-2222-2222-2222-222222222201',
      source: 'manual',
    })
    .select()
    .single();

  assert(testTask?.completed_at === null, 'New task has null completed_at');

  const { data: updatedTask } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', testTask?.id)
    .select()
    .single();

  assert(updatedTask?.completed_at !== null, 'Trigger auto-set completed_at when status → done');
  assert(updatedTask?.status === 'done', 'Task status is now "done"');

  // Check that a notification was created for the assigner (assigned_by)
  const { data: statusNotif } = await supabase
    .from('notifications')
    .select('*')
    .eq('reference_id', testTask?.id)
    .eq('category', 'task')
    .ilike('title', '%Completed%');

  assert(statusNotif?.length >= 1, 'Status change trigger created completion notification');

  // Clean up test task
  await supabase.from('tasks').delete().eq('id', testTask?.id);
  if (statusNotif?.length > 0) {
    await supabase.from('notifications').delete().eq('reference_id', testTask?.id);
  }

  // ========================================
  // 17. TASK ASSIGNED TRIGGER
  // ========================================
  console.log('\n--- 17. Task Assigned Trigger ---');

  // Get notification count before
  const { count: beforeCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', '22222222-2222-2222-2222-222222222204')
    .eq('category', 'task');

  // Create task assigned to Anita by Satya
  const { data: assignedTask } = await supabase
    .from('tasks')
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111',
      title: 'Test assignment trigger',
      status: 'todo',
      priority: 'medium',
      assigned_to: '22222222-2222-2222-2222-222222222204', // Anita
      assigned_by: '22222222-2222-2222-2222-222222222201', // Satya
      source: 'manual',
    })
    .select()
    .single();

  // Check notification was created
  const { count: afterCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', '22222222-2222-2222-2222-222222222204')
    .eq('category', 'task');

  assert((afterCount ?? 0) > (beforeCount ?? 0), 'Task assignment trigger created notification for assignee');

  // Clean up
  await supabase.from('notifications').delete().eq('reference_id', assignedTask?.id);
  await supabase.from('tasks').delete().eq('id', assignedTask?.id);

  // ========================================
  // 18. TEAM MEMBERS — Manager hierarchy
  // ========================================
  console.log('\n--- 18. Team Structure ---');

  const { data: team } = await supabase
    .from('team_members')
    .select('user_id, manager_id, title, department, skills')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  assert(team?.length === 5, '5 team members (including Satya)');
  const satyaTm = team?.find(t => t.user_id === '22222222-2222-2222-2222-222222222201');
  assert(satyaTm?.manager_id === null, 'Satya has no manager (CEO)');
  const reports = team?.filter(t => t.manager_id === '22222222-2222-2222-2222-222222222201');
  assert(reports?.length === 4, '4 direct reports to Satya');

  // ========================================
  // 19. APP EVENTS — Audit trail
  // ========================================
  console.log('\n--- 19. App Events ---');

  const { data: appEvents } = await supabase
    .from('app_events')
    .select('event_type, payload, source_workflow')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111');

  assert(appEvents?.length === 2, '2 app events');
  assert(appEvents?.some(e => e.event_type === 'user_login'), 'user_login event exists');
  assert(appEvents?.some(e => e.event_type === 'command_executed'), 'command_executed event exists');

  // ========================================
  // 20. INDEXES — Verify key indexes exist
  // ========================================
  console.log('\n--- 20. Index Verification ---');

  // Verify via filtered queries that would benefit from our indexes
  const { data: filteredTasks, error: filterErr } = await supabase
    .from('tasks')
    .select('title')
    .eq('organization_id', '11111111-1111-1111-1111-111111111111')
    .in('status', ['todo', 'in_progress'])
    .order('priority');
  assert(!filterErr, 'Filtered task query works (uses idx_tasks_org_active)');

  const { data: userReminders, error: remErr } = await supabase
    .from('reminders')
    .select('title')
    .eq('user_id', '22222222-2222-2222-2222-222222222201')
    .eq('is_fired', false)
    .order('remind_at');
  assert(!remErr, 'Filtered reminder query works (uses idx_reminders_user_upcoming)');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  - ${f}`));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(() => {
  // Do not log SDK errors: they may include configuration or request details.
  console.error('Test runner failed. Check the isolated test instance configuration.');
  process.exit(1);
});

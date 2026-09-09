import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BriefingRequest {
  user_id: string;
  organization_id: string;
  digest_type?: 'morning' | 'evening' | 'weekly';
}

interface DigestContentPayload {
  tasks_summary: { total: number; urgent: number; due_today: number };
  events: { title: string; time: string; location: string | null }[];
  follow_ups: { pending: number };
  reminders: { title: string; time: string }[];
  calls: { total: number; missed: number };
  unread_notifications: number;
}

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  // Verify authentication
  const { userId: authUserId, error: authError } = await verifyAuth(req);
  if (authError) {
    return jsonResponse({ success: false, error: authError }, req, 401);
  }

  try {
    const { user_id, organization_id, digest_type = 'morning' }: BriefingRequest =
      await req.json();

    if (!user_id || !organization_id) {
      return jsonResponse({
        success: false,
        error: 'user_id and organization_id are required.',
      }, req, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build date boundaries for today
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).toISOString();

    // Query all data in parallel — log errors but continue with partial data
    const [
      tasksResult,
      eventsResult,
      followUpsResult,
      remindersResult,
      notificationsResult,
      callsResult,
    ] = await Promise.all([
      // Active tasks
      supabase
        .from('tasks')
        .select('title, status, priority, due_date, assigned_to')
        .eq('organization_id', organization_id)
        .in('status', ['todo', 'in_progress'])
        .order('priority', { ascending: true })
        .limit(20)
        .then((res) => {
          if (res.error) console.error('Tasks query error:', res.error);
          return res;
        }),

      // Today's calendar events
      supabase
        .from('calendar_events')
        .select('title, start_time, end_time, location, attendees')
        .eq('user_id', user_id)
        .gte('start_time', todayStart)
        .lt('start_time', tomorrowStart)
        .order('start_time', { ascending: true })
        .then((res) => {
          if (res.error) console.error('Events query error:', res.error);
          return res;
        }),

      // Pending follow-ups
      supabase
        .from('follow_ups')
        .select('action, due_date')
        .eq('organization_id', organization_id)
        .eq('status', 'pending')
        .then((res) => {
          if (res.error) console.error('Follow-ups query error:', res.error);
          return res;
        }),

      // Upcoming reminders
      supabase
        .from('reminders')
        .select('title, remind_at')
        .eq('user_id', user_id)
        .eq('is_fired', false)
        .gte('remind_at', now.toISOString())
        .lt('remind_at', tomorrowStart)
        .order('remind_at', { ascending: true })
        .then((res) => {
          if (res.error) console.error('Reminders query error:', res.error);
          return res;
        }),

      // Unread notification count
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('is_read', false)
        .then((res) => {
          if (res.error) console.error('Notifications query error:', res.error);
          return res;
        }),

      // Recent calls (last 24 hours)
      supabase
        .from('call_logs')
        .select('caller_name, status, summary, started_at')
        .eq('organization_id', organization_id)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false })
        .then((res) => {
          if (res.error) console.error('Calls query error:', res.error);
          return res;
        }),
    ]);

    const tasks = tasksResult.data || [];
    const events = eventsResult.data || [];
    const followUps = followUpsResult.data || [];
    const reminders = remindersResult.data || [];
    const unreadCount = notificationsResult.count || 0;
    const calls = callsResult.data || [];

    // Sort tasks by priority (urgent first) — map priority to numeric
    const priorityOrder: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    tasks.sort(
      (a: { priority: string }, b: { priority: string }) =>
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0),
    );

    // Build context for Claude
    const contextParts: string[] = [];

    contextParts.push(`ACTIVE TASKS (${tasks.length} total):`);
    if (tasks.length > 0) {
      for (const t of tasks) {
        const dueStr = t.due_date ? ` | Due: ${t.due_date}` : '';
        contextParts.push(`  - [${t.priority.toUpperCase()}] ${t.title} (${t.status})${dueStr}`);
      }
    } else {
      contextParts.push('  No active tasks.');
    }

    contextParts.push(`\nTODAY'S SCHEDULE (${events.length} events):`);
    if (events.length > 0) {
      for (const e of events) {
        const time = new Date(e.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const loc = e.location ? ` @ ${e.location}` : '';
        contextParts.push(`  - ${time}: ${e.title}${loc}`);
      }
    } else {
      contextParts.push('  No events scheduled today.');
    }

    contextParts.push(`\nPENDING FOLLOW-UPS (${followUps.length}):`);
    if (followUps.length > 0) {
      for (const f of followUps) {
        const dueStr = f.due_date ? ` (due: ${f.due_date})` : '';
        contextParts.push(`  - ${f.action}${dueStr}`);
      }
    } else {
      contextParts.push('  No pending follow-ups.');
    }

    contextParts.push(`\nUPCOMING REMINDERS (${reminders.length}):`);
    if (reminders.length > 0) {
      for (const r of reminders) {
        const time = new Date(r.remind_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        contextParts.push(`  - ${time}: ${r.title}`);
      }
    } else {
      contextParts.push('  No upcoming reminders.');
    }

    contextParts.push(`\nRECENT CALLS (last 24h): ${calls.length} total`);
    const missedCalls = calls.filter((c: { status: string }) => c.status === 'missed');
    if (calls.length > 0) {
      contextParts.push(`  Missed: ${missedCalls.length}`);
      for (const c of calls) {
        const name = c.caller_name || 'Unknown';
        const time = new Date(c.started_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const summaryStr = c.summary ? ` — ${c.summary}` : '';
        contextParts.push(`  - ${time}: ${name} (${c.status})${summaryStr}`);
      }
    }

    contextParts.push(`\nUNREAD NOTIFICATIONS: ${unreadCount}`);

    // Call Claude to generate briefing
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are an AI executive assistant generating a ${digest_type} briefing for a busy executive.

Be direct and concise. Lead with what needs attention first. Use bullet points.
Structure: Priority items first, then schedule, then FYIs.

Generate a 3-5 paragraph briefing. No greeting needed — start with the most important item.`,
        messages: [
          {
            role: 'user',
            content: `Here is today's data:\n\n${contextParts.join('\n')}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      return jsonResponse({
        success: false,
        error: 'Failed to generate briefing from AI.',
        details: errText,
      }, req, 500);
    }

    const claudeData = await claudeResponse.json();
    const summary = claudeData.content[0].text;

    // Build structured content JSONB
    const urgentTasks = tasks.filter((t: { priority: string }) => t.priority === 'urgent');
    const dueTodayTasks = tasks.filter(
      (t: { due_date: string | null }) =>
        t.due_date && t.due_date.startsWith(todayStart.split('T')[0]),
    );

    const content: DigestContentPayload = {
      tasks_summary: {
        total: tasks.length,
        urgent: urgentTasks.length,
        due_today: dueTodayTasks.length,
      },
      events: events.map((e: { title: string; start_time: string; location: string | null }) => ({
        title: e.title,
        time: e.start_time,
        location: e.location,
      })),
      follow_ups: { pending: followUps.length },
      reminders: reminders.map((r: { title: string; remind_at: string }) => ({
        title: r.title,
        time: r.remind_at,
      })),
      calls: {
        total: calls.length,
        missed: missedCalls.length,
      },
      unread_notifications: unreadCount,
    };

    // Insert into digests table
    const { data: digest, error: insertError } = await supabase
      .from('digests')
      .insert({
        organization_id,
        user_id,
        digest_type,
        content,
        summary,
        delivered_at: new Date().toISOString(),
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Digest insert error:', insertError);
      return jsonResponse({
        success: false,
        error: 'Failed to save briefing.',
        details: String(insertError),
      }, req, 500);
    }

    return jsonResponse({
      success: true,
      digest,
    }, req);
  } catch (error) {
    console.error('generate-briefing error:', error);
    return jsonResponse({
      success: false,
      error: 'Something went wrong generating the briefing. Please try again.',
      details: String(error),
    }, req, 500);
  }
});

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CommandRequest {
  text: string;
  organization_id: string;
  user_id: string;
}

interface ParsedIntent {
  intent:
    | 'create_task'
    | 'set_reminder'
    | 'send_email'
    | 'query_info'
    | 'delegate_task'
    | 'unknown';
  parameters: Record<string, unknown>;
  confidence: number;
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
    const { text, organization_id, user_id }: CommandRequest = await req.json();

    // Step 1: Parse intent using Claude
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
        system: `You are an AI executive assistant command parser. Given a natural language command, parse it into a structured intent. Return JSON only, no markdown.

Possible intents:
- create_task: { title, description, priority (low/medium/high/urgent), due_date (ISO), assigned_to_name }
- set_reminder: { title, body, remind_at (ISO datetime) }
- send_email: { to_address, intent_summary, tone (professional/friendly/urgent) }
- query_info: { query_type (schedule/tasks/calls/team), filters }
- delegate_task: { task_title, assignee_name, notes }
- unknown: { original_text }

Always include confidence (0-1).`,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const claudeData = await claudeResponse.json();
    const intentText = claudeData.content[0].text;
    const parsed: ParsedIntent = JSON.parse(
      intentText.replace(/```json?\n?/g, '').replace(/```/g, ''),
    );

    // Step 2: Execute the intent
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let response = '';

    switch (parsed.intent) {
      case 'create_task': {
        const params = parsed.parameters as {
          title: string;
          priority?: string;
          due_date?: string;
          description?: string;
        };
        const { error } = await supabase
          .from('tasks')
          .insert({
            organization_id,
            title: params.title,
            description: params.description || null,
            priority: params.priority || 'medium',
            due_date: params.due_date || null,
            source: 'voice_command',
            status: 'todo',
          })
          .select()
          .single();
        if (error) throw error;
        response = `Created task "${params.title}" with ${params.priority || 'medium'} priority.`;
        break;
      }
      case 'set_reminder': {
        const params = parsed.parameters as {
          title: string;
          body?: string;
          remind_at: string;
        };
        const { error } = await supabase.from('reminders').insert({
          organization_id,
          user_id,
          title: params.title,
          body: params.body || null,
          remind_at: params.remind_at,
          source: 'voice_command',
        });
        if (error) throw error;
        response = `Reminder set: "${params.title}" at ${new Date(params.remind_at).toLocaleString()}.`;
        break;
      }
      case 'send_email': {
        const params = parsed.parameters as {
          to_address: string;
          intent_summary: string;
          tone?: string;
        };
        response = `Email draft prepared for ${params.to_address}. Tone: ${params.tone || 'professional'}. Summary: "${params.intent_summary}". Ready to send.`;
        break;
      }
      case 'query_info': {
        const params = parsed.parameters as {
          query_type: string;
          filters?: Record<string, unknown>;
        };
        if (params.query_type === 'schedule') {
          const today = new Date();
          const start = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          ).toISOString();
          const end = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
          ).toISOString();
          const { data } = await supabase
            .from('calendar_events')
            .select('title, start_time, end_time, location')
            .eq('organization_id', organization_id)
            .gte('start_time', start)
            .lte('start_time', end)
            .order('start_time', { ascending: true });
          const events = data || [];
          response = events.length
            ? `You have ${events.length} event(s) today: ${events.map((e: { title: string; start_time: string }) => `${e.title} at ${new Date(e.start_time).toLocaleTimeString()}`).join(', ')}.`
            : 'You have no events scheduled for today.';
        } else if (params.query_type === 'tasks') {
          const { data } = await supabase
            .from('tasks')
            .select('title, status, priority')
            .eq('organization_id', organization_id)
            .in('status', ['todo', 'in_progress'])
            .order('priority', { ascending: true })
            .limit(5);
          const tasks = data || [];
          response = tasks.length
            ? `You have ${tasks.length} active task(s): ${tasks.map((t: { title: string }) => t.title).join(', ')}.`
            : 'You have no active tasks.';
        } else {
          response = `Querying ${params.query_type}...`;
        }
        break;
      }
      case 'delegate_task': {
        const params = parsed.parameters as {
          task_title: string;
          assignee_name: string;
          notes?: string;
        };
        response = `Delegation prepared: "${params.task_title}" to ${params.assignee_name}.${params.notes ? ` Notes: ${params.notes}` : ''}`;
        break;
      }
      default:
        response =
          "I'm not sure how to handle that. Could you rephrase your request?";
    }

    return jsonResponse({
      intent: parsed.intent,
      response,
      confidence: parsed.confidence,
      data: parsed.parameters,
    }, req);
  } catch (error) {
    return jsonResponse({
      intent: 'unknown',
      response:
        'Something went wrong processing your command. Please try again.',
      error: String(error),
    }, req, 500);
  }
});

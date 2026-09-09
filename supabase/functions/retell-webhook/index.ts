import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RETELL_WEBHOOK_SECRET = Deno.env.get('RETELL_WEBHOOK_SECRET') || '';

interface RetellCallData {
  call_id: string;
  transcript?: string;
  recording_url?: string;
  to_number?: string;
  from_number?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  disconnection_reason?: string;
  metadata?: {
    call_log_id?: string;
    user_id?: string;
    organization_id?: string;
    purpose?: string;
  };
  call_analysis?: {
    call_summary?: string;
    custom_analysis_data?: Record<string, unknown>;
  };
}

interface RetellWebhookPayload {
  event: string;
  call: RetellCallData;
}

interface ClaudeAnalysis {
  summary: string;
  action_items: { title: string; due_date: string | null }[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

async function verifyRetellSignature(req: Request, body: string): Promise<boolean> {
  if (!RETELL_WEBHOOK_SECRET) {
    console.warn('RETELL_WEBHOOK_SECRET not set — skipping signature verification');
    return true; // Allow in dev when secret not configured
  }

  const signature = req.headers.get('x-retell-signature');
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(RETELL_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

async function analyzeTranscript(transcript: string): Promise<ClaudeAnalysis> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are an AI assistant that analyzes phone call transcripts for an executive assistant app. Return JSON only, no markdown wrapping.

Return format:
{
  "summary": "2-3 sentence summary of the call",
  "action_items": [{"title": "action item description", "due_date": null}],
  "sentiment": "positive" | "neutral" | "negative"
}

Guidelines:
- Keep the summary concise and business-focused
- Extract concrete action items (things someone needs to do)
- Assess overall sentiment of the conversation
- If there are no clear action items, return an empty array`,
      messages: [
        {
          role: 'user',
          content: `Analyze this phone call transcript:\n\n${transcript}`,
        },
      ],
    }),
  });

  const claudeData = await response.json();
  const responseText = claudeData.content[0].text;
  return JSON.parse(
    responseText.replace(/```json?\n?/g, '').replace(/```/g, ''),
  );
}

serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read raw body and verify webhook signature
    const rawBody = await req.text();
    const isValid = await verifyRetellSignature(req, rawBody);
    if (!isValid) {
      return jsonResponse({ success: false, error: 'Invalid webhook signature' }, req, 401);
    }
    const { event, call }: RetellWebhookPayload = JSON.parse(rawBody);

    if (!event || !call) {
      return jsonResponse({ success: false, error: 'Invalid webhook payload' }, req, 400);
    }

    const retellCallId = call.call_id;
    const metadata = call.metadata;

    switch (event) {
      case 'call_started': {
        // Update metadata to note call is in progress
        if (retellCallId) {
          await supabase
            .from('call_logs')
            .update({
              metadata: { retell_event: 'call_started' },
            })
            .eq('retell_call_id', retellCallId);
        }
        break;
      }

      case 'call_ended': {
        if (!retellCallId) {
          console.error('call_ended event missing call_id');
          break;
        }

        // Calculate duration from timestamps or use duration_ms
        let durationSeconds = 0;
        if (call.duration_ms) {
          durationSeconds = Math.round(call.duration_ms / 1000);
        } else if (call.start_timestamp && call.end_timestamp) {
          durationSeconds = Math.round(
            (call.end_timestamp - call.start_timestamp) / 1000,
          );
        }

        // Determine status based on disconnection reason
        let status: 'completed' | 'missed' | 'voicemail' | 'failed' = 'completed';
        if (call.disconnection_reason === 'voicemail_reached') {
          status = 'voicemail';
        } else if (
          call.disconnection_reason === 'no_answer' ||
          call.disconnection_reason === 'busy'
        ) {
          status = 'missed';
        } else if (
          call.disconnection_reason === 'error' ||
          call.disconnection_reason === 'machine_detected'
        ) {
          status = 'failed';
        }

        // Update call_logs with basic call data
        const { error: updateError } = await supabase
          .from('call_logs')
          .update({
            transcript: call.transcript ?? null,
            recording_url: call.recording_url ?? null,
            duration_seconds: durationSeconds,
            ended_at: new Date().toISOString(),
            status,
            metadata: {
              retell_event: 'call_ended',
              disconnection_reason: call.disconnection_reason ?? null,
            },
          })
          .eq('retell_call_id', retellCallId);

        if (updateError) {
          console.error('Failed to update call_log on call_ended:', updateError);
          break;
        }

        // If we have a transcript, run AI analysis
        if (call.transcript && call.transcript.trim().length > 0) {
          try {
            const analysis = await analyzeTranscript(call.transcript);

            // Update call_logs with AI analysis
            await supabase
              .from('call_logs')
              .update({
                summary: analysis.summary,
                action_items: analysis.action_items,
                sentiment: analysis.sentiment,
              })
              .eq('retell_call_id', retellCallId);

            // Fetch the call_log to get IDs for follow-ups and notifications
            const { data: callLog } = await supabase
              .from('call_logs')
              .select('id, organization_id, user_id, caller_name')
              .eq('retell_call_id', retellCallId)
              .single();

            if (callLog && analysis.action_items.length > 0) {
              // Create follow_ups from action items
              const followUps = analysis.action_items.map((item) => ({
                organization_id: callLog.organization_id,
                call_log_id: callLog.id,
                assigned_to: callLog.user_id,
                action: item.title,
                status: 'pending',
                due_date: item.due_date,
              }));

              await supabase.from('follow_ups').insert(followUps);
            }

            // Create notification for the user
            if (callLog) {
              const callerLabel = callLog.caller_name || 'Unknown';
              await supabase.from('notifications').insert({
                organization_id: callLog.organization_id,
                user_id: callLog.user_id,
                title: `Call with ${callerLabel} complete`,
                body: `Summary ready${analysis.action_items.length > 0 ? ` — ${analysis.action_items.length} action item${analysis.action_items.length > 1 ? 's' : ''} extracted` : ''}`,
                channel: 'in_app',
                category: 'call',
                reference_type: 'call_log',
                reference_id: callLog.id,
                action_url: `/comms/${callLog.id}`,
                is_read: false,
              });
            }
          } catch (analysisError) {
            console.error('AI analysis failed:', analysisError);
            // Non-fatal — call data is already saved
          }
        }
        break;
      }

      case 'call_analyzed': {
        // Retell's own analysis — merge any extra data
        if (retellCallId && call.call_analysis) {
          const existingSummary = call.call_analysis.call_summary;
          if (existingSummary) {
            await supabase
              .from('call_logs')
              .update({
                metadata: {
                  retell_event: 'call_analyzed',
                  retell_analysis: call.call_analysis,
                },
              })
              .eq('retell_call_id', retellCallId);
          }
        }
        break;
      }

      default: {
        console.warn(`Unhandled Retell webhook event: ${event}`);
      }
    }

    return jsonResponse({ success: true }, req);
  } catch (error) {
    console.error('Retell webhook error:', error);
    return jsonResponse(
      {
        success: false,
        error: 'Webhook processing failed',
        details: String(error),
      },
      req,
      500,
    );
  }
});

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')!;
const RETELL_AGENT_ID = Deno.env.get('RETELL_AGENT_ID')!;
const RETELL_PHONE_NUMBER = Deno.env.get('RETELL_PHONE_NUMBER')!;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InitiateCallRequest {
  to_number: string;
  to_name: string;
  purpose: string;
  call_log_id: string;
  user_id: string;
  organization_id: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  // Verify authentication
  const { userId: authUserId, error: authError } = await verifyAuth(req);
  if (authError) {
    return jsonResponse({ success: false, error: authError }, req, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const {
      to_number,
      to_name,
      purpose,
      call_log_id,
      user_id,
      organization_id,
    }: InitiateCallRequest = await req.json();

    if (!to_number || !call_log_id) {
      return jsonResponse({
        success: false,
        error: 'Missing required fields: to_number and call_log_id',
      }, req, 400);
    }

    // Call Retell API to create a phone call
    const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: RETELL_AGENT_ID,
        to_number,
        from_number: RETELL_PHONE_NUMBER,
        metadata: {
          call_log_id,
          user_id,
          organization_id,
          purpose,
        },
        retell_llm_dynamic_variables: {
          contact_name: to_name,
          call_purpose: purpose,
        },
      }),
    });

    if (!retellResponse.ok) {
      const retellError = await retellResponse.text();
      console.error('Retell API error:', retellResponse.status, retellError);

      // Mark call log as failed
      await supabase
        .from('call_logs')
        .update({ status: 'failed' })
        .eq('id', call_log_id);

      return jsonResponse({
        success: false,
        error: `Retell API error: ${retellResponse.status}`,
        details: retellError,
      }, req, 502);
    }

    const retellData = await retellResponse.json();
    const retellCallId = retellData.call_id;

    // Update call_logs row with the Retell call ID
    const { error: updateError } = await supabase
      .from('call_logs')
      .update({ retell_call_id: retellCallId })
      .eq('id', call_log_id);

    if (updateError) {
      console.error('Failed to update call_log with retell_call_id:', updateError);
    }

    return jsonResponse({
      success: true,
      retell_call_id: retellCallId,
      call_id: retellData.call_id,
    }, req);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to initiate call. Please try again.',
      details: String(error),
    }, req, 500);
  }
});

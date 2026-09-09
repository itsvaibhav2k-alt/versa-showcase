import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

interface SendEmailRequest {
  sent_email_id: string;
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
    const { sent_email_id }: SendEmailRequest = await req.json();

    if (!sent_email_id) {
      return jsonResponse({ success: false, error: 'sent_email_id is required' }, req, 400);
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the sent_email record
    const { data: record, error: fetchError } = await supabase
      .from('sent_emails')
      .select('*')
      .eq('id', sent_email_id)
      .single();

    if (fetchError || !record) {
      return jsonResponse({
        success: false,
        error: 'Email record not found',
        details: fetchError?.message,
      }, req, 404);
    }

    // Only allow sending from draft or sending status
    if (record.status !== 'draft' && record.status !== 'sending') {
      return jsonResponse({
        success: false,
        error: `Cannot send email with status '${record.status}'`,
      }, req, 400);
    }

    // Update status to 'sending'
    await supabase
      .from('sent_emails')
      .update({ status: 'sending' })
      .eq('id', sent_email_id);

    // Call Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [record.to_address],
        subject: record.subject,
        html: record.body_html,
        text: record.body_text,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      // Mark as failed
      await supabase
        .from('sent_emails')
        .update({ status: 'failed' })
        .eq('id', sent_email_id);

      return jsonResponse({
        success: false,
        error: 'Resend API error',
        details: resendData?.message || resendData?.error || 'Unknown error',
      }, req, 502);
    }

    // Success — update record with resend_id, status, sent_at
    await supabase
      .from('sent_emails')
      .update({
        resend_id: resendData.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', sent_email_id);

    return jsonResponse({
      success: true,
      resend_id: resendData.id,
    }, req);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to send email. Please try again.',
      details: String(error),
    }, req, 500);
  }
});

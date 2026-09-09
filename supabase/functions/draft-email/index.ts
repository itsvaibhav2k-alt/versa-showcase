import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;

interface DraftEmailRequest {
  to_address: string;
  to_name: string;
  intent: string;
  tone: 'professional' | 'friendly' | 'urgent';
  from_name: string;
  from_title: string;
  organization_name: string;
}

interface DraftEmailResponse {
  subject: string;
  body_html: string;
  body_text: string;
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
    const {
      to_address,
      to_name,
      intent,
      tone,
      from_name,
      from_title,
      organization_name,
    }: DraftEmailRequest = await req.json();

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are an AI executive assistant that drafts professional emails. Return JSON only, no markdown wrapping.

Return format:
{
  "subject": "email subject line",
  "body_html": "full HTML email body with proper formatting",
  "body_text": "plain text version of the email"
}

Guidelines:
- Match the requested tone (professional/friendly/urgent)
- Keep emails concise but complete
- Include proper greeting and sign-off
- Use the sender's name and title in the signature
- HTML should use simple inline styles for compatibility`,
        messages: [
          {
            role: 'user',
            content: `Draft an email with the following details:
- To: ${to_name} (${to_address})
- From: ${from_name}, ${from_title} at ${organization_name}
- Intent/Purpose: ${intent}
- Tone: ${tone}`,
          },
        ],
      }),
    });

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0].text;
    const draft: DraftEmailResponse = JSON.parse(
      responseText.replace(/```json?\n?/g, '').replace(/```/g, ''),
    );

    return jsonResponse({
      success: true,
      to_address,
      to_name,
      subject: draft.subject,
      body_html: draft.body_html,
      body_text: draft.body_text,
    }, req);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to draft email. Please try again.',
      details: String(error),
    }, req, 500);
  }
});

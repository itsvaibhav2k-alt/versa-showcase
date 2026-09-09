import { supabase, invokeWithTimeout } from '@/src/lib/supabase';
import type { SentEmail } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface CreateDraftInput {
  organization_id: string;
  user_id: string;
  to_address: string;
  to_name?: string | null;
  subject: string;
  body_text?: string | null;
  body_html?: string | null;
  tone?: 'professional' | 'friendly' | 'urgent' | null;
  prompt?: string | null;
  ai_drafted?: boolean;
  in_reply_to?: string | null;
}

export interface UpdateDraftInput {
  to_address?: string;
  to_name?: string | null;
  subject?: string;
  body_text?: string | null;
  body_html?: string | null;
  tone?: 'professional' | 'friendly' | 'urgent' | null;
  prompt?: string | null;
}

export const sentEmailsService = {
  async listSent(orgId: string, status?: string): Promise<Result<SentEmail[]>> {
    let query = supabase
      .from('sent_emails')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return err(error.message);
    return ok(data as SentEmail[]);
  },

  async getById(id: string): Promise<Result<SentEmail>> {
    const { data, error } = await supabase
      .from('sent_emails')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as SentEmail);
  },

  async createDraft(input: CreateDraftInput): Promise<Result<SentEmail>> {
    const { data, error } = await supabase
      .from('sent_emails')
      .insert({
        ...input,
        status: 'draft',
        ai_drafted: input.ai_drafted ?? false,
      })
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as SentEmail);
  },

  async updateDraft(id: string, input: UpdateDraftInput): Promise<Result<SentEmail>> {
    const { data, error } = await supabase
      .from('sent_emails')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as SentEmail);
  },

  async markSending(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('sent_emails')
      .update({ status: 'sending' })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async markSent(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('sent_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async markFailed(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('sent_emails')
      .update({ status: 'failed' })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async send(id: string): Promise<Result<{ resend_id: string }>> {
    const { data, error } = await invokeWithTimeout('send-email', {
      body: { sent_email_id: id },
    });
    if (error) return err(error.message);
    if (data?.success === false) return err(data.error || 'Failed to send email');
    return ok({ resend_id: data?.resend_id });
  },
};

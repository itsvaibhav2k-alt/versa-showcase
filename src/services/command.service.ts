import { invokeWithTimeout } from '@/src/lib/supabase';
import { ok, err, type Result } from '@/src/types/api';

export interface CommandResponse {
  message: string;
  actions?: Record<string, unknown>[];
}

export const commandService = {
  async processCommand(
    text: string,
    orgId: string,
    userId: string,
  ): Promise<Result<CommandResponse>> {
    try {
      const { data, error } = await invokeWithTimeout('process-command', {
        body: { text, organization_id: orgId, user_id: userId },
      });
      if (error) return err(error.message);
      return ok(data as CommandResponse);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error processing command';
      return err(message);
    }
  },
};

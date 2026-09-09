import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callsService, type CreateCallLogInput } from '@/src/services/calls.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export interface CreateCallWithRetellInput extends CreateCallLogInput {
  purpose?: string;
}

export function useCreateCallLog() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateCallWithRetellInput) => {
      // 1. Create the call log entry
      const result = await callsService.create(orgId!, data);
      if (!result.isOk) throw new Error(result.error);
      const newLog = result.value;

      // 2. Initiate the Retell AI call
      const initiateResult = await callsService.initiateCall(
        newLog.id,
        data.caller_phone,
        data.caller_name ?? 'Unknown',
        data.purpose || 'General call',
      );

      if (!initiateResult.isOk) {
        // Mark call as failed if Retell initiation fails
        // The edge function already does this, but ensure local state reflects it
        throw new Error(initiateResult.error);
      }

      return newLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.callLogs] });
      // Post-call processing is triggered by Retell's webhook when the call
      // completes, not here — the call has only just been initiated at this
      // point so there is no transcript or final duration yet.
    },
  });
}

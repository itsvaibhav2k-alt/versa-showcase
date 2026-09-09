import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal, Clock, Calendar, Smile, Circle, Frown, Zap, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallLog } from '@/src/hooks/use-call-logs';
import { useFollowUpsByCall, useCompleteFollowUp } from '@/src/hooks/use-follow-ups';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { useAuth } from '@/src/hooks/use-auth';
import { useRealtimeSubscription } from '@/src/hooks/use-realtime';
import { formatDuration, formatRelative } from '@/src/utils/date';
import { formatPhoneNumber } from '@/src/utils/format';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Avatar } from '@/src/components/ui/avatar';
import { TranscriptViewer } from '@/src/components/calls/transcript-viewer';
import { FollowUpCard } from '@/src/components/calls/follow-up-card';
import { Skeleton } from '@/src/components/ui/skeleton';
import { VersaBottomSheet } from '@/src/components/ui/versa-bottom-sheet';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics';
import { colors, shadows } from '@/src/lib/design-tokens';
import { supabase } from '@/src/lib/supabase';
import { QUERY_KEYS } from '@/src/lib/constants';
import { webhookService } from '@/src/services/webhook.service';

const SENTIMENT_CONFIG: Record<string, { label: string; bg: string; text: string; icon: LucideIcon; iconColor: string }> = {
  positive: { label: 'Positive', bg: 'bg-sage-light', text: 'text-sage', icon: Smile, iconColor: colors.sage.DEFAULT },
  neutral: { label: 'Neutral', bg: 'bg-versa-muted', text: 'text-ink-secondary', icon: Circle, iconColor: colors.text.secondary },
  negative: { label: 'Negative', bg: 'bg-coral-light', text: 'text-coral', icon: Frown, iconColor: colors.coral.DEFAULT },
};

export default function CallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  const { data: callLog, isLoading: callLoading } = useCallLog(id);
  const { data: followUps } = useFollowUpsByCall(id);
  const { data: teamMembers } = useTeamMembers();
  const completeFollowUp = useCompleteFollowUp();

  useRealtimeSubscription('call_logs', [QUERY_KEYS.callLogs]);
  useRealtimeSubscription('follow_ups', [QUERY_KEYS.followUps]);

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const summaryTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [showFollowUpSheet, setShowFollowUpSheet] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [followUpAction, setFollowUpAction] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [followUpAssignee, setFollowUpAssignee] = useState<string | null>(null);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);

  const callerName = callLog?.caller_name ?? null;
  const callerPhone = callLog ? formatPhoneNumber(callLog.caller_phone) : '';
  const duration = callLog ? formatDuration(callLog.duration_seconds) : '0:00';
  const date = callLog ? formatRelative(callLog.started_at) : '';
  const sentiment = callLog?.sentiment ?? 'neutral';
  const summary = callLog?.summary ?? null;
  const sentimentConfig = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;

  const transcriptMessages = callLog?.transcript
    ? (typeof callLog.transcript === 'object' && Array.isArray(callLog.transcript)
      ? (callLog.transcript as { id: string; speaker: 'caller' | 'agent'; speakerName: string; text: string; timestamp: string }[])
      : [{ id: '1', speaker: 'caller' as const, speakerName: callerName ?? 'Caller', text: String(callLog.transcript), timestamp: '' }])
    : [];

  // Reset generating state when summary arrives via realtime
  useEffect(() => {
    if (summary && isGeneratingSummary) {
      setIsGeneratingSummary(false);
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
    }
  }, [summary, isGeneratingSummary]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerateSummary = async () => {
    if (!callLog) return;
    setIsGeneratingSummary(true);
    await webhookService.triggerPostCallProcessing({
      call_log_id: callLog.id,
      user_id: callLog.user_id,
      organization_id: callLog.organization_id,
      caller_name: callLog.caller_name,
      caller_phone: callLog.caller_phone,
      transcript: typeof callLog.transcript === 'string' ? callLog.transcript : null,
      duration_seconds: callLog.duration_seconds,
    }).catch(console.warn);
    // Realtime subscription will update the data when n8n writes the summary.
    // Set a timeout as fallback to clear the loading state.
    summaryTimeoutRef.current = setTimeout(() => setIsGeneratingSummary(false), 30000);
  };

  const handleCreateFollowUp = async () => {
    if (!followUpAction.trim() || !orgId) return;
    setIsCreatingFollowUp(true);
    const { error } = await supabase.from('follow_ups').insert({
      call_log_id: id,
      organization_id: orgId,
      assigned_to: followUpAssignee,
      action: followUpAction.trim(),
      due_date: followUpDueDate || null,
      status: 'pending',
    });
    setIsCreatingFollowUp(false);
    if (error) {
      showToast('error', 'Failed to create follow-up');
      return;
    }
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.followUps] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    hapticSuccess();
    showToast('success', 'Follow-up created');
    setShowFollowUpSheet(false);
    setFollowUpAction('');
    setFollowUpAssignee(null);
  };

  const handleAssignToMember = (memberName: string) => {
    hapticSuccess();
    showToast('success', `Assigned to ${memberName}`);
    setShowAssignSheet(false);
  };

  const handleCompleteFollowUp = (followUpId: string) => {
    completeFollowUp.mutate(followUpId, {
      onSuccess: () => {
        hapticSuccess();
        showToast('success', 'Follow-up completed');
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      },
    });
  };

  const displayFollowups = followUps?.map((f) => ({
    id: f.id,
    action: f.action,
    dueDate: f.due_date ? formatRelative(f.due_date) : null,
    status: f.status,
  })) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-versa-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Header with centered title and three-dot menu */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white active:bg-versa-hover"
          >
            <ChevronLeft size={14} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              fontFamily: 'DMSans_600SemiBold',
              color: colors.text.primary,
            }}
          >
            Call Details
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {callLoading && !callLog && (
              <Skeleton width={20} height={20} rounded />
            )}
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-xl bg-white active:bg-versa-hover"
            >
              <MoreHorizontal size={20} color={colors.text.secondary} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        <Card variant="hero" className="mt-4">
          <View className="items-center">
            <View
              style={{
                ...shadows.cardHover,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Avatar name={callerName ?? 'Unknown'} size="xl" />
              </View>
            </View>
            <Text className="mt-3 text-xl font-display text-ink">
              {callerName ?? 'Unknown Caller'}
            </Text>
            <Text className="mt-1 text-sm text-ink-secondary">
              {callerPhone}
            </Text>
          </View>

          <View className="mt-5 flex-row items-center justify-center gap-6">
            <View className="flex-row items-center">
              <Clock size={14} color={colors.text.muted} strokeWidth={1.5} />
              <Text className="ml-1.5 text-sm font-body-medium font-mono text-ink-secondary">
                {duration}
              </Text>
            </View>
            <View className="h-3.5 w-px bg-warm-border" />
            <View className="flex-row items-center">
              <Calendar size={14} color={colors.text.muted} strokeWidth={1.5} />
              <Text className="ml-1.5 text-sm font-body-medium text-ink-secondary">
                {date}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-center gap-2">
            <Badge label="Completed" />
            <View className={`flex-row items-center rounded-full px-2.5 py-1 ${sentimentConfig.bg}`}>
              {React.createElement(sentimentConfig.icon, { size: 12, color: sentimentConfig.iconColor, strokeWidth: 1.5 })}
              <Text className={`ml-1.5 text-xs font-body-bold capitalize ${sentimentConfig.text}`}>
                {sentimentConfig.label}
              </Text>
            </View>
          </View>
        </Card>

        {/* AI Summary */}
        {isGeneratingSummary ? (
          <View
            style={{
              backgroundColor: colors.plum.light,
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              marginTop: 16,
              ...shadows.card,
            }}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.bg.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={14} color={colors.plum.DEFAULT} strokeWidth={1.5} />
              </View>
              <Text className="ml-2.5 text-base font-body-bold text-ink">
                Generating Summary...
              </Text>
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Skeleton width="100%" height={14} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="70%" height={14} />
            </View>
          </View>
        ) : summary ? (
          <View
            style={{
              backgroundColor: colors.plum.light,
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              marginTop: 16,
              ...shadows.card,
            }}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.bg.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadows.subtle,
                }}
              >
                <Zap size={14} color={colors.plum.DEFAULT} strokeWidth={1.5} />
              </View>
              <Text className="ml-2.5 text-base font-body-bold text-ink">
                AI Summary
              </Text>
            </View>
            <Text className="mt-3 text-base leading-relaxed text-ink-secondary">
              {summary}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleGenerateSummary}
            style={{
              backgroundColor: colors.plum.light,
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              ...shadows.card,
            }}
          >
            <Sparkles size={18} color={colors.plum.DEFAULT} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                fontFamily: 'DMSans_600SemiBold',
                color: colors.plum.DEFAULT,
              }}
            >
              Generate AI Summary
            </Text>
          </Pressable>
        )}

        {/* Follow-ups (moved BEFORE Transcript) */}
        <View className="mt-7">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-body-bold text-ink">
              Follow-ups
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(212,147,13,0.1)',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.velvet.DEFAULT }}>
                {displayFollowups.length} items
              </Text>
            </View>
          </View>
          <View className="mt-3 gap-2.5">
            {displayFollowups.length > 0 ? (
              displayFollowups.map((followup) => (
                <FollowUpCard
                  key={followup.id}
                  action={followup.action}
                  dueDate={followup.dueDate}
                  completed={followup.status === 'completed'}
                  onToggle={(completed) => {
                    if (completed) {
                      handleCompleteFollowUp(followup.id);
                    }
                  }}
                />
              ))
            ) : (
              <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.text.muted, textAlign: 'center', paddingVertical: 16 }}>
                No follow-ups for this call
              </Text>
            )}
          </View>
        </View>

        {/* Transcript (moved AFTER Follow-ups) */}
        <View className="mt-7">
          <Text className="text-lg font-body-bold text-ink">
            Transcript
          </Text>
          <View className="mt-3">
            {transcriptMessages.length > 0 ? (
              <TranscriptViewer messages={transcriptMessages} />
            ) : (
              <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.text.muted, textAlign: 'center', paddingVertical: 16 }}>
                No transcript available
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Action Bar */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 12,
          paddingBottom: 100,
          backgroundColor: colors.bg.card,
          borderTopWidth: 1,
          borderTopColor: colors.border.DEFAULT,
        }}
      >
        {callLog?.status === 'missed' && (
          <Pressable
            onPress={() => {
              hapticLight();
              Linking.openURL(`tel:${callLog.caller_phone}`);
            }}
            style={{
              flex: 1,
              backgroundColor: colors.sage.light,
              borderWidth: 1,
              borderColor: 'rgba(91,140,90,0.2)',
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.sage.DEFAULT, fontSize: 14, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' }}>
              Call Back
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            hapticLight();
            setShowAssignSheet(true);
          }}
          style={{
            flex: 1,
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.text.body, fontSize: 14, fontWeight: '500', fontFamily: 'DMSans_500Medium' }}>
            Assign to Team
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            setShowFollowUpSheet(true);
          }}
          style={{
            flex: 1,
            backgroundColor: colors.velvet.DEFAULT,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.fab,
          }}
        >
          <Text style={{ color: colors.text.onVelvet, fontSize: 14, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' }}>
            Create Follow-up
          </Text>
        </Pressable>
      </View>

      {/* Create Follow-up Bottom Sheet */}
      <VersaBottomSheet
        isOpen={showFollowUpSheet}
        onClose={() => setShowFollowUpSheet(false)}
        snapPoints={['65%']}
        title="Create Follow-up"
      >
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium', color: colors.text.secondary, marginBottom: 8 }}>
              Action *
            </Text>
            <TextInput
              value={followUpAction}
              onChangeText={setFollowUpAction}
              placeholder="e.g. Send proposal by Friday"
              placeholderTextColor={colors.text.muted}
              style={{
                backgroundColor: colors.bg.card,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 14,
                fontFamily: 'DMSans_400Regular',
                color: colors.text.body,
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium', color: colors.text.secondary, marginBottom: 8 }}>
              Due Date
            </Text>
            <TextInput
              value={followUpDueDate}
              onChangeText={setFollowUpDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.muted}
              style={{
                backgroundColor: colors.bg.card,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 14,
                fontFamily: 'DMSans_400Regular',
                color: colors.text.body,
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium', color: colors.text.secondary, marginBottom: 8 }}>
              Assign To
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {teamMembers?.map((member) => (
                  <Pressable
                    key={member.id}
                    onPress={() => setFollowUpAssignee(
                      followUpAssignee === member.id ? null : member.id,
                    )}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: followUpAssignee === member.id ? colors.velvet.DEFAULT : colors.border.DEFAULT,
                      backgroundColor: followUpAssignee === member.id ? colors.velvet.wash : colors.bg.card,
                    }}
                  >
                    <Avatar name={member.user?.full_name ?? 'Unknown'} size="sm" />
                    <Text style={{
                      fontSize: 13,
                      fontFamily: 'DMSans_500Medium',
                      color: followUpAssignee === member.id ? colors.velvet.DEFAULT : colors.text.body,
                    }}>
                      {member.user?.full_name ?? 'Unknown'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <Pressable
            onPress={handleCreateFollowUp}
            disabled={!followUpAction.trim() || isCreatingFollowUp}
            style={{
              backgroundColor: followUpAction.trim() ? colors.velvet.DEFAULT : colors.bg.muted,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{
              color: followUpAction.trim() ? colors.text.onVelvet : colors.text.muted,
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'DMSans_600SemiBold',
            }}>
              {isCreatingFollowUp ? 'Creating...' : 'Create'}
            </Text>
          </Pressable>
        </View>
      </VersaBottomSheet>

      {/* Assign to Team Bottom Sheet */}
      <VersaBottomSheet
        isOpen={showAssignSheet}
        onClose={() => setShowAssignSheet(false)}
        snapPoints={['50%']}
        title="Assign to Team Member"
      >
        <View style={{ gap: 8 }}>
          {teamMembers?.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => handleAssignToMember(member.user?.full_name ?? 'Unknown')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: colors.bg.card,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
              }}
            >
              <Avatar name={member.user?.full_name ?? 'Unknown'} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', fontFamily: 'DMSans_600SemiBold', color: colors.text.primary }}>
                  {member.user?.full_name ?? 'Unknown'}
                </Text>
                {member.title && (
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.text.secondary, marginTop: 2 }}>
                    {member.title}
                  </Text>
                )}
              </View>
              <ChevronRight size={16} color={colors.text.muted} strokeWidth={1.5} />
            </Pressable>
          ))}
          {(!teamMembers || teamMembers.length === 0) && (
            <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.text.muted, textAlign: 'center', paddingVertical: 24 }}>
              No team members found
            </Text>
          )}
        </View>
      </VersaBottomSheet>
    </SafeAreaView>
  );
}

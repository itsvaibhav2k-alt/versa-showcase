import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Copy, Forward, RotateCcw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useSentEmail } from '@/src/hooks/use-sent-emails';
import { Avatar } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ErrorState } from '@/src/components/ui/error-state';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics';
import { formatRelative, formatTime } from '@/src/utils/date';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  sent: { label: 'SENT', bg: colors.sage.light, text: colors.sage.DEFAULT },
  draft: { label: 'DRAFT', bg: colors.velvet.dim, text: colors.velvet.DEFAULT },
  sending: { label: 'SENDING', bg: colors.sky.light, text: colors.sky.DEFAULT },
  failed: { label: 'FAILED', bg: colors.coral.light, text: colors.coral.DEFAULT },
};

const TONE_LABELS: Record<string, string> = {
  professional: 'Professional tone',
  friendly: 'Friendly tone',
  urgent: 'Urgent tone',
};

export default function SentEmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: email, isLoading, isError } = useSentEmail(id);

  const handleCopy = async () => {
    hapticLight();
    if (!email?.body_text) return;
    await Clipboard.setStringAsync(email.body_text);
    hapticSuccess();
    showToast('success', 'Copied to clipboard');
  };

  const handleForward = () => {
    hapticLight();
    if (!email) return;
    router.push({
      pathname: '/(modals)/email-compose',
      params: {
        subject: `Fwd: ${email.subject}`,
        prompt: email.body_text ?? '',
      },
    } as never);
  };

  const handleResend = () => {
    hapticLight();
    if (!email) return;
    router.push({
      pathname: '/(modals)/email-compose',
      params: {
        to: email.to_address,
        subject: email.subject,
        prompt: email.prompt ?? email.body_text ?? '',
        tone: email.tone ?? 'professional',
      },
    } as never);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <Skeleton height={20} />
            <View style={{ marginTop: 8 }}><Skeleton height={14} /></View>
            <View style={{ marginTop: 8 }}><Skeleton height={14} /></View>
          </View>
          <View style={{ marginTop: space[5] }}><Skeleton height={24} /></View>
          <View style={[styles.bodyCard, { marginTop: space[5] }]}>
            <Skeleton height={14} />
            <View style={{ marginTop: 8 }}><Skeleton height={14} /></View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !email) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState message="Could not load this email." onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  const recipientDisplay = email.to_name || email.to_address;
  const statusCfg = STATUS_CONFIG[email.status];
  const toneLabel = email.tone ? TONE_LABELS[email.tone] : null;
  const dateStr = email.sent_at ?? email.created_at;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Email</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Avatar name={recipientDisplay} size="md" />
            <View style={styles.heroInfo}>
              <Text style={styles.recipientName}>To: {recipientDisplay}</Text>
              {email.to_name && (
                <Text style={styles.recipientEmail}>{email.to_address}</Text>
              )}
              <Text style={styles.timeText}>
                {formatRelative(dateStr)} {'\u00B7'} {formatTime(dateStr)}
              </Text>
            </View>
          </View>

          {/* Status + AI pills */}
          <View style={styles.pillsRow}>
            {statusCfg && (
              <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.badgeText, { color: statusCfg.text }]}>
                  {statusCfg.label}
                </Text>
              </View>
            )}
            {email.ai_drafted && (
              <View style={[styles.badge, { backgroundColor: colors.plum.light }]}>
                <Sparkles size={10} color={colors.plum.DEFAULT} strokeWidth={2} />
                <Text style={[styles.badgeText, { color: colors.plum.DEFAULT, marginLeft: 4 }]}>
                  AI DRAFTED
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Subject */}
        <Text style={styles.subject}>{email.subject}</Text>

        {/* AI Generation Note */}
        {email.ai_drafted && (
          <View style={styles.aiNoteCard}>
            <View style={styles.aiNoteHeader}>
              <Sparkles size={16} color={colors.plum.DEFAULT} strokeWidth={1.5} />
              <Text style={styles.aiNoteLabel}>GENERATED BY VERSA AI</Text>
            </View>
            <Text style={styles.aiNoteContent}>
              {toneLabel ? `${toneLabel}` : 'AI drafted'}
              {email.prompt ? ` \u00B7 "${email.prompt}"` : ''}
            </Text>
          </View>
        )}

        {/* Email Body */}
        <View style={styles.bodyCard}>
          {email.body_text ? (
            <Text style={styles.bodyText}>{email.body_text}</Text>
          ) : (
            <Text style={styles.noContentText}>No content</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <Pressable onPress={handleForward} style={styles.actionButton}>
          <Forward size={18} color={colors.text.body} strokeWidth={1.5} />
          <Text style={styles.actionButtonText}>Forward</Text>
        </Pressable>
        <Pressable onPress={handleCopy} style={styles.actionButton}>
          <Copy size={18} color={colors.text.body} strokeWidth={1.5} />
          <Text style={styles.actionButtonText}>Copy</Text>
        </Pressable>
        {email.status === 'failed' && (
          <Pressable onPress={handleResend} style={styles.actionButton}>
            <RotateCcw size={18} color={colors.coral.DEFAULT} strokeWidth={1.5} />
            <Text style={[styles.actionButtonText, { color: colors.coral.DEFAULT }]}>Resend</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
  },
  headerTitle: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[4],
  },
  heroCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.card,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  heroInfo: {
    flex: 1,
  },
  recipientName: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  recipientEmail: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: space[1],
  },
  timeText: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginTop: space[1],
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subject: {
    ...typography.headingLg,
    color: colors.text.primary,
    marginTop: space[5],
  },
  aiNoteCard: {
    backgroundColor: colors.plum.light,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    marginTop: space[5],
    ...shadows.card,
  },
  aiNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  aiNoteLabel: {
    ...typography.caption,
    color: colors.plum.DEFAULT,
  },
  aiNoteContent: {
    ...typography.bodyMd,
    color: colors.text.body,
  },
  bodyCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    marginTop: space[5],
    ...shadows.card,
  },
  bodyText: {
    ...typography.bodyMd,
    color: colors.text.body,
    lineHeight: 22,
  },
  noContentText: {
    ...typography.bodyMd,
    color: colors.text.muted,
  },
  actionBar: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[4],
    paddingBottom: space[12],
    backgroundColor: colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.divider,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.body,
  },
});

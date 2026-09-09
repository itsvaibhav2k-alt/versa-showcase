import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useEmail, useMarkEmailRead, useArchiveEmail } from '@/src/hooks/use-emails';
import { formatRelative, formatTime } from '@/src/utils/date';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ErrorState } from '@/src/components/ui/error-state';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight } from '@/src/lib/haptics';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

const CLASSIFICATION_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  action_required: {
    label: 'ACTION REQUIRED',
    bg: colors.coral.light,
    text: colors.coral.DEFAULT,
  },
  meeting: {
    label: 'MEETING',
    bg: colors.sky.light,
    text: colors.sky.DEFAULT,
  },
  follow_up: {
    label: 'FOLLOW UP',
    bg: colors.velvet.wash,
    text: colors.velvet.DEFAULT,
  },
  fyi: {
    label: 'FYI',
    bg: colors.bg.muted,
    text: colors.text.secondary,
  },
  spam: {
    label: 'SPAM',
    bg: colors.coral.light,
    text: colors.coral.DEFAULT,
  },
  other: {
    label: 'OTHER',
    bg: colors.bg.muted,
    text: colors.text.secondary,
  },
};

export default function EmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: email, isLoading, isError } = useEmail(id);
  const markRead = useMarkEmailRead();
  const archiveEmail = useArchiveEmail();

  // Auto-mark as read when email loads
  useEffect(() => {
    if (email && !email.is_read) {
      markRead.mutate(email.id);
    }
  }, [email?.id, email?.is_read]);

  const handleReply = () => {
    hapticLight();
    router.push({
      pathname: '/(modals)/email-compose',
      params: { to: email?.from_address },
    });
  };

  const handleArchive = () => {
    hapticLight();
    if (!email) return;
    archiveEmail.mutate(email.id, {
      onSuccess: () => {
        showToast('success', 'Email archived');
        router.back();
      },
      onError: () => {
        showToast('error', 'Failed to archive email');
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Loading skeletons */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Skeleton height={20} className="w-2/3" />
            <View style={{ marginTop: 8 }}>
              <Skeleton height={14} className="w-1/2" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Skeleton height={14} className="w-1/3" />
            </View>
          </View>

          <View style={{ marginTop: space[5] }}>
            <Skeleton height={24} className="w-3/4" />
          </View>

          <View style={[styles.bodyCard, { marginTop: space[5] }]}>
            <Skeleton height={14} />
            <View style={{ marginTop: 8 }}>
              <Skeleton height={14} className="w-5/6" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Skeleton height={14} className="w-2/3" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !email) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          message="Could not load this email. Please try again."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const senderDisplay = email.from_name || email.from_address;
  const classification = email.classification
    ? CLASSIFICATION_CONFIG[email.classification]
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
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
          {/* From */}
          <Text style={styles.senderName}>{senderDisplay}</Text>
          {email.from_name && (
            <Text style={styles.senderEmail}>{email.from_address}</Text>
          )}

          {/* To */}
          <Text style={styles.recipientText}>To: {email.to_address}</Text>

          {/* Time */}
          <Text style={styles.timeText}>
            {formatRelative(email.received_at)} {'\u00B7'} {formatTime(email.received_at)}
          </Text>

          {/* Classification badge */}
          {classification && (
            <View style={[styles.badge, { backgroundColor: classification.bg }]}>
              <Text style={[styles.badgeText, { color: classification.text }]}>
                {classification.label}
              </Text>
            </View>
          )}
        </View>

        {/* Subject */}
        <Text style={styles.subject}>{email.subject}</Text>

        {/* AI Summary */}
        {email.summary ? (
          <View style={styles.aiSummaryCard}>
            <View style={styles.aiSummaryHeader}>
              <Sparkles size={16} color={colors.plum.DEFAULT} strokeWidth={1.5} />
              <Text style={styles.aiSummaryLabel}>AI SUMMARY</Text>
            </View>
            <Text style={styles.aiSummaryContent}>{email.summary}</Text>
          </View>
        ) : null}

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
        <Pressable
          onPress={handleReply}
          style={styles.replyButton}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </Pressable>
        <Pressable
          onPress={handleArchive}
          style={styles.archiveButton}
        >
          <Text style={styles.archiveButtonText}>Archive</Text>
        </Pressable>
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
  senderName: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  senderEmail: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: space[1],
  },
  recipientText: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginTop: space[2],
  },
  timeText: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginTop: space[1],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    marginTop: space[3],
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
    paddingHorizontal: space[5],
    marginTop: space[5],
  },
  aiSummaryCard: {
    backgroundColor: colors.plum.light,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    marginTop: space[5],
    ...shadows.card,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  aiSummaryLabel: {
    ...typography.caption,
    color: colors.plum.DEFAULT,
  },
  aiSummaryContent: {
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
  replyButton: {
    flex: 1,
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.onVelvet,
  },
  archiveButton: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.body,
  },
});

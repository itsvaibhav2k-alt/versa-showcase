import React, { useMemo, useCallback } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEmails } from '@/src/hooks/use-emails';
import { useRealtimeSubscription } from '@/src/hooks/use-realtime';
import { QUERY_KEYS } from '@/src/lib/constants';
import { colors, typography, space } from '@/src/lib/design-tokens';
import { isToday, isYesterday, isThisWeek } from '@/src/utils/date';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { EmailListItem } from '@/src/components/emails/email-list-item';
import type { Email } from '@/src/types/models';

interface EmailListProps {
  onEmailPress: (id: string) => void;
}

interface EmailSection {
  title: string;
  data: Email[];
}

const SECTION_ORDER = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'EARLIER'];

function groupEmailsByDate(emails: Email[]): EmailSection[] {
  const groups: Record<string, Email[]> = {};

  for (const email of emails) {
    let section: string;
    if (isToday(email.received_at)) {
      section = 'TODAY';
    } else if (isYesterday(email.received_at)) {
      section = 'YESTERDAY';
    } else if (isThisWeek(email.received_at)) {
      section = 'THIS WEEK';
    } else {
      section = 'EARLIER';
    }

    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(email);
  }

  return SECTION_ORDER
    .filter((title) => groups[title] && groups[title].length > 0)
    .map((title) => ({ title, data: groups[title] }));
}

export function EmailList({ onEmailPress }: EmailListProps) {
  const router = useRouter();
  const { data: emails, isLoading, refetch, isRefetching } = useEmails();
  useRealtimeSubscription('emails', [QUERY_KEYS.emails]);

  const sections = useMemo(
    () => groupEmailsByDate(emails ?? []),
    [emails],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Email; index: number }) => (
      <StaggeredFadeIn index={index}>
        <EmailListItem
          id={item.id}
          fromName={item.from_name}
          fromAddress={item.from_address}
          subject={item.subject}
          summary={item.summary}
          classification={item.classification}
          isRead={item.is_read}
          receivedAt={item.received_at}
          onPress={() => onEmailPress(item.id)}
        />
      </StaggeredFadeIn>
    ),
    [onEmailPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: EmailSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Email) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Mail size={48} color={colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.emptyHeading}>No emails yet</Text>
        <Text style={styles.emptySubtitle}>
          Emails will appear here as they arrive.
        </Text>
        <Pressable
          onPress={() => router.push('/(modals)/email-compose' as never)}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.emptyButtonPressed,
          ]}
        >
          <Text style={styles.emptyButtonText}>Compose Email</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.velvet.DEFAULT}
        />
      }
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    gap: space[3],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[8],
    paddingTop: space[12],
  },
  emptyHeading: {
    ...typography.headingMd,
    color: colors.text.primary,
    marginTop: space[4],
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: space[2],
  },
  emptyButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: space[4],
  },
  emptyButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  emptyButtonText: {
    color: colors.text.onVelvet,
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'DMSans_600SemiBold',
  },
  sectionHeader: {
    paddingHorizontal: space[4],
    paddingTop: space[6],
    paddingBottom: space[3],
    backgroundColor: colors.bg.deep,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  listContent: {
    paddingBottom: space[10],
  },
});

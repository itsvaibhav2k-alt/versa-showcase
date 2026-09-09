import React, { useMemo, useCallback } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSentEmails } from '@/src/hooks/use-sent-emails';
import { colors, typography, space } from '@/src/lib/design-tokens';
import { isToday, isYesterday, isThisWeek } from '@/src/utils/date';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { SentEmailListItem } from '@/src/components/emails/sent-email-list-item';
import type { SentEmail } from '@/src/types/models';

interface SentEmailListProps {
  status?: string;
  onEmailPress: (id: string) => void;
  listHeader?: React.ReactElement;
}

interface SentEmailSection {
  title: string;
  data: SentEmail[];
}

const SECTION_ORDER = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'EARLIER'];

function groupByDate(emails: SentEmail[]): SentEmailSection[] {
  const groups: Record<string, SentEmail[]> = {};

  for (const email of emails) {
    let section: string;
    if (isToday(email.created_at)) {
      section = 'TODAY';
    } else if (isYesterday(email.created_at)) {
      section = 'YESTERDAY';
    } else if (isThisWeek(email.created_at)) {
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

export function SentEmailList({ status, onEmailPress, listHeader }: SentEmailListProps) {
  const router = useRouter();
  const { data: emails, isLoading, refetch, isRefetching } = useSentEmails(status);

  const sections = useMemo(
    () => groupByDate(emails ?? []),
    [emails],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SentEmail; index: number }) => (
      <StaggeredFadeIn index={index}>
        <SentEmailListItem
          id={item.id}
          toName={item.to_name}
          toAddress={item.to_address}
          subject={item.subject}
          bodyPreview={item.body_text?.slice(0, 80) ?? null}
          status={item.status}
          tone={item.tone}
          aiDrafted={item.ai_drafted}
          createdAt={item.created_at}
          onPress={() => onEmailPress(item.id)}
        />
      </StaggeredFadeIn>
    ),
    [onEmailPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SentEmailSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: SentEmail) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {listHeader}
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </View>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {listHeader}
        <View style={styles.emptyContent}>
          <Mail size={48} color={colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyHeading}>
            {status === 'draft' ? 'No drafts yet' : 'No emails sent yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Tell Versa what to write and it handles the rest.
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
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={listHeader}
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
  },
  emptyContent: {
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

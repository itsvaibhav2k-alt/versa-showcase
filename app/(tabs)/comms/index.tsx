import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, SlidersHorizontal, Check, PenSquare, Plus } from 'lucide-react-native';
import { VersaBottomSheet } from '@/src/components/ui/versa-bottom-sheet';
import { UnderlineTabs } from '@/src/components/ui/underline-tabs';
import { EmailList } from '@/src/components/emails/email-list';
import { EmailSubTabs } from '@/src/components/emails/email-sub-tabs';
import { SentEmailList } from '@/src/components/emails/sent-email-list';
import { QuickComposeCard } from '@/src/components/emails/quick-compose-card';
import { useSentEmails } from '@/src/hooks/use-sent-emails';
import { useCallLogs } from '@/src/hooks/use-call-logs';
import { useCreateCallLog } from '@/src/hooks/use-create-call-log';
import { useEmails } from '@/src/hooks/use-emails';
import { useAuth } from '@/src/hooks/use-auth';
import { useRealtimeSubscription } from '@/src/hooks/use-realtime';
import { QUERY_KEYS } from '@/src/lib/constants';
import { formatRelative, formatTime, isToday, isYesterday, isThisWeek } from '@/src/utils/date';
import { formatPhoneNumber } from '@/src/utils/format';
import { CallLogItem } from '@/src/components/calls/call-log-item';
import { QuickCallCard } from '@/src/components/calls/quick-call-card';
import { PreCallSheet } from '@/src/components/calls/pre-call-sheet';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { ErrorState } from '@/src/components/ui/error-state';
import { hapticLight } from '@/src/lib/haptics';
import { showToast } from '@/src/components/ui/toast-config';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { CallStatus } from '@/src/types/models';

type FilterKey = 'all' | 'completed' | 'missed' | 'voicemail';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Calls' },
  { key: 'completed', label: 'Completed' },
  { key: 'missed', label: 'Missed' },
  { key: 'voicemail', label: 'Voicemail' },
];

interface DisplayCall {
  id: string;
  callerName: string | null;
  callerPhone: string;
  duration: number;
  timeAgo: string;
  callTime: string;
  status: CallStatus;
  summary?: string;
  startedAt: string;
}

export default function CallLogScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeSubTab, setActiveSubTab] = useState<'calls' | 'emails'>(
    tab === 'emails' ? 'emails' : 'calls',
  );
  const [emailSubTab, setEmailSubTab] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(
    null,
  );
  const [fabVisible, setFabVisible] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const quickCallCardBottomY = useRef(0);

  const callLogsQuery = useCallLogs();
  const { data: callLogs, isLoading, isError, refetch } = callLogsQuery;
  const createCallLog = useCreateCallLog();
  const { userId } = useAuth();
  const emailsQuery = useEmails();
  const draftsQuery = useSentEmails('draft');
  const unreadCount = useMemo(() => {
    if (!emailsQuery.data) return 0;
    return emailsQuery.data.filter((e) => !e.is_read).length;
  }, [emailsQuery.data]);
  const draftsCount = draftsQuery.data?.length ?? 0;

  const handleQuickComposeSubmit = useCallback((prompt: string) => {
    hapticLight();
    router.push({
      pathname: '/(modals)/email-compose',
      params: { prompt },
    } as never);
  }, [router]);

  useRealtimeSubscription('call_logs', [QUERY_KEYS.callLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await callLogsQuery.refetch();
    setRefreshing(false);
  };

  const displayCalls: DisplayCall[] = useMemo(
    () =>
      callLogs
        ? callLogs.map((c) => ({
            id: c.id,
            callerName: c.caller_name,
            callerPhone: formatPhoneNumber(c.caller_phone),
            duration: c.duration_seconds,
            timeAgo: formatRelative(c.started_at),
            callTime: formatTime(c.started_at),
            status: c.status,
            summary: c.summary ?? undefined,
            startedAt: c.started_at,
          }))
        : [],
    [callLogs],
  );

  // Derive 3 most recent unique contacts from call history
  const recentContacts = useMemo(() => {
    if (!callLogs) return [];
    const seen = new Set<string>();
    const result: { name: string; phone: string }[] = [];
    for (const log of callLogs) {
      if (seen.has(log.caller_phone)) continue;
      seen.add(log.caller_phone);
      result.push({
        name: log.caller_name || formatPhoneNumber(log.caller_phone),
        phone: log.caller_phone,
      });
      if (result.length >= 3) break;
    }
    return result;
  }, [callLogs]);

  // Apply status filter
  const filteredCalls = useMemo(() => {
    if (activeFilter === 'all') return displayCalls;
    return displayCalls.filter((c) => c.status === activeFilter);
  }, [displayCalls, activeFilter]);

  // 4-tier date grouping
  const sections = useMemo(() => {
    const today: DisplayCall[] = [];
    const yesterday: DisplayCall[] = [];
    const thisWeek: DisplayCall[] = [];
    const older: DisplayCall[] = [];

    for (const call of filteredCalls) {
      if (isToday(call.startedAt)) today.push(call);
      else if (isYesterday(call.startedAt)) yesterday.push(call);
      else if (isThisWeek(call.startedAt)) thisWeek.push(call);
      else older.push(call);
    }

    const result: { title: string; data: DisplayCall[] }[] = [];
    if (today.length > 0) result.push({ title: 'TODAY', data: today });
    if (yesterday.length > 0) result.push({ title: 'YESTERDAY', data: yesterday });
    if (thisWeek.length > 0) result.push({ title: 'THIS WEEK', data: thisWeek });
    if (older.length > 0) result.push({ title: 'EARLIER', data: older });
    return result;
  }, [filteredCalls]);

  // FAB visibility based on scroll position
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setFabVisible(offsetY > quickCallCardBottomY.current);
  }, []);

  const handleQuickCallCardLayout = useCallback((event: any) => {
    const { y, height } = event.nativeEvent.layout;
    quickCallCardBottomY.current = y + height;
  }, []);

  // Quick call handlers
  const handleQuickCallSubmit = useCallback((input: string) => {
    hapticLight();
    setSelectedContact({ name: input, phone: input });
    setSheetOpen(true);
  }, []);

  const handleContactChipPress = useCallback((contact: { name: string; phone: string }) => {
    hapticLight();
    setSelectedContact(contact);
    setSheetOpen(true);
  }, []);

  // Pre-call sheet handlers
  const handleStartAICall = useCallback(
    (purpose: string) => {
      if (!selectedContact || !userId) return;
      showToast('info', 'Calling...', `Connecting to ${selectedContact.name}`);
      createCallLog.mutate(
        {
          caller_name: selectedContact.name !== selectedContact.phone ? selectedContact.name : null,
          caller_phone: selectedContact.phone,
          direction: 'outbound',
          status: 'completed',
          started_at: new Date().toISOString(),
          user_id: userId,
          purpose: purpose || undefined,
        },
        {
          onSuccess: () => {
            showToast('success', 'AI Call initiated', 'Versa is handling the call');
            setSheetOpen(false);
          },
          onError: (error) => {
            showToast(
              'error',
              'Call failed',
              error instanceof Error ? error.message : 'Could not start call',
            );
          },
        },
      );
    },
    [selectedContact, userId, createCallLog],
  );

  const handleStartDirectCall = useCallback(() => {
    if (!selectedContact) return;
    Linking.openURL(`tel:${selectedContact.phone}`);
    setSheetOpen(false);
  }, [selectedContact]);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-versa-bg">
        <ErrorState message="Could not load calls. Pull to refresh." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-versa-bg">
      <View className="flex-1">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Comms</Text>
          {activeSubTab === 'calls' ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                hapticLight();
                setFilterSheetOpen(true);
              }}
            >
              <View>
                <SlidersHorizontal size={20} color={activeFilter !== 'all' ? colors.velvet.DEFAULT : colors.text.secondary} strokeWidth={1.5} />
                {activeFilter !== 'all' && <View style={styles.filterDot} />}
              </View>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={8}
              onPress={() => {
                hapticLight();
                router.push('/(modals)/email-compose' as never);
              }}
              style={styles.composeButton}
              testID="compose-email-btn"
              accessibilityLabel="Compose new email"
            >
              <Plus size={18} color={colors.velvet.DEFAULT} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Sub-tabs */}
        <View style={{ paddingHorizontal: space[5], marginBottom: space[2] }}>
          <UnderlineTabs
            tabs={[
              { key: 'calls', label: 'Calls' },
              { key: 'emails', label: `Emails${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            ]}
            activeKey={activeSubTab}
            onSelect={(key) => setActiveSubTab(key as 'calls' | 'emails')}
          />
        </View>

        {/* Content */}
        {activeSubTab === 'calls' ? (
          <>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <StaggeredFadeIn index={index}>
                  <CallLogItem
                    callerName={item.callerName}
                    callerPhone={item.callerPhone}
                    duration={item.duration}
                    timeAgo={item.timeAgo}
                    callTime={item.callTime}
                    status={item.status}
                    summary={item.summary}
                    onPress={() => router.push(`/(tabs)/comms/${item.id}` as never)}
                  />
                </StaggeredFadeIn>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{title}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingTop: space[2], paddingBottom: 128 }}
              ListHeaderComponent={
                <View style={styles.headerCardWrapper} onLayout={handleQuickCallCardLayout}>
                  <QuickCallCard
                    recentContacts={recentContacts}
                    onSubmit={handleQuickCallSubmit}
                    onContactPress={handleContactChipPress}
                  />
                  {isLoading && !callLogs && (
                    <View style={styles.skeletons}>
                      <Skeleton height={56} />
                      <Skeleton height={56} />
                      <Skeleton height={56} />
                    </View>
                  )}
                </View>
              }
              ListEmptyComponent={
                !isLoading ? (
                  <View style={styles.emptyState}>
                    <Phone size={48} color={colors.text.muted} strokeWidth={1.5} />
                    <Text style={styles.emptyTitle}>No calls yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Tell Versa who to call and it&apos;ll handle the rest.
                    </Text>
                    <Pressable
                      onPress={() => {
                        hapticLight();
                        setSelectedContact(null);
                        setSheetOpen(true);
                      }}
                      style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
                    >
                      <Text style={styles.emptyButtonText}>Make First Call</Text>
                    </Pressable>
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.velvet.DEFAULT}
                />
              }
            />

            {/* FAB — shown when quick call card scrolled away */}
            {fabVisible && (
              <Pressable
                onPress={() => {
                  hapticLight();
                  setSelectedContact(null);
                  setSheetOpen(true);
                }}
                style={styles.fab}
              >
                <Phone size={24} color={colors.text.onVelvet} />
              </Pressable>
            )}
          </>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Email sub-tabs: Inbox / Sent / Drafts */}
            <EmailSubTabs
              activeTab={emailSubTab}
              onSelect={setEmailSubTab}
              inboxCount={unreadCount}
              draftsCount={draftsCount}
            />

            {emailSubTab === 'inbox' ? (
              <EmailList onEmailPress={(id) => router.push(`/(tabs)/comms/email/${id}` as never)} />
            ) : (
              <SentEmailList
                status={emailSubTab === 'sent' ? 'sent' : 'draft'}
                onEmailPress={(id) => router.push(`/(tabs)/comms/sent-email/${id}` as never)}
                listHeader={
                  <View style={styles.headerCardWrapper}>
                    <QuickComposeCard onSubmit={handleQuickComposeSubmit} />
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Pre-call bottom sheet */}
        <PreCallSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          contactName={selectedContact?.name ?? ''}
          contactPhone={selectedContact?.phone ?? ''}
          onStartAICall={handleStartAICall}
          onStartDirectCall={handleStartDirectCall}
        />

        {/* Filter bottom sheet */}
        <VersaBottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          snapPoints={['35%']}
          title="Filter Calls"
        >
          <View style={styles.filterOptions}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => {
                  hapticLight();
                  setActiveFilter(f.key);
                  setFilterSheetOpen(false);
                }}
                style={[
                  styles.filterRow,
                  activeFilter === f.key && styles.filterRowActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    activeFilter === f.key && styles.filterLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
                {activeFilter === f.key && (
                  <Check size={18} color={colors.velvet.DEFAULT} strokeWidth={2} />
                )}
              </Pressable>
            ))}
          </View>
        </VersaBottomSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    paddingHorizontal: space[5],
    paddingTop: space[6],
    paddingBottom: space[4],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  headerCardWrapper: {
    paddingHorizontal: space[4],
    paddingBottom: space[2],
  },
  skeletons: {
    gap: 10,
    marginTop: space[4],
  },
  sectionHeader: {
    paddingHorizontal: space[6],
    paddingTop: space[5],
    paddingBottom: space[2],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  emptyState: {
    paddingVertical: space[12],
    alignItems: 'center' as const,
    paddingHorizontal: space[8],
    gap: space[2],
  },
  emptyTitle: {
    ...typography.headingMd,
    color: colors.text.primary,
    marginTop: space[3],
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.text.muted,
    textAlign: 'center' as const,
  },
  emptyButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 10,
    paddingVertical: space[3],
    paddingHorizontal: space[6],
    marginTop: space[3],
  },
  emptyButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  emptyButtonText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
    color: colors.text.onVelvet,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 100,
    right: space[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.velvet.DEFAULT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.fab,
  },
  composeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.velvet.dim,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterDot: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.velvet.DEFAULT,
  },
  filterOptions: {
    gap: space[1],
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
  },
  filterRowActive: {
    backgroundColor: colors.velvet.dim,
  },
  filterLabel: {
    ...typography.bodyLg,
    color: colors.text.body,
  },
  filterLabelActive: {
    color: colors.velvet.DEFAULT,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
  },
};

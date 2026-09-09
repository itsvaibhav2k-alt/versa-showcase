import React, { useState, useMemo } from 'react';
import { ScrollView, View, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTasks, useUpdateTaskStatus } from '@/src/hooks/use-tasks';
import { useTodayEvents, useEventsForDate, useEvents } from '@/src/hooks/use-events';
import { useLatestDigest, useTodayDigest } from '@/src/hooks/use-digests';
import { MorningBriefingCard } from '@/src/components/dashboard/morning-briefing-card';
import { digestsService } from '@/src/services/digests.service';
import { useNotifications } from '@/src/hooks/use-notifications';
import { useDashboardStats } from '@/src/hooks/use-dashboard-stats';
import { useFollowUps } from '@/src/hooks/use-follow-ups';
import { useReminders } from '@/src/hooks/use-reminders';
import { useUnreadCount } from '@/src/hooks/use-notifications';
import { useRealtimeSubscription } from '@/src/hooks/use-realtime';
import { QUERY_KEYS } from '@/src/lib/constants';
import { formatRelative, isToday as checkIsToday, formatShortDate, getWeekDatesForDate } from '@/src/utils/date';
import { useAuth } from '@/src/hooks/use-auth';
import { DashboardHeader } from '@/src/components/dashboard/dashboard-header';
import { WeekStreakRow } from '@/src/components/dashboard/week-streak-row';
import { StatLine } from '@/src/components/ui/stat-line';
import { QuickActions } from '@/src/components/dashboard/quick-actions';
import { AttioTaskList } from '@/src/components/dashboard/task-list-attio';
import { CalendarSnapshot } from '@/src/components/dashboard/calendar-snapshot';
import { RemindersSection } from '@/src/components/home/reminders-section';
import { showToast, showUndoToast } from '@/src/components/ui/toast-config';
import { ErrorState } from '@/src/components/ui/error-state';
import { hapticSuccess, hapticLight, hapticError } from '@/src/lib/haptics';
import { colors, space } from '@/src/lib/design-tokens';
import type { TaskStatus, CalendarEvent } from '@/src/types/models';

export default function DashboardScreen() {
  const router = useRouter();
  const tasksQuery = useTasks({ status: 'todo' });
  const { data: tasks, isLoading: tasksLoading } = tasksQuery;
  const todayEventsQuery = useTodayEvents();
  const { data: todayEvents } = todayEventsQuery;
  const digestQuery = useLatestDigest();
  const { data: digest } = digestQuery;
  const todayDigestQuery = useTodayDigest();
  const { data: todayDigest, isLoading: digestLoading } = todayDigestQuery;
  const notificationsQuery = useNotifications();
  const { data: notifications } = notificationsQuery;
  const { user } = useAuth();
  const updateStatus = useUpdateTaskStatus();
  const statsQuery = useDashboardStats();
  const { data: stats } = statsQuery;
  const followUpsQuery = useFollowUps();
  const { data: followUps } = followUpsQuery;
  const remindersQuery = useReminders();
  const { data: reminders } = remindersQuery;
  const unreadCountQuery = useUnreadCount();
  const { data: unreadNotifCount } = unreadCountQuery;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const isSelectedToday = checkIsToday(selectedDate);
  const { data: selectedDateEvents } = useEventsForDate(
    isSelectedToday ? null : selectedDate,
  );
  const eventsToShow = isSelectedToday ? todayEvents : selectedDateEvents;

  // Week dates and events for density dots
  const weekDates = useMemo(() => getWeekDatesForDate(weekAnchor), [weekAnchor]);
  const weekStart = useMemo(() => weekDates[0].toISOString(), [weekDates]);
  const weekEnd = useMemo(() => {
    const last = weekDates[6];
    return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999).toISOString();
  }, [weekDates]);
  const { data: weekEvents } = useEvents(weekStart, weekEnd);

  // Compute density for each day of the week
  const dayDensity = useMemo(() => {
    return weekDates.map((date) => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const taskCount = tasks?.filter((t) => t.due_date?.startsWith(dateStr)).length ?? 0;
      const meetingCount = weekEvents?.filter((e) => e.start_time?.startsWith(dateStr)).length ?? 0;
      const followUpCount = followUps?.filter(
        (f) => f.status === 'pending' && f.due_date?.startsWith(dateStr),
      ).length ?? 0;
      return { taskCount, meetingCount, followUpCount };
    });
  }, [weekDates, tasks, weekEvents, followUps]);

  // Stats for selected day
  const selectedDayIndex = useMemo(() => {
    const selNorm = new Date(selectedDate);
    selNorm.setHours(0, 0, 0, 0);
    return weekDates.findIndex((d) => {
      const dNorm = new Date(d);
      dNorm.setHours(0, 0, 0, 0);
      return dNorm.getTime() === selNorm.getTime();
    });
  }, [selectedDate, weekDates]);

  const selectedDensity = selectedDayIndex >= 0 ? dayDensity[selectedDayIndex] : null;
  const statTaskCount = selectedDensity?.taskCount ?? stats?.active_tasks_count ?? (tasks?.length ?? 0);
  const statMeetingCount = selectedDensity?.meetingCount ?? stats?.today_events_count ?? (todayEvents?.length ?? 0);
  const statFollowUpCount = selectedDensity?.followUpCount ?? stats?.pending_followups_count ?? (followUps?.filter((f) => f.status === 'pending').length ?? 0);

  const calendarLabel = isSelectedToday
    ? "TODAY'S SCHEDULE"
    : `${formatShortDate(selectedDate)} Schedule`;

  const firstName = user?.full_name?.split(' ')[0] ?? 'Satya';
  const unreadCount = unreadNotifCount ?? 0;

  useRealtimeSubscription('tasks', [QUERY_KEYS.tasks]);
  useRealtimeSubscription('notifications', [QUERY_KEYS.notifications]);
  useRealtimeSubscription('digests', [QUERY_KEYS.digests]);
  useRealtimeSubscription('follow_ups', [QUERY_KEYS.followUps]);
  useRealtimeSubscription('reminders', [QUERY_KEYS.reminders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      statsQuery.refetch(),
      tasksQuery.refetch(),
      todayEventsQuery.refetch(),
      notificationsQuery.refetch(),
      followUpsQuery.refetch(),
      remindersQuery.refetch(),
      digestQuery.refetch(),
      todayDigestQuery.refetch(),
      unreadCountQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const displayTasks = tasks?.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    assigneeName: t.assigned_to_user?.full_name,
    assigneeAvatar: t.assigned_to_user?.avatar_url,
    dueDate: t.due_date ? formatRelative(t.due_date) : null,
    dueDateRaw: t.due_date,
    source: t.source,
  })) ?? [];

  const handleToggleComplete = (taskId: string, currentStatus: TaskStatus) => {
    const isCompleting = currentStatus !== 'done';
    updateStatus.mutate({
      id: taskId,
      status: isCompleting ? 'done' : 'todo',
    });
    if (isCompleting) {
      hapticSuccess();
      showUndoToast('Task completed', () => {
        hapticLight();
        updateStatus.mutate({ id: taskId, status: 'todo' });
      });
    } else {
      hapticLight();
    }
  };

  const handleTaskPress = (taskId: string) => {
    router.push({ pathname: '/task/[id]', params: { id: taskId } });
  };

  const handleSeeAll = () => {
    router.push('/(modals)/all-tasks');
  };

  const handleJoinMeeting = (event: CalendarEvent) => {
    const meetLink =
      (event.metadata?.meet_link as string) ||
      (event.metadata?.zoom_link as string) ||
      (event.metadata?.meeting_url as string);
    if (meetLink) {
      Linking.openURL(meetLink);
    } else {
      showToast('info', 'No meeting link', 'No video link found for this event');
    }
  };

  const handleGenerateBriefing = async () => {
    if (!user) return;
    showToast('info', 'Generating', 'Creating your AI briefing...');
    const result = await digestsService.generateBriefing(user.id, user.organization_id);
    if (result.isOk) {
      todayDigestQuery.refetch();
      hapticSuccess();
      showToast('success', 'Ready', 'Your briefing is ready');
    } else {
      hapticError();
      showToast('error', 'Error', 'Could not generate briefing');
    }
  };

  if (statsQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-versa-bg">
        <ErrorState message="Could not load dashboard. Pull to refresh." onRetry={() => statsQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-versa-bg">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.velvet.DEFAULT}
            />
          }
        >
          {/* 1. Header */}
          <DashboardHeader
            firstName={firstName}
            avatarUrl={user?.avatar_url}
            unreadCount={unreadCount}
            onPressBell={() => router.push('/(modals)/notifications')}
            onPressSearch={() => router.push('/(modals)/search')}
          />

          {/* 2. Week Calendar with density dots */}
          <WeekStreakRow
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekAnchor={weekAnchor}
            onWeekAnchorChange={setWeekAnchor}
            dayDensity={dayDensity}
          />

          {/* 3. Stat Pills + Quick Actions */}
          <View style={{ paddingHorizontal: space[5], marginTop: 8 }}>
            <StatLine
              items={[
                { value: statTaskCount, label: statTaskCount === 1 ? 'task' : 'tasks' },
                { value: statMeetingCount, label: statMeetingCount === 1 ? 'meeting' : 'meetings' },
                { value: statFollowUpCount, label: statFollowUpCount === 1 ? 'follow-up' : 'follow-ups' },
              ]}
              pillColors={[
                { text: colors.velvet.DEFAULT, bg: colors.velvet.dim },
                { text: colors.sky.DEFAULT, bg: colors.sky.light },
                { text: colors.velvet.light, bg: colors.velvet.wash },
              ]}
            />
            <QuickActions />
          </View>

          {/* 4. Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border.divider,
              marginHorizontal: space[6],
            }}
          />

          {/* 5. AI Briefing Hero Card */}
          <View style={{ paddingHorizontal: space[4], marginTop: space[10] }}>
            <MorningBriefingCard
              digest={todayDigest}
              isLoading={digestLoading}
              onGenerateBriefing={handleGenerateBriefing}
            />
          </View>

          {/* 6. Tasks */}
          <AttioTaskList
            tasks={displayTasks}
            onToggleComplete={handleToggleComplete}
            onTaskPress={handleTaskPress}
            onSeeAll={handleSeeAll}
            isLoading={tasksLoading}
          />

          {/* 7. Reminders */}
          <RemindersSection
            reminders={reminders}
            isLoading={remindersQuery.isLoading}
          />

          {/* 8. Calendar Timeline */}
          <View style={{ marginTop: space[10] }}>
            <CalendarSnapshot
              events={eventsToShow ?? undefined}
              dateLabel={calendarLabel}
              onJoin={handleJoinMeeting}
              onSeeAll={() => router.push('/(modals)/calendar')}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

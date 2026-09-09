import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Plus, ClipboardList } from 'lucide-react-native';
import { useTasks, useUpdateTaskStatus } from '@/src/hooks/use-tasks';
import { Avatar } from '@/src/components/ui/avatar';
import { StatusDot } from '@/src/components/ui/status-dot';
import { FlatRow } from '@/src/components/ui/flat-row';
import { UnderlineTabs } from '@/src/components/ui/underline-tabs';
import { SkeletonCard } from '@/src/components/ui/skeleton';
import { ErrorState } from '@/src/components/ui/error-state';
import { showToast, showUndoToast } from '@/src/components/ui/toast-config';
import { hapticSuccess, hapticLight } from '@/src/lib/haptics';
import { formatRelative, isToday, isOverdue } from '@/src/utils/date';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { TaskStatus, TaskPriority } from '@/src/types/models';

type FilterTab = 'all' | 'todo' | 'in_progress' | 'done';

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  urgent: colors.status.urgent,
  high: colors.status.high,
  medium: colors.status.medium,
  low: colors.status.low,
};

interface DisplayTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeName?: string;
  assigneeAvatar?: string | null;
  dueDate?: string | null;
  dueDateRaw?: string | null;
  source?: string | null;
}

export default function AllTasksScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const tasksQuery = useTasks();
  const { data: tasks, isLoading, isError, refetch } = tasksQuery;
  const updateStatus = useUpdateTaskStatus();

  const onRefresh = async () => {
    setRefreshing(true);
    await tasksQuery.refetch();
    setRefreshing(false);
  };

  const displayTasks: DisplayTask[] = tasks?.map((t) => ({
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

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return displayTasks;
    return displayTasks.filter((t) => t.status === activeTab);
  }, [displayTasks, activeTab]);

  const sections = useMemo(() => {
    const today: DisplayTask[] = [];
    const upcoming: DisplayTask[] = [];
    const completed: DisplayTask[] = [];

    for (const task of filteredTasks) {
      if (task.status === 'done') {
        completed.push(task);
      } else if (task.dueDateRaw && (isToday(task.dueDateRaw) || isOverdue(task.dueDateRaw))) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    }

    const result: { title: string; data: DisplayTask[] }[] = [];
    if (today.length > 0) result.push({ title: 'TODAY', data: today });
    if (upcoming.length > 0) result.push({ title: 'UPCOMING', data: upcoming });
    if (completed.length > 0) result.push({ title: 'COMPLETED', data: completed });
    return result;
  }, [filteredTasks]);

  const handleToggleComplete = (taskId: string, currentStatus: TaskStatus) => {
    const isCompleting = currentStatus !== 'done';
    updateStatus.mutate({
      id: taskId,
      status: isCompleting ? 'done' : 'todo',
    }, {
      onError: () => showToast('error', 'Error', 'Could not update task'),
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

  const totalCount = displayTasks.length;

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message="Could not load tasks." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerArea}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>All Tasks</Text>
              <Text style={styles.subtitle}>
                {totalCount} task{totalCount !== 1 ? 's' : ''} total
              </Text>
            </View>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>

        {/* UnderlineTabs replace amber pill filters */}
        <View style={styles.tabArea}>
          <UnderlineTabs
            tabs={FILTER_TABS}
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key as FilterTab)}
          />
        </View>

        {/* Task list */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index, section }) => (
            <TaskRow
              task={item}
              onToggleComplete={handleToggleComplete}
              onPress={handleTaskPress}
              showDivider={index < section.data.length - 1}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isLoading && !tasks ? (
              <View style={{ gap: 10, paddingHorizontal: space[4], marginBottom: space[2] }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <ClipboardList size={32} color={colors.text.muted} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No tasks found</Text>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    router.push('/(modals)/task-create');
                  }}
                  style={({ pressed }) => [
                    styles.emptyCtaButton,
                    pressed && styles.emptyCtaButtonPressed,
                  ]}
                >
                  <Text style={styles.emptyCtaButtonText}>+ Create Task</Text>
                </Pressable>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.velvet.DEFAULT}
            />
          }
        />

        {/* FAB */}
        <Pressable
          onPress={() => {
            hapticLight();
            router.push('/(modals)/task-create');
          }}
          style={styles.fab}
        >
          <Plus size={24} color={colors.text.onVelvet} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function TaskRow({
  task,
  onToggleComplete,
  onPress,
  showDivider,
}: {
  task: DisplayTask;
  onToggleComplete: (taskId: string, currentStatus: TaskStatus) => void;
  onPress: (taskId: string) => void;
  showDivider: boolean;
}) {
  const isDone = task.status === 'done';

  return (
    <FlatRow
      onPress={() => onPress(task.id)}
      showDivider={showDivider}
      dividerIndent={44}
    >
      {/* Checkbox */}
      <Pressable
        onPress={() => onToggleComplete(task.id, task.status)}
        hitSlop={8}
        style={{ marginRight: space[3] }}
      >
        {isDone ? (
          <View style={styles.checkboxDone}>
            <Check size={12} color={colors.text.onVelvet} strokeWidth={2.5} />
          </View>
        ) : (
          <View style={styles.checkboxUndone} />
        )}
      </Pressable>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.taskTitle,
            isDone && styles.taskTitleDone,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <StatusDot color={PRIORITY_DOT_COLORS[task.priority]} size="sm" />
          {task.dueDate && (
            <Text style={styles.taskDue}>{task.dueDate}</Text>
          )}
        </View>
      </View>

      {/* Avatar */}
      {task.assigneeName && (
        <Avatar
          size="sm"
          name={task.assigneeName}
          imageUrl={task.assigneeAvatar}
        />
      )}
    </FlatRow>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  headerArea: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    marginTop: space[1],
  },
  closeText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabArea: {
    paddingHorizontal: space[4],
    marginTop: space[4],
    marginBottom: space[2],
  },
  sectionHeader: {
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    backgroundColor: colors.bg.deep,
    marginTop: space[4],
  },
  sectionHeaderText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  listContent: {
    paddingBottom: 128,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: space[3],
    ...typography.bodyMd,
    color: colors.text.muted,
  },
  emptyCtaButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: space[4],
  },
  emptyCtaButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  emptyCtaButtonText: {
    color: colors.text.onVelvet,
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'DMSans_600SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.velvet.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  checkboxDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sage.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUndone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
  },
  taskTitleDone: {
    color: colors.text.muted,
    textDecorationLine: 'line-through',
    fontFamily: 'DMSans_400Regular',
    fontWeight: '400',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: 2,
  },
  taskDue: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.secondary,
  },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/src/components/ui/avatar';
import { FlatRow } from '@/src/components/ui/flat-row';
import { StatusDot } from '@/src/components/ui/status-dot';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { colors, typography, space } from '@/src/lib/design-tokens';
import type { TaskPriority, TaskStatus } from '@/src/types/models';

interface AttioTask {
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

interface AttioTaskListProps {
  tasks: AttioTask[];
  onToggleComplete: (taskId: string, currentStatus: TaskStatus) => void;
  onTaskPress?: (taskId: string) => void;
  onSeeAll?: () => void;
  isLoading?: boolean;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: colors.status.urgent,
  high: colors.status.high,
  medium: colors.status.medium,
  low: colors.status.low,
};

function TaskRow({
  task,
  index,
  onToggleComplete,
  onTaskPress,
}: {
  task: AttioTask;
  index: number;
  onToggleComplete: (taskId: string, currentStatus: TaskStatus) => void;
  onTaskPress?: (taskId: string) => void;
}) {
  const isDone = task.status === 'done';
  const dotColor = PRIORITY_COLORS[task.priority];

  return (
    <StaggeredFadeIn index={index}>
      <FlatRow
        onPress={() => onTaskPress?.(task.id)}
        showDivider={true}
        dividerIndent={44}
        testID={`flat-row-task-${task.id}`}
        accessibilityLabel={`Task: ${task.title}`}
      >
        {/* Checkbox */}
        <Pressable
          onPress={() => onToggleComplete(task.id, task.status)}
          hitSlop={8}
          style={styles.checkbox}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark ${task.title} as complete`}
          accessibilityState={{ checked: isDone }}
        >
          {isDone ? (
            <View style={styles.checkboxDone}>
              <Check size={12} color={colors.text.onVelvet} strokeWidth={2.5} />
            </View>
          ) : (
            <View style={styles.checkboxUndone}>
              <View
                style={[
                  styles.checkboxInnerDot,
                  { backgroundColor: dotColor },
                ]}
              />
            </View>
          )}
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          {/* Row 1: title + avatar */}
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                isDone && styles.titleDone,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.assigneeName && (
              <View style={styles.avatarWrap}>
                <Avatar
                  size="xs"
                  name={task.assigneeName}
                  imageUrl={task.assigneeAvatar}
                />
              </View>
            )}
          </View>

          {/* Row 2: status dot + due date */}
          <View style={styles.metaRow}>
            <StatusDot color={dotColor} size="sm" />
            {task.dueDate && (
              <Text style={styles.dueDate}>{task.dueDate}</Text>
            )}
          </View>
        </View>
      </FlatRow>
    </StaggeredFadeIn>
  );
}

function TaskListEmptyState() {
  const router = useRouter();
  return (
    <View style={styles.emptyState}>
      <CheckCircle size={32} color={colors.text.muted} strokeWidth={1.5} />
      <Text style={styles.emptyText}>
        No tasks today. Enjoy the calm.
      </Text>
      <Pressable
        onPress={() => router.push('/(modals)/task-create' as never)}
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.emptyButtonPressed,
        ]}
      >
        <Text style={styles.emptyButtonText}>+ Create Task</Text>
      </Pressable>
    </View>
  );
}

export function AttioTaskList({
  tasks,
  onToggleComplete,
  onTaskPress,
  onSeeAll,
  isLoading,
}: AttioTaskListProps) {
  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PRIORITY TASKS</Text>
        <Pressable
          onPress={onSeeAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="See all tasks"
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {/* Loading skeletons */}
      {isLoading && tasks.length === 0 && (
        <View style={{ gap: 12, paddingHorizontal: space[4] }}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      )}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
        <TaskListEmptyState />
      )}

      {/* Task rows */}
      {tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          task={task}
          index={index}
          onToggleComplete={onToggleComplete}
          onTaskPress={onTaskPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: space[10],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[4],
    paddingHorizontal: space[4],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  seeAll: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
  },
  checkbox: {
    marginRight: space[3],
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.bodyMd,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  avatarWrap: {
    marginLeft: space[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dueDate: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  emptyState: {
    paddingVertical: space[8],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: space[3],
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.muted,
  },
  emptyButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: space[3],
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
});

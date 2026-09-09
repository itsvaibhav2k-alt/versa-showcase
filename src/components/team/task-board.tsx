import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ClipboardList, Check } from 'lucide-react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { FlatRow } from '@/src/components/ui/flat-row';
import { StatusDot } from '@/src/components/ui/status-dot';
import { UnderlineTabs } from '@/src/components/ui/underline-tabs';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { useUpdateTaskStatus } from '@/src/hooks/use-tasks';
import { showUndoToast } from '@/src/components/ui/toast-config';
import { hapticSuccess, hapticLight } from '@/src/lib/haptics';
import { formatDueDate } from '@/src/utils/date';
import { colors, typography, space } from '@/src/lib/design-tokens';
import type { Task, TaskPriority } from '@/src/types/models';

interface BoardTask {
  id: string;
  title: string;
  priority: TaskPriority;
  assigneeName?: string;
  dueDate?: string | null;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: colors.status.urgent,
  high: colors.status.high,
  medium: colors.status.medium,
  low: colors.status.low,
};

type TabKey = 'todo' | 'in_progress' | 'done';

const TABS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function TaskRow({
  task,
  index,
  onToggleComplete,
  isDone,
}: {
  task: BoardTask;
  index: number;
  onToggleComplete: (taskId: string) => void;
  isDone?: boolean;
}) {
  const dotColor = PRIORITY_COLORS[task.priority];
  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <StaggeredFadeIn index={index}>
      <FlatRow showDivider={true} dividerIndent={44}>
        {/* Checkbox */}
        <Pressable
          onPress={() => onToggleComplete(task.id)}
          hitSlop={8}
          style={styles.checkbox}
        >
          {isDone ? (
            <View style={styles.checkboxChecked}>
              <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          ) : (
            <View style={styles.checkboxCircle}>
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
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.taskTitle,
                isDone && styles.taskTitleDone,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {task.assigneeName && (
              <View style={styles.avatarWrap}>
                <Avatar name={task.assigneeName} size="xs" />
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <StatusDot color={dotColor} size="sm" />
            {dueDateInfo && (
              <Text
                style={[
                  styles.dueDate,
                  { color: dueDateInfo.color },
                ]}
              >
                {dueDateInfo.label}
              </Text>
            )}
          </View>
        </View>
      </FlatRow>
    </StaggeredFadeIn>
  );
}

function mapTasksToBoard(task: Task): BoardTask {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    assigneeName: task.assigned_to_user?.full_name,
    dueDate: task.due_date,
  };
}

interface TaskBoardProps {
  tasks?: Task[];
}

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('todo');
  const updateStatus = useUpdateTaskStatus();

  const handleToggleComplete = (taskId: string) => {
    if (activeTab === 'done') {
      updateStatus.mutate({ id: taskId, status: 'todo' });
      hapticLight();
      showUndoToast('Task restored', () => {
        hapticLight();
        updateStatus.mutate({ id: taskId, status: 'done' });
      });
    } else {
      updateStatus.mutate({ id: taskId, status: 'done' });
      hapticSuccess();
      showUndoToast('Task completed', () => {
        hapticLight();
        updateStatus.mutate({
          id: taskId,
          status: activeTab === 'todo' ? 'todo' : 'in_progress',
        });
      });
    }
  };

  const todoTasks = tasks
    ? tasks.filter((t) => t.status === 'todo').map(mapTasksToBoard)
    : [];
  const inProgressTasks = tasks
    ? tasks.filter((t) => t.status === 'in_progress').map(mapTasksToBoard)
    : [];
  const doneTasks = tasks
    ? tasks.filter((t) => t.status === 'done').map(mapTasksToBoard)
    : [];

  const displayedTasks = activeTab === 'todo'
    ? todoTasks
    : activeTab === 'in_progress'
      ? inProgressTasks
      : doneTasks;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>TASK BOARD</Text>

      <View style={styles.tabsWrap}>
        <UnderlineTabs
          tabs={TABS}
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key as TabKey)}
        />
      </View>

      <View style={styles.taskList}>
        {displayedTasks.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            index={index}
            onToggleComplete={handleToggleComplete}
            isDone={activeTab === 'done'}
          />
        ))}
        {displayedTasks.length === 0 && (
          <View style={styles.emptyState}>
            <ClipboardList size={32} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {activeTab === 'done' ? 'No completed tasks' : 'No active tasks'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: space[4],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[3],
  },
  tabsWrap: {
    marginBottom: space[3],
  },
  taskList: {
    marginTop: space[2],
  },
  checkbox: {
    marginRight: space[3],
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.done,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  taskTitle: {
    ...typography.bodyMd,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through' as const,
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
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  Sparkles,
  Check,
  Trash2,
  Pencil,
  ChevronRight,
  UserRoundPen,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { Avatar } from '@/src/components/ui/avatar';
import { StatusDot } from '@/src/components/ui/status-dot';
import { Skeleton } from '@/src/components/ui/skeleton';
import { VersaBottomSheet } from '@/src/components/ui/versa-bottom-sheet';
import { showToast, showUndoToast } from '@/src/components/ui/toast-config';
import { hapticLight, hapticSuccess, hapticError, hapticSelection } from '@/src/lib/haptics';
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus, useAssignTask } from '@/src/hooks/use-tasks';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { formatRelative, formatDueDate } from '@/src/utils/date';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { TaskPriority, TaskStatus } from '@/src/types/models';

const PRIORITIES: { value: TaskPriority; label: string; color: string; bg: string }[] = [
  { value: 'urgent', label: 'Urgent', color: colors.coral.DEFAULT, bg: colors.coral.light },
  { value: 'high', label: 'High', color: colors.velvet.DEFAULT, bg: colors.velvet.wash },
  { value: 'medium', label: 'Medium', color: colors.sky.DEFAULT, bg: colors.sky.light },
  { value: 'low', label: 'Low', color: colors.text.secondary, bg: colors.bg.muted },
];

const STATUSES: { value: TaskStatus; label: string; color: string; bg: string }[] = [
  { value: 'todo', label: 'To Do', color: colors.status.todo, bg: colors.bg.muted },
  { value: 'in_progress', label: 'In Progress', color: colors.status.inProgress, bg: colors.sky.light },
  { value: 'blocked', label: 'Blocked', color: colors.status.blocked, bg: colors.coral.light },
  { value: 'done', label: 'Done', color: colors.status.done, bg: colors.sage.light },
];

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  voice_command: 'Voice',
  call_followup: 'Call',
  email: 'Email',
  ai_suggested: 'AI',
};

function getPriorityConfig(priority: TaskPriority) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[2];
}

function getStatusConfig(status: TaskStatus) {
  return STATUSES.find((s) => s.value === status) ?? STATUSES[0];
}

function formatEventType(eventType: string): string {
  const map: Record<string, string> = {
    'task.created': 'Task created',
    'task.completed': 'Task marked as done',
    'task.assigned': 'Assigned to team member',
    'task.updated': 'Task updated',
    'task.deleted': 'Task deleted',
    'task.reopened': 'Task reopened',
    'task.priority_changed': 'Priority changed',
    'task.status_changed': 'Status changed',
    'task.due_date_changed': 'Due date changed',
  };
  if (map[eventType]) return map[eventType];
  // Fallback: convert "some.event_type" to "Some event type"
  const label = eventType.replace(/[._]/g, ' ').trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: task, isLoading } = useTask(id ?? '');
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();
  const assignTask = useAssignTask();
  const { data: teamMembers } = useTeamMembers();

  // Local state for inline editing
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [localDueDate, setLocalDueDate] = useState('');
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  // Bottom sheet state
  const [showPrioritySheet, setShowPrioritySheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showOverflowSheet, setShowOverflowSheet] = useState(false);
  const [showDueDateSheet, setShowDueDateSheet] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);

  // Sync task data to local state
  useEffect(() => {
    if (task) {
      setLocalTitle(task.title);
      setLocalDescription(task.description ?? '');
      setLocalDueDate(task.due_date ?? '');
    }
  }, [task]);

  // Auto-save title on blur
  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (!task || !id) return;
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== task.title) {
      hapticLight();
      updateTask.mutate(
        { id, data: { title: trimmed } },
        {
          onSuccess: () => showToast('success', 'Title updated'),
          onError: () => {
            hapticError();
            showToast('error', 'Failed to update title');
            setLocalTitle(task.title);
          },
        },
      );
    } else if (!trimmed) {
      setLocalTitle(task.title);
    }
  };

  // Auto-save description on blur
  const handleDescriptionBlur = () => {
    setEditingDescription(false);
    if (!task || !id) return;
    const current = task.description ?? '';
    if (localDescription !== current) {
      hapticLight();
      updateTask.mutate(
        { id, data: { description: localDescription || null } },
        {
          onSuccess: () => showToast('success', 'Description updated'),
          onError: () => {
            hapticError();
            showToast('error', 'Failed to update');
            setLocalDescription(current);
          },
        },
      );
    }
  };

  // Priority change
  const handlePriorityChange = (priority: TaskPriority) => {
    if (!id) return;
    hapticSelection();
    setShowPrioritySheet(false);
    updateTask.mutate(
      { id, data: { priority } },
      {
        onError: () => {
          hapticError();
          showToast('error', 'Failed to update priority');
        },
      },
    );
  };

  // Status change
  const handleStatusChange = (status: TaskStatus) => {
    if (!id) return;
    hapticSelection();
    setShowStatusSheet(false);
    updateStatus.mutate(
      { id, status },
      {
        onError: () => {
          hapticError();
          showToast('error', 'Failed to update status');
        },
      },
    );
  };

  // Mark complete / reopen
  const handleToggleComplete = () => {
    if (!task || !id) return;
    if (task.status === 'done') {
      hapticLight();
      updateStatus.mutate(
        { id, status: 'todo' },
        {
          onSuccess: () => showToast('success', 'Task reopened'),
          onError: () => {
            hapticError();
            showToast('error', 'Failed to reopen task');
          },
        },
      );
    } else {
      hapticSuccess();
      updateStatus.mutate(
        { id, status: 'done' },
        {
          onSuccess: () => {
            showUndoToast('Task completed', () => {
              hapticLight();
              updateStatus.mutate({ id, status: 'todo' });
            });
          },
          onError: () => {
            hapticError();
            showToast('error', 'Failed to complete task');
          },
        },
      );
    }
  };

  // Save due date
  const handleDueDateSave = () => {
    setShowDueDateSheet(false);
    setEditingDueDate(false);
    if (!task || !id) return;
    const current = task.due_date ?? '';
    if (localDueDate !== current) {
      hapticLight();
      updateTask.mutate(
        { id, data: { due_date: localDueDate || null } },
        {
          onSuccess: () => showToast('success', 'Due date updated'),
          onError: () => {
            hapticError();
            showToast('error', 'Failed to update due date');
            setLocalDueDate(current);
          },
        },
      );
    }
  };

  // Reassign task
  const handleAssign = (userId: string) => {
    if (!id) return;
    hapticSelection();
    setShowAssignSheet(false);
    assignTask.mutate(
      { id, userId },
      {
        onSuccess: () => {
          showToast('success', 'Task reassigned');
        },
        onError: () => {
          hapticError();
          showToast('error', 'Failed to reassign task');
        },
      },
    );
  };

  const handleUnassign = () => {
    if (!id) return;
    hapticSelection();
    setShowAssignSheet(false);
    updateTask.mutate(
      { id, data: { assigned_to: null } },
      {
        onSuccess: () => showToast('success', 'Task unassigned'),
        onError: () => {
          hapticError();
          showToast('error', 'Failed to unassign task');
        },
      },
    );
  };

  // Computed team member list for the assign sheet
  const displayMembers = teamMembers?.map((m) => ({
    id: m.user_id,
    name: m.user?.full_name ?? 'Unknown',
    title: m.title ?? 'Team Member',
    avatarUrl: m.user?.avatar_url ?? null,
  })) ?? [];

  // Activity log
  const { data: activity } = useQuery({
    queryKey: ['task-activity', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_events')
        .select('event_type, payload, created_at')
        .or(`payload->>reference_id.eq.${id},payload->>task_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!id,
  });

  // Delete
  const handleDelete = () => {
    setShowOverflowSheet(false);
    if (!id) return;
    Alert.alert(
      'Delete Task',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticLight();
            deleteTask.mutate(id, {
              onSuccess: () => {
                hapticSuccess();
                showToast('success', 'Task deleted');
                router.back();
              },
              onError: () => {
                hapticError();
                showToast('error', 'Failed to delete task');
              },
            });
          },
        },
      ],
    );
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerButton}><Skeleton height={20} className="w-5" /></View>
            <View style={styles.headerButton}><Skeleton height={20} className="w-5" /></View>
          </View>
          <Skeleton height={24} className="w-20 mt-5" />
          <Skeleton height={28} className="w-3/4 mt-4" />
          <View style={{ flexDirection: 'row', gap: space[3], marginTop: space[3] }}>
            <Skeleton height={28} className="w-24" />
            <Skeleton height={28} className="w-28" />
          </View>
          <Skeleton height={14} className="w-24 mt-8" />
          <Skeleton height={80} className="mt-3" />
        </View>
      </SafeAreaView>
    );
  }

  // --- Not found ---
  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={8}>
              <ChevronLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Task not found</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.goBackLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDone = task.status === 'done';
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const dueDateInfo = formatDueDate(task.due_date ?? null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <ChevronLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={() => setShowOverflowSheet(true)}
              hitSlop={8}
            >
              <MoreHorizontal size={20} color={colors.text.secondary} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Priority Badge */}
          <Pressable
            onPress={() => setShowPrioritySheet(true)}
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityConfig.bg },
            ]}
          >
            <StatusDot color={priorityConfig.color} size="sm" />
            <Text style={[styles.priorityLabel, { color: priorityConfig.color }]}>
              {priorityConfig.label.toUpperCase()}
            </Text>
          </Pressable>

          {/* Title — inline editable */}
          {editingTitle ? (
            <TextInput
              ref={titleRef}
              style={styles.titleInput}
              value={localTitle}
              onChangeText={setLocalTitle}
              onBlur={handleTitleBlur}
              onSubmitEditing={handleTitleBlur}
              autoFocus
              multiline
              blurOnSubmit
              returnKeyType="done"
            />
          ) : (
            <Pressable
              onPress={() => {
                setEditingTitle(true);
                setTimeout(() => titleRef.current?.focus(), 50);
              }}
              style={styles.titleRow}
            >
              <Text style={[styles.titleText, isDone && styles.titleDone]}>
                {task.title}
              </Text>
              <Pencil size={14} color={colors.text.muted} strokeWidth={1.5} style={{ marginTop: 2 }} />
            </Pressable>
          )}

          {/* Meta Row */}
          <View style={styles.metaRow}>
            {/* Status chip */}
            <Pressable
              onPress={() => setShowStatusSheet(true)}
              style={[styles.metaChip, { backgroundColor: statusConfig.bg }]}
            >
              <StatusDot color={statusConfig.color} size="sm" />
              <Text style={[styles.metaChipText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </Pressable>

            {/* Due date pill */}
            <Pressable
              onPress={() => {
                setLocalDueDate(task.due_date ?? '');
                setShowDueDateSheet(true);
              }}
              style={[
                styles.metaChip,
                { backgroundColor: dueDateInfo ? undefined : colors.bg.muted },
                dueDateInfo && dueDateInfo.color === colors.coral.DEFAULT && { backgroundColor: colors.coral.light },
                dueDateInfo && dueDateInfo.color === colors.velvet.DEFAULT && { backgroundColor: colors.velvet.wash },
                dueDateInfo && dueDateInfo.color === colors.text.secondary && { backgroundColor: colors.bg.muted },
              ]}
            >
              <Calendar
                size={14}
                color={dueDateInfo?.color ?? colors.text.muted}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.metaChipText,
                  { color: dueDateInfo?.color ?? colors.text.muted },
                ]}
              >
                {dueDateInfo?.label ?? 'Set due date'}
              </Text>
            </Pressable>

            {/* Source badge */}
            {task.source && (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor:
                      task.source === 'ai_suggested'
                        ? colors.plum.light
                        : colors.bg.muted,
                  },
                ]}
              >
                {task.source === 'ai_suggested' && (
                  <Sparkles size={12} color={colors.plum.DEFAULT} strokeWidth={1.5} />
                )}
                <Text
                  style={[
                    styles.metaChipText,
                    {
                      color:
                        task.source === 'ai_suggested'
                          ? colors.plum.DEFAULT
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {SOURCE_LABELS[task.source] ?? task.source}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              {!editingDescription && (
                <Pressable
                  onPress={() => {
                    setEditingDescription(true);
                    setTimeout(() => descriptionRef.current?.focus(), 50);
                  }}
                  hitSlop={8}
                >
                  <Pencil size={14} color={colors.text.muted} strokeWidth={1.5} />
                </Pressable>
              )}
            </View>
            {editingDescription ? (
              <View style={styles.descriptionEditCard}>
                <TextInput
                  ref={descriptionRef}
                  style={styles.descriptionInput}
                  value={localDescription}
                  onChangeText={setLocalDescription}
                  onBlur={handleDescriptionBlur}
                  autoFocus
                  multiline
                  placeholder="Add a description..."
                  placeholderTextColor={colors.text.muted}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setEditingDescription(true);
                  setTimeout(() => descriptionRef.current?.focus(), 50);
                }}
              >
                <Text
                  style={[
                    styles.descriptionText,
                    !localDescription && styles.descriptionPlaceholder,
                  ]}
                >
                  {localDescription || 'Tap to add a description...'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Assignee — tappable to reassign */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ASSIGNED TO</Text>
            <Pressable
              onPress={() => setShowAssignSheet(true)}
              style={({ pressed }) => [
                styles.assigneeCard,
                pressed && { backgroundColor: colors.bg.hover },
              ]}
            >
              {task.assigned_to_user ? (
                <>
                  <Avatar
                    name={task.assigned_to_user.full_name}
                    imageUrl={task.assigned_to_user.avatar_url}
                    size="md"
                  />
                  <View style={styles.assigneeInfo}>
                    <Text style={styles.assigneeName}>
                      {task.assigned_to_user.full_name}
                    </Text>
                    <Text style={styles.assigneeHint}>Tap to reassign</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.assigneePlaceholderIcon}>
                    <UserRoundPen size={18} color={colors.text.muted} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.assigneePlaceholderText}>Assign to someone</Text>
                </>
              )}
              <ChevronRight size={16} color={colors.text.muted} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Timestamps */}
          <View style={styles.timestampsSection}>
            <View style={styles.divider} />
            <Text style={styles.timestampText}>
              Created {formatRelative(task.created_at)}
            </Text>
            <Text style={styles.timestampText}>
              Updated {formatRelative(task.updated_at)}
            </Text>
          </View>

          {/* Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVITY</Text>
            {(!activity || activity.length === 0) ? (
              <Text style={styles.activityEmptyText}>No activity recorded</Text>
            ) : (
              <View style={styles.activityList}>
                {activity.map((event, idx) => (
                  <View key={`${event.event_type}-${event.created_at}-${idx}`} style={styles.activityRow}>
                    <View style={styles.activityDotColumn}>
                      <View style={styles.activityDot} />
                      {idx < activity.length - 1 && <View style={styles.activityLine} />}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {formatEventType(event.event_type)}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatRelative(event.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, space[4]) },
          ]}
        >
          <View style={styles.bottomBarInner}>
            <Pressable
              onPress={handleToggleComplete}
              disabled={updateStatus.isPending}
              style={[
                styles.completeButton,
                isDone ? styles.reopenButton : null,
                updateStatus.isPending ? { opacity: 0.5 } : null,
              ]}
            >
              {updateStatus.isPending ? (
                <ActivityIndicator size="small" color={isDone ? colors.text.body : colors.text.onVelvet} />
              ) : isDone ? (
                <>
                  <RotateCcw size={16} color={colors.text.body} strokeWidth={2} />
                  <Text style={[styles.completeButtonText, styles.reopenButtonText]}>
                    Reopen Task
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} color={colors.text.onVelvet} strokeWidth={2} />
                  <Text style={styles.completeButtonText}>
                    Mark Complete
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Priority Picker Sheet */}
      <VersaBottomSheet
        isOpen={showPrioritySheet}
        onClose={() => setShowPrioritySheet(false)}
        snapPoints={['35%']}
        title="Set Priority"
      >
        <View style={styles.sheetContent}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => handlePriorityChange(p.value)}
              style={({ pressed }) => [
                styles.sheetRow,
                pressed && { backgroundColor: colors.bg.hover },
                task.priority === p.value && { backgroundColor: colors.bg.hover },
              ]}
            >
              <View style={styles.sheetRowIcon}>
                <StatusDot color={p.color} size="md" />
              </View>
              <Text style={styles.sheetRowLabel}>{p.label}</Text>
              {task.priority === p.value && (
                <Check size={18} color={colors.velvet.DEFAULT} strokeWidth={2} />
              )}
            </Pressable>
          ))}
        </View>
      </VersaBottomSheet>

      {/* Status Picker Sheet */}
      <VersaBottomSheet
        isOpen={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        snapPoints={['40%']}
        title="Set Status"
      >
        <View style={styles.sheetContent}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => handleStatusChange(s.value)}
              style={({ pressed }) => [
                styles.sheetRow,
                pressed && { backgroundColor: colors.bg.hover },
                task.status === s.value && { backgroundColor: colors.bg.hover },
              ]}
            >
              <View style={styles.sheetRowIcon}>
                <StatusDot color={s.color} size="md" />
              </View>
              <Text style={styles.sheetRowLabel}>{s.label}</Text>
              {task.status === s.value && (
                <Check size={18} color={colors.velvet.DEFAULT} strokeWidth={2} />
              )}
            </Pressable>
          ))}
        </View>
      </VersaBottomSheet>

      {/* Due Date Sheet */}
      <VersaBottomSheet
        isOpen={showDueDateSheet}
        onClose={() => {
          handleDueDateSave();
        }}
        snapPoints={['30%']}
        title="Due Date"
      >
        <View style={styles.sheetContent}>
          <TextInput
            style={styles.dueDateInput}
            value={localDueDate}
            onChangeText={setLocalDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleDueDateSave}
          />
          <View style={styles.dueDateActions}>
            <Pressable
              onPress={() => {
                setLocalDueDate('');
                handleDueDateSave();
              }}
              style={styles.dueDateClearButton}
            >
              <Text style={styles.dueDateClearText}>Clear</Text>
            </Pressable>
            <Pressable onPress={handleDueDateSave} style={styles.dueDateSaveButton}>
              <Text style={styles.dueDateSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </VersaBottomSheet>

      {/* Overflow Menu Sheet */}
      <VersaBottomSheet
        isOpen={showOverflowSheet}
        onClose={() => setShowOverflowSheet(false)}
        snapPoints={['35%']}
        title="Actions"
      >
        <View style={styles.sheetContent}>
          <Pressable
            onPress={() => {
              setShowOverflowSheet(false);
              setEditingTitle(true);
            }}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.bg.hover },
            ]}
          >
            <View style={styles.sheetRowIcon}>
              <Pencil size={18} color={colors.text.secondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.sheetRowLabel}>Edit Title</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowOverflowSheet(false);
              setShowPrioritySheet(true);
            }}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.bg.hover },
            ]}
          >
            <View style={styles.sheetRowIcon}>
              <StatusDot color={priorityConfig.color} size="md" />
            </View>
            <Text style={styles.sheetRowLabel}>Change Priority</Text>
            <Text style={styles.sheetRowValue}>{priorityConfig.label}</Text>
            <ChevronRight size={16} color={colors.text.muted} strokeWidth={1.5} style={styles.sheetRowChevron} />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowOverflowSheet(false);
              setShowStatusSheet(true);
            }}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.bg.hover },
            ]}
          >
            <View style={styles.sheetRowIcon}>
              <StatusDot color={statusConfig.color} size="md" />
            </View>
            <Text style={styles.sheetRowLabel}>Change Status</Text>
            <Text style={styles.sheetRowValue}>{statusConfig.label}</Text>
            <ChevronRight size={16} color={colors.text.muted} strokeWidth={1.5} style={styles.sheetRowChevron} />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowOverflowSheet(false);
              setShowAssignSheet(true);
            }}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.bg.hover },
            ]}
          >
            <View style={styles.sheetRowIcon}>
              <UserRoundPen size={18} color={colors.text.secondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.sheetRowLabel}>Reassign</Text>
            {task.assigned_to_user && (
              <Text style={styles.sheetRowValue}>{task.assigned_to_user.full_name}</Text>
            )}
            <ChevronRight size={16} color={colors.text.muted} strokeWidth={1.5} style={styles.sheetRowChevron} />
          </Pressable>
          <View style={styles.sheetDivider} />
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.coral.light },
            ]}
          >
            <View style={styles.sheetRowIcon}>
              <Trash2 size={18} color={colors.coral.DEFAULT} strokeWidth={1.5} />
            </View>
            <Text style={[styles.sheetRowLabel, { color: colors.coral.DEFAULT }]}>
              Delete Task
            </Text>
          </Pressable>
        </View>
      </VersaBottomSheet>

      {/* Assign / Reassign Sheet */}
      <VersaBottomSheet
        isOpen={showAssignSheet}
        onClose={() => setShowAssignSheet(false)}
        snapPoints={['50%']}
        title="Assign To"
      >
        <View style={styles.sheetContent}>
          {displayMembers.length === 0 && (
            <Text style={styles.emptyMembersText}>No team members found</Text>
          )}
          {displayMembers.map((member) => {
            const isCurrentAssignee = task.assigned_to === member.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => handleAssign(member.id)}
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed && { backgroundColor: colors.bg.hover },
                  isCurrentAssignee && { backgroundColor: colors.bg.hover },
                ]}
              >
                <Avatar name={member.name} imageUrl={member.avatarUrl} size="sm" />
                <View style={styles.assignSheetMemberInfo}>
                  <Text style={[styles.sheetRowLabel, isCurrentAssignee && { fontFamily: 'DMSans_600SemiBold', fontWeight: '600' as const }]}>
                    {member.name}
                  </Text>
                  <Text style={styles.assignSheetMemberTitle}>{member.title}</Text>
                </View>
                {isCurrentAssignee && (
                  <Check size={18} color={colors.velvet.DEFAULT} strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
          {task.assigned_to && (
            <>
              <View style={styles.sheetDivider} />
              <Pressable
                onPress={handleUnassign}
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed && { backgroundColor: colors.bg.hover },
                ]}
              >
                <View style={styles.sheetRowIcon}>
                  <UserRoundPen size={18} color={colors.text.secondary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.sheetRowLabel, { color: colors.text.secondary }]}>
                  Unassign
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </VersaBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[5],
    paddingTop: space[2],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingTop: space[2],
    paddingBottom: space[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },

  // Priority badge
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[2],
    paddingVertical: 4,
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
    marginTop: space[5],
    marginHorizontal: space[5],
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.5,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    marginTop: space[3],
    paddingHorizontal: space[5],
  },
  titleText: {
    ...typography.headingLg,
    color: colors.text.primary,
    flex: 1,
  },
  titleInput: {
    ...typography.headingLg,
    color: colors.text.primary,
    marginTop: space[3],
    paddingHorizontal: space[5],
    padding: 0,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[3],
    paddingHorizontal: space[5],
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingVertical: 6,
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },

  // Sections
  section: {
    marginTop: space[8],
    paddingHorizontal: space[5],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[3],
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Description
  descriptionText: {
    ...typography.bodyLg,
    color: colors.text.body,
    lineHeight: 24,
  },
  descriptionEditCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    minHeight: 100,
  },
  descriptionInput: {
    ...typography.bodyLg,
    color: colors.text.body,
    lineHeight: 24,
    padding: 0,
    minHeight: 80,
  },
  descriptionPlaceholder: {
    color: colors.text.muted,
  },

  // Assignee
  assigneeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[3],
  },
  assigneeInfo: {
    flex: 1,
  },
  assigneeName: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.body,
  },
  assigneeHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    marginTop: 1,
  },
  assigneePlaceholderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneePlaceholderText: {
    ...typography.bodyMd,
    color: colors.text.muted,
    flex: 1,
  },

  // Assign sheet members
  assignSheetMemberInfo: {
    flex: 1,
    marginLeft: space[2],
  },
  assignSheetMemberTitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.secondary,
    marginTop: 1,
  },
  emptyMembersText: {
    ...typography.bodyMd,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: space[8],
  },

  // Timestamps
  timestampsSection: {
    marginTop: space[10],
    paddingHorizontal: space[5],
    gap: space[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginBottom: space[4],
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
  },

  // Activity
  activityList: {
    marginTop: space[2],
  },
  activityRow: {
    flexDirection: 'row',
    minHeight: 32,
  },
  activityDotColumn: {
    width: 20,
    alignItems: 'center',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2D8DC',
    marginTop: 5,
  },
  activityLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E2D8DC',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: space[3],
    marginLeft: space[2],
  },
  activityText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: '#6B6889',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    marginLeft: space[2],
  },
  activityEmptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    marginTop: space[2],
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: space[5],
    paddingTop: space[3],
    backgroundColor: colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    ...shadows.card,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: 48,
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: radius.md,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.onVelvet,
  },
  reopenButton: {
    backgroundColor: colors.bg.muted,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  reopenButtonText: {
    color: colors.text.body,
  },

  // Empty / not found
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    color: colors.text.muted,
  },
  goBackLink: {
    ...typography.bodyMd,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.velvet.DEFAULT,
    marginTop: space[4],
  },

  // Bottom sheets
  sheetContent: {
    width: '100%',
  },
  sheetRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[1],
    borderRadius: radius.md,
  },
  sheetRowIcon: {
    width: 28,
    alignItems: 'center',
  },
  sheetRowLabel: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.primary,
    flex: 1,
    marginLeft: space[2],
  },
  sheetRowValue: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginRight: space[2],
  },
  sheetRowChevron: {
    marginLeft: space[1],
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginVertical: space[2],
  },

  // Due date sheet
  dueDateInput: {
    ...typography.bodyLg,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  dueDateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space[3],
    marginTop: space[4],
  },
  dueDateClearButton: {
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
  dueDateClearText: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
  },
  dueDateSaveButton: {
    backgroundColor: colors.velvet.DEFAULT,
    paddingVertical: space[2],
    paddingHorizontal: space[5],
    borderRadius: radius.md,
  },
  dueDateSaveText: {
    ...typography.bodyMd,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.onVelvet,
  },
});

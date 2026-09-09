import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Phone, Mail, ClipboardList } from 'lucide-react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { FlatRow } from '@/src/components/ui/flat-row';
import { StatusDot } from '@/src/components/ui/status-dot';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { useTasks } from '@/src/hooks/use-tasks';
import { formatDueDate } from '@/src/utils/date';
import { hapticLight } from '@/src/lib/haptics';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { Task, TaskPriority } from '@/src/types/models';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: colors.status.urgent,
  high: colors.status.high,
  medium: colors.status.medium,
  low: colors.status.low,
};

export default function MemberDetailScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: allTasks } = useTasks();

  const member = useMemo(
    () => members?.find((m) => m.user_id === userId),
    [members, userId],
  );

  const memberTasks = useMemo(
    () => allTasks?.filter((t: Task) => t.assigned_to === userId) ?? [],
    [allTasks, userId],
  );

  const activeTasks = memberTasks.filter(
    (t: Task) => t.status === 'todo' || t.status === 'in_progress',
  );

  const name = member?.user?.full_name ?? 'Unknown';
  const title = member?.title ?? 'Team Member';

  if (membersLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <ChevronLeft size={22} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={s.headerTitle}>Team</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.profileSection}>
          <Skeleton height={56} rounded className="w-14" />
          <View style={{ marginTop: space[3] }}><Skeleton height={18} className="w-32" /></View>
          <View style={{ marginTop: space[2] }}><Skeleton height={14} className="w-24" /></View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <ChevronLeft size={22} color={colors.text.secondary} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>Team</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Profile */}
        <View style={s.profileSection}>
          <Avatar name={name} imageUrl={member?.user?.avatar_url} size="lg" />
          <Text style={s.profileName}>{name}</Text>
          <Text style={s.profileTitle}>{title}</Text>
        </View>

        {/* Status pills */}
        <View style={s.pillsRow}>
          <View style={s.statusPill}>
            <View style={s.onlineDot} />
            <Text style={s.statusPillText}>Online</Text>
          </View>
          <View style={s.taskCountPill}>
            <Text style={s.taskCountPillText}>
              {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.actionsRow}>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push('/(tabs)/comms' as never);
            }}
            style={s.actionSquare}
          >
            <Phone size={18} color={colors.text.secondary} strokeWidth={1.5} />
            <Text style={s.actionLabel}>Call</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push('/(tabs)/comms?tab=emails' as never);
            }}
            style={s.actionSquare}
          >
            <Mail size={18} color={colors.text.secondary} strokeWidth={1.5} />
            <Text style={s.actionLabel}>Email</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push('/(modals)/delegate' as never);
            }}
            style={s.actionSquare}
          >
            <ClipboardList size={18} color={colors.text.secondary} strokeWidth={1.5} />
            <Text style={s.actionLabel}>Assign</Text>
          </Pressable>
        </View>

        {/* Task list */}
        <View style={s.taskSection}>
          <Text style={s.sectionLabel}>
            TASKS ({memberTasks.length})
          </Text>
          {memberTasks.length === 0 ? (
            <View style={s.emptyState}>
              <ClipboardList size={32} color={colors.text.muted} strokeWidth={1.5} />
              <Text style={s.emptyText}>No tasks assigned</Text>
            </View>
          ) : (
            memberTasks.map((task: Task) => {
              const dotColor = PRIORITY_COLORS[task.priority];
              const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
              const isDone = task.status === 'done';

              return (
                <FlatRow key={task.id} showDivider dividerIndent={0}>
                  <View style={s.taskContent}>
                    <View style={s.taskTitleRow}>
                      <StatusDot color={dotColor} size="sm" />
                      <Text
                        style={[s.taskTitle, isDone && s.taskTitleDone]}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                    </View>
                    <View style={s.taskMeta}>
                      <Text style={s.taskStatus}>
                        {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                      </Text>
                      {dueDateInfo && (
                        <Text style={[s.taskDue, { color: dueDateInfo.color }]}>
                          {dueDateInfo.label}
                        </Text>
                      )}
                    </View>
                  </View>
                </FlatRow>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  headerTitle: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  scrollContent: {
    paddingBottom: space[12],
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingTop: space[4],
    paddingBottom: space[5],
  },
  profileName: {
    ...typography.headingLg,
    color: colors.text.primary,
    marginTop: space[3],
  },
  profileTitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: space[1],
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[2],
    paddingBottom: space[5],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sage.light,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage.DEFAULT,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.sage.DEFAULT,
  },
  taskCountPill: {
    backgroundColor: colors.bg.muted,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  taskCountPillText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[4],
    paddingBottom: space[6],
    paddingHorizontal: space[5],
  },
  actionSquare: {
    width: 72,
    alignItems: 'center',
    gap: 4,
    paddingVertical: space[3],
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    ...shadows.card,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.muted,
  },

  // Tasks
  taskSection: {
    paddingHorizontal: space[5],
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[3],
  },
  taskContent: {
    flex: 1,
    paddingVertical: space[1],
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  taskTitle: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: 4,
    paddingLeft: 18,
  },
  taskStatus: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  taskDue: {
    ...typography.bodySm,
  },
  emptyState: {
    paddingVertical: space[8],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: space[3],
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.muted,
  },
});

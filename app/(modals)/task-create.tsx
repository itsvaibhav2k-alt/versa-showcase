import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '@/src/components/ui/input';
import { Avatar } from '@/src/components/ui/avatar';
import { StatusDot } from '@/src/components/ui/status-dot';
import type { TaskPriority } from '@/src/types/models';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { useCreateTask } from '@/src/hooks/use-tasks';
import { useAuth } from '@/src/hooks/use-auth';
import { showToast } from '@/src/components/ui/toast-config';
import { isValidDate } from '@/src/utils/validation';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

const PRIORITIES: { value: TaskPriority; label: string; dotColor: string }[] = [
  { value: 'low', label: 'Low', dotColor: colors.status.low },
  { value: 'medium', label: 'Medium', dotColor: colors.status.medium },
  { value: 'high', label: 'High', dotColor: colors.status.high },
  { value: 'urgent', label: 'Urgent', dotColor: colors.status.urgent },
];

export default function TaskCreateModal() {
  const router = useRouter();
  const { data: teamMembers } = useTeamMembers();
  const createTask = useCreateTask();
  const { userId } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});

  const assignees = teamMembers?.map((m) => ({
    id: m.user_id,
    name: m.user?.full_name ?? 'Unknown',
  })) ?? [];

  const handleCreate = () => {
    const newErrors: { title?: string; dueDate?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (dueDate.trim() && !isValidDate(dueDate.trim())) {
      newErrors.dueDate = 'Use format YYYY-MM-DD';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createTask.mutate(
      {
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        assigned_to: selectedAssignee ?? undefined,
        assigned_by: userId,
      },
      {
        onSuccess: () => router.back(),
        onError: () => showToast('error', 'Error', 'Could not create task'),
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Task</Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.fields}>
            <Input
              label="Title"
              placeholder="What needs to be done?"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            <Input
              label="Description"
              placeholder="Add details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="h-24"
              textAlignVertical="top"
            />

            {/* Priority — StatusDot + label radio */}
            <View>
              <Text style={styles.fieldLabel}>PRIORITY</Text>
              <View style={styles.radioGroup}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    style={[
                      styles.radioOption,
                      priority === p.value && styles.radioOptionActive,
                    ]}
                  >
                    <StatusDot color={p.dotColor} size="md" />
                    <Text
                      style={[
                        styles.radioLabel,
                        priority === p.value && styles.radioLabelActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input
              label="Due Date"
              placeholder="e.g. 2026-02-20"
              value={dueDate}
              onChangeText={setDueDate}
              error={errors.dueDate}
            />

            {/* Assignee — flat row radio */}
            <View>
              <Text style={styles.fieldLabel}>ASSIGN TO</Text>
              <View style={styles.assigneeList}>
                {assignees.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => setSelectedAssignee(
                      selectedAssignee === a.id ? null : a.id,
                    )}
                    style={[
                      styles.assigneeRow,
                      selectedAssignee === a.id && styles.assigneeRowActive,
                    ]}
                  >
                    <Avatar name={a.name} size="sm" />
                    <Text
                      style={[
                        styles.assigneeName,
                        selectedAssignee === a.id && styles.assigneeNameActive,
                      ]}
                    >
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Submit */}
          <View style={styles.submitArea}>
            <Pressable
              onPress={handleCreate}
              disabled={!title.trim() || createTask.isPending}
              style={({ pressed }) => [
                styles.submitButton,
                (!title.trim() || createTask.isPending) && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}
            >
              <Text style={styles.submitText}>Create Task</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: space[5],
    paddingTop: space[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  cancelText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  fields: {
    marginTop: space[6],
    gap: space[5],
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[2],
  },
  radioGroup: {
    flexDirection: 'row',
    gap: space[2],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
  },
  radioOptionActive: {
    backgroundColor: colors.bg.hover,
  },
  radioLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  radioLabelActive: {
    color: colors.text.primary,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  assigneeList: {
    gap: space[1],
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
  },
  assigneeRowActive: {
    backgroundColor: colors.bg.hover,
  },
  assigneeName: {
    ...typography.bodyMd,
    color: colors.text.body,
  },
  assigneeNameActive: {
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
  },
  submitArea: {
    marginTop: space[8],
    marginBottom: space[8],
  },
  submitButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    alignItems: 'center',
    ...shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  submitText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.onVelvet,
  },
});

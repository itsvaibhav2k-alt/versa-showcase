import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { useCreateTask } from '@/src/hooks/use-tasks';
import { useAuth } from '@/src/hooks/use-auth';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight } from '@/src/lib/haptics';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

type DueOption = 'Today' | 'Tomorrow' | 'This Week' | 'Next Week';
type PriorityOption = 'low' | 'med' | 'high';

const DUE_OPTIONS: DueOption[] = ['Today', 'Tomorrow', 'This Week', 'Next Week'];

function computeDueDate(option: DueOption): string {
  const now = new Date();
  switch (option) {
    case 'Today':
      return now.toISOString();
    case 'Tomorrow': {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d.toISOString();
    }
    case 'This Week': {
      const d = new Date(now);
      d.setDate(d.getDate() + 5);
      return d.toISOString();
    }
    case 'Next Week': {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    }
  }
}

function mapPriority(p: PriorityOption): 'low' | 'medium' | 'high' {
  if (p === 'med') return 'medium';
  return p;
}

export default function DelegateModal() {
  const router = useRouter();
  const { data: teamMembers } = useTeamMembers();
  const createTask = useCreateTask();
  const { userId } = useAuth();

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueOption, setDueOption] = useState<DueOption>('This Week');
  const [priority, setPriority] = useState<PriorityOption>('med');

  const displayMembers = teamMembers?.map((m) => ({
    id: m.user_id,
    name: m.user?.full_name ?? 'Unknown',
    firstName: (m.user?.full_name ?? 'Unknown').split(' ')[0],
    avatarUrl: m.user?.avatar_url ?? null,
  })) ?? [];

  const selectedMemberData = displayMembers.find((m) => m.id === selectedMember);
  const canSubmit = !!selectedMember && !!taskDescription.trim() && !createTask.isPending;

  const cycleDue = () => {
    hapticLight();
    const idx = DUE_OPTIONS.indexOf(dueOption);
    setDueOption(DUE_OPTIONS[(idx + 1) % DUE_OPTIONS.length]);
  };

  const handleDelegate = () => {
    if (!canSubmit) return;
    hapticLight();
    createTask.mutate(
      {
        title: taskDescription,
        description: notes || undefined,
        assigned_to: selectedMember,
        assigned_by: userId,
        priority: mapPriority(priority),
        due_date: computeDueDate(dueOption),
      },
      {
        onSuccess: () => router.back(),
        onError: () => showToast('error', 'Error', 'Could not delegate task'),
      },
    );
  };

  const priorityColors: Record<PriorityOption, string> = {
    low: colors.text.muted,
    med: colors.accent.sandy,
    high: colors.coral.DEFAULT,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Delegate Task</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        {/* Assignee selector — horizontal chips */}
        <View>
          <Text style={styles.fieldLabel}>ASSIGN TO</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {displayMembers.map((member) => {
              const isSelected = selectedMember === member.id;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => {
                    hapticLight();
                    setSelectedMember(member.id);
                  }}
                  style={[
                    styles.memberChip,
                    isSelected ? styles.memberChipSelected : styles.memberChipUnselected,
                  ]}
                >
                  <Avatar
                    name={member.name}
                    imageUrl={member.avatarUrl}
                    size="xs"
                  />
                  <Text
                    style={[
                      styles.chipName,
                      isSelected ? styles.chipNameSelected : styles.chipNameUnselected,
                    ]}
                  >
                    {member.firstName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Task input */}
        <View>
          <Text style={styles.fieldLabel}>TASK</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What do you want to delegate?"
            placeholderTextColor={colors.text.muted}
            value={taskDescription}
            onChangeText={setTaskDescription}
          />
        </View>

        {/* Due date + Priority row */}
        <View style={styles.dueAndPriorityRow}>
          {/* Due date */}
          <View style={styles.halfColumn}>
            <Text style={styles.fieldLabel}>DUE</Text>
            <Pressable onPress={cycleDue} style={styles.dueButton}>
              <Text style={styles.dueButtonText}>{dueOption}</Text>
              <ChevronDown size={12} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Priority */}
          <View style={styles.halfColumn}>
            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View style={styles.priorityContainer}>
              {(['low', 'med', 'high'] as PriorityOption[]).map((p) => {
                const isActive = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      hapticLight();
                      setPriority(p);
                    }}
                    style={[
                      styles.prioritySegment,
                      isActive
                        ? { backgroundColor: priorityColors[p] }
                        : styles.prioritySegmentInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        isActive
                          ? styles.priorityTextActive
                          : styles.priorityTextInactive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notes (optional) */}
        <View>
          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="Additional context or instructions..."
            placeholderTextColor={colors.text.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Delegate button */}
        <Pressable
          onPress={handleDelegate}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.delegateButton,
            !canSubmit && styles.delegateButtonDisabled,
            pressed && canSubmit && styles.delegateButtonPressed,
          ]}
        >
          <Text style={styles.delegateButtonText}>
            {selectedMemberData
              ? `Delegate to ${selectedMemberData.firstName}`
              : 'Select a team member'}
          </Text>
        </Pressable>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[8],
    gap: space[5],
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
  fieldLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[2],
  },
  chipRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  memberChipUnselected: {
    backgroundColor: colors.bg.deep,
    borderColor: colors.border.DEFAULT,
  },
  memberChipSelected: {
    backgroundColor: colors.velvet.DEFAULT,
    borderColor: colors.velvet.DEFAULT,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
  },
  chipNameUnselected: {
    color: colors.text.body,
  },
  chipNameSelected: {
    color: colors.text.onVelvet,
  },
  textInput: {
    backgroundColor: colors.bg.deep,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.primary,
  },
  notesInput: {
    minHeight: 44,
    fontSize: 12,
  },
  dueAndPriorityRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  halfColumn: {
    flex: 1,
  },
  dueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.deep,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  dueButtonText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.primary,
  },
  priorityContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.deep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  prioritySegment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritySegmentInactive: {
    backgroundColor: 'transparent',
  },
  priorityText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  priorityTextActive: {
    color: '#FFFFFF',
  },
  priorityTextInactive: {
    color: colors.text.muted,
  },
  delegateButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  delegateButtonDisabled: {
    opacity: 0.4,
  },
  delegateButtonPressed: {
    backgroundColor: colors.velvet.pressed,
    transform: [{ scale: 0.98 }],
  },
  delegateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
  },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '@/src/components/ui/input';
import { useCreateReminder } from '@/src/hooks/use-reminders';
import { useAuth } from '@/src/hooks/use-auth';
import { showToast } from '@/src/components/ui/toast-config';
import { isValidDateTime } from '@/src/utils/validation';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

export default function ReminderCreateModal() {
  const router = useRouter();
  const createReminder = useCreateReminder();
  const { userId } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [errors, setErrors] = useState<{ title?: string; remindAt?: string }>({});

  const handleCreate = () => {
    const newErrors: { title?: string; remindAt?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!remindAt.trim() || !isValidDateTime(remindAt.trim())) {
      newErrors.remindAt = 'Enter a valid date and time';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createReminder.mutate(
      {
        title,
        body: body || undefined,
        remind_at: remindAt,
      },
      {
        onSuccess: () => router.back(),
        onError: () => showToast('error', 'Error', 'Could not save reminder'),
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
            <Text style={styles.title}>New Reminder</Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.fields}>
            <Input
              label="Title"
              placeholder="What do you want to remember?"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            <Input
              label="Notes"
              placeholder="Add details..."
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              className="h-24"
              textAlignVertical="top"
            />

            <Input
              label="Date & Time"
              placeholder="e.g. 2026-03-01 09:00"
              value={remindAt}
              onChangeText={setRemindAt}
              error={errors.remindAt}
            />
          </View>

          {/* Submit */}
          <View style={styles.submitArea}>
            <Pressable
              onPress={handleCreate}
              disabled={!title.trim() || !remindAt.trim() || createReminder.isPending}
              style={({ pressed }) => [
                styles.submitButton,
                (!title.trim() || !remindAt.trim() || createReminder.isPending) && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}
            >
              <Text style={styles.submitText}>Create Reminder</Text>
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

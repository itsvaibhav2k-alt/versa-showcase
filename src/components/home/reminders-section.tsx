import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { Reminder } from '@/src/types/models';

interface RemindersSectionProps {
  reminders: Reminder[] | undefined;
  isLoading?: boolean;
}

function formatReminderTime(remindAt: string): string {
  const d = new Date(remindAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 0) {
    // Already past
    const absDiff = Math.abs(diffSeconds);
    if (absDiff < 60) return 'Just now';
    if (absDiff < 3600) {
      const mins = Math.floor(absDiff / 60);
      return `${mins}m ago`;
    }
    if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return `${hours}h ago`;
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }

  // Future
  if (diffSeconds < 60) return 'In less than a minute';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `In ${mins}m`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `In ${hours}h`;
  }
  const diffDays = Math.floor(diffSeconds / 86400);
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

export function RemindersSection({ reminders, isLoading }: RemindersSectionProps) {
  const upcoming = reminders?.filter((r) => !r.is_fired) ?? [];

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <Text style={styles.sectionTitle}>REMINDERS</Text>

      {/* Empty state */}
      {!isLoading && upcoming.length === 0 && (
        <Text style={styles.emptyText}>No upcoming reminders</Text>
      )}

      {/* Reminder rows inside a card */}
      {upcoming.length > 0 && (
        <View style={styles.card}>
          {upcoming.map((reminder, index) => (
            <StaggeredFadeIn key={reminder.id} index={index}>
              <View
                style={[
                  styles.row,
                  index < upcoming.length - 1 && styles.rowBorder,
                ]}
              >
                <Bell
                  size={16}
                  color={colors.velvet.DEFAULT}
                  strokeWidth={1.5}
                />
                <View style={styles.rowContent}>
                  <Text style={styles.reminderTitle} numberOfLines={1}>
                    {reminder.title}
                  </Text>
                  <Text style={styles.reminderTime}>
                    {formatReminderTime(reminder.remind_at)}
                  </Text>
                </View>
              </View>
            </StaggeredFadeIn>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 28,
    paddingHorizontal: space[4],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[3],
  },
  emptyText: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.muted,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[2],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingBottom: space[3],
    marginBottom: space[2],
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: space[3],
  },
  reminderTitle: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.body,
    flex: 1,
    marginRight: space[2],
  },
  reminderTime: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
});

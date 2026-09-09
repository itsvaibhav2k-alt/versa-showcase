import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { FlatRow } from '@/src/components/ui/flat-row';
import { StatusDot } from '@/src/components/ui/status-dot';
import { colors, typography, space } from '@/src/lib/design-tokens';
import type { TaskPriority } from '@/src/types/models';

interface TaskCardProps {
  title: string;
  priority: TaskPriority;
  assigneeName?: string;
  assigneeAvatar?: string | null;
  dueDate?: string | null;
  onPress?: () => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: colors.status.urgent,
  high: colors.status.high,
  medium: colors.status.medium,
  low: colors.status.low,
};

export function TaskCard({ title, priority, assigneeName, assigneeAvatar, dueDate, onPress }: TaskCardProps) {
  const dotColor = PRIORITY_COLORS[priority];

  return (
    <FlatRow onPress={onPress} showDivider={true} dividerIndent={0}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {assigneeName && (
            <View style={styles.avatarWrap}>
              <Avatar name={assigneeName} imageUrl={assigneeAvatar} size="xs" />
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <StatusDot color={dotColor} size="sm" />
          {dueDate && (
            <Text style={styles.dueDate}>Due {dueDate}</Text>
          )}
        </View>
      </View>
    </FlatRow>
  );
}

const styles = StyleSheet.create({
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
});

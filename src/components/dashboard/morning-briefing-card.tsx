import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StatusDot } from '@/src/components/ui/status-dot';
import { Card } from '@/src/components/ui/card';
import { colors, typography, space, shadows } from '@/src/lib/design-tokens';
import type { Digest } from '@/src/types/models';

interface MorningBriefingCardProps {
  digest: Digest | null | undefined;
  isLoading: boolean;
  onGenerateBriefing: () => void;
}

export function MorningBriefingCard({ digest, isLoading, onGenerateBriefing }: MorningBriefingCardProps) {
  if (isLoading) {
    return (
      <Card variant="ai">
        <Skeleton width="33%" height={14} />
        <View style={{ marginTop: space[3] }}>
          <Skeleton width="100%" height={14} />
        </View>
        <View style={{ marginTop: space[2] }}>
          <Skeleton width="80%" height={14} />
        </View>
      </Card>
    );
  }

  if (!digest) {
    return (
      <Card variant="ai">
        <View style={styles.emptyContent}>
          <View style={styles.headerRow}>
            <Sparkles size={14} color={colors.plum.DEFAULT} />
            <Text style={styles.headerLabel}>VERSA AI</Text>
          </View>
          <Text style={styles.emptyText}>No briefing yet today</Text>
          <Pressable onPress={onGenerateBriefing} style={styles.generateButton}>
            <Text style={styles.generateButtonText}>Generate Briefing</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  const topTasks = digest.content?.tasks?.slice(0, 3) ?? [];
  const now = new Date();

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent': return colors.status.urgent;
      case 'high': return colors.status.high;
      case 'medium': return colors.status.medium;
      default: return colors.status.low;
    }
  };

  return (
    <Card variant="ai">
      {/* Header */}
      <View style={styles.headerRow}>
        <Sparkles size={14} color={colors.plum.DEFAULT} />
        <Text style={styles.headerLabel}>VERSA AI</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{digest.summary}</Text>

      {/* Top priorities as StatusDots */}
      {topTasks.length > 0 && (
        <View style={styles.priorityList}>
          {topTasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < now;
            return (
              <View key={task.id} style={styles.priorityItem}>
                <StatusDot
                  color={isOverdue ? colors.status.urgent : getPriorityColor(task.priority)}
                  size="sm"
                />
                <Text
                  style={[
                    styles.priorityText,
                    isOverdue && { color: colors.coral.DEFAULT },
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.plum.DEFAULT,
  },
  summary: {
    ...typography.bodyMd,
    color: colors.text.body,
    marginTop: space[3],
  },
  priorityList: {
    marginTop: space[3],
    gap: 8,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityText: {
    ...typography.bodySm,
    color: colors.text.body,
    flex: 1,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: space[3],
    marginBottom: space[3],
  },
  generateButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: space[5],
  },
  generateButtonText: {
    color: colors.text.onVelvet,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
  },
});

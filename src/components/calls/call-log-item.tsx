import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Voicemail, Sparkles } from 'lucide-react-native';
import { FlatRow } from '@/src/components/ui/flat-row';
import { colors, typography, space } from '@/src/lib/design-tokens';
import type { CallStatus } from '@/src/types/models';

interface CallLogItemProps {
  callerName: string | null;
  callerPhone: string;
  duration: number;
  timeAgo: string;
  callTime?: string;
  status: CallStatus;
  summary?: string;
  onPress?: () => void;
}

const STATUS_DOT_COLORS: Record<CallStatus, string> = {
  completed: colors.sage.DEFAULT,
  missed: colors.coral.DEFAULT,
  voicemail: colors.sky.DEFAULT,
  failed: colors.text.muted,
};

function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CallLogItem({
  callerName,
  callerPhone,
  duration,
  timeAgo,
  callTime,
  status,
  summary,
  onPress,
}: CallLogItemProps) {
  const displayName = callerName || callerPhone;
  const isMissed = status === 'missed';
  const isVoicemail = status === 'voicemail';
  const dotColor = STATUS_DOT_COLORS[status];
  const displayTime = callTime || timeAgo;

  return (
    <FlatRow
      onPress={onPress}
      showDivider={true}
      dividerIndent={28}
      testID={`flat-row-call-${callerPhone}`}
    >
      {/* Left: Status dot */}
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />

      {/* Middle: Name + phone + summary */}
      <View style={styles.content}>
        <Text
          style={[styles.name, isMissed && styles.nameMissed]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isMissed ? 'Missed call' : callerName ? callerPhone : 'Outbound · AI Agent'}
        </Text>
        {summary && status === 'completed' && (
          <View style={styles.summaryRow}>
            <Sparkles size={10} color={colors.plum.DEFAULT} strokeWidth={1.5} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {summary}
            </Text>
          </View>
        )}
      </View>

      {/* Right: Duration/status + time */}
      <View style={styles.right}>
        {isMissed ? (
          <Text style={styles.missedLabel}>Missed</Text>
        ) : isVoicemail ? (
          <Voicemail size={14} color={colors.sky.DEFAULT} strokeWidth={1.5} />
        ) : status === 'completed' && duration > 0 ? (
          <Text style={styles.duration}>{formatCallDuration(duration)}</Text>
        ) : null}
        <Text style={styles.time}>{displayTime}</Text>
      </View>
    </FlatRow>
  );
}

const styles = StyleSheet.create({
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: space[3],
    marginTop: 3,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    marginRight: space[2],
  },
  name: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 19,
  },
  nameMissed: {
    color: colors.coral.DEFAULT,
  },
  subtitle: {
    ...typography.bodySm,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  summaryText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  missedLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.coral.DEFAULT,
  },
  time: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
  },
});

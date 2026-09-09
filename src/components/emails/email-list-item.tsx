import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlatRow } from '@/src/components/ui/flat-row';
import { colors, space } from '@/src/lib/design-tokens';
import { formatRelative } from '@/src/utils/date';

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  action_required: { bg: '#FEF0EC', text: '#F95738', label: 'ACTION' },
  fyi: { bg: '#EDF2F9', text: '#4A6FA5', label: 'FYI' },
  meeting: { bg: '#F5E8EF', text: '#69306D', label: 'MEETING' },
  follow_up: { bg: '#FDF3E8', text: '#EE964B', label: 'FOLLOW UP' },
  spam: { bg: '#E8E6EE', text: '#6B6889', label: 'SPAM' },
};

interface EmailListItemProps {
  id: string;
  fromName: string | null;
  fromAddress: string;
  subject: string;
  summary: string | null;
  classification: string | null;
  isRead: boolean;
  receivedAt: string;
  onPress?: () => void;
}

export function EmailListItem({
  id,
  fromName,
  fromAddress,
  subject,
  summary,
  classification,
  isRead,
  receivedAt,
  onPress,
}: EmailListItemProps) {
  const displayName = fromName || fromAddress;
  const dotColor = isRead ? colors.text.muted : colors.sky.DEFAULT;
  const badgeConfig = classification ? CLASSIFICATION_CONFIG[classification] : null;

  return (
    <FlatRow
      onPress={onPress}
      showDivider={true}
      dividerIndent={28}
      testID={`flat-row-email-${id}`}
    >
      {/* Left: Unread/read dot */}
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />

      {/* Middle: From + subject + summary */}
      <View style={styles.content}>
        <Text
          style={[styles.fromName, isRead && styles.fromNameRead]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text style={styles.subject} numberOfLines={1}>
          {subject}
        </Text>
        {summary ? (
          <Text style={styles.summary} numberOfLines={1}>
            {summary}
          </Text>
        ) : null}
      </View>

      {/* Right: Classification badge + time */}
      <View style={styles.right}>
        {badgeConfig ? (
          <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
            <Text style={[styles.badgeText, { color: badgeConfig.text }]}>
              {badgeConfig.label}
            </Text>
          </View>
        ) : null}
        <Text style={styles.time}>{formatRelative(receivedAt)}</Text>
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
  fromName: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 19,
  },
  fromNameRead: {
    fontFamily: 'DMSans_400Regular',
    fontWeight: '400',
  },
  subject: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.body,
    lineHeight: 18,
    marginTop: 1,
  },
  summary: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: '#6B6889',
    lineHeight: 18,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
  },
});

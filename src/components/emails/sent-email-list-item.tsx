import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { FlatRow } from '@/src/components/ui/flat-row';
import { Avatar } from '@/src/components/ui/avatar';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';
import { formatRelative } from '@/src/utils/date';

interface SentEmailListItemProps {
  id: string;
  toName: string | null;
  toAddress: string;
  subject: string;
  bodyPreview: string | null;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  tone: 'professional' | 'friendly' | 'urgent' | null;
  aiDrafted: boolean;
  createdAt: string;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  sent: { label: 'SENT', bg: colors.sage.light, text: colors.sage.DEFAULT },
  draft: { label: 'DRAFT', bg: colors.velvet.dim, text: colors.velvet.DEFAULT },
  sending: { label: 'SENDING', bg: colors.sky.light, text: colors.sky.DEFAULT },
  failed: { label: 'FAILED', bg: colors.coral.light, text: colors.coral.DEFAULT },
};

const TONE_CONFIG: Record<string, { label: string; borderColor: string; textColor: string }> = {
  professional: { label: 'Professional', borderColor: colors.sky.DEFAULT, textColor: colors.sky.DEFAULT },
  friendly: { label: 'Friendly', borderColor: colors.sage.DEFAULT, textColor: colors.sage.DEFAULT },
  urgent: { label: 'Urgent', borderColor: colors.coral.DEFAULT, textColor: colors.coral.DEFAULT },
};

export function SentEmailListItem({
  id,
  toName,
  toAddress,
  subject,
  bodyPreview,
  status,
  tone,
  aiDrafted,
  createdAt,
  onPress,
}: SentEmailListItemProps) {
  const displayName = toName || toAddress;
  const statusCfg = STATUS_CONFIG[status];
  const toneCfg = tone ? TONE_CONFIG[tone] : null;

  return (
    <FlatRow
      onPress={onPress}
      showDivider={true}
      dividerIndent={68}
      testID={`flat-row-sent-email-${id}`}
    >
      {/* Left: Recipient avatar */}
      <View style={styles.avatarWrap}>
        <Avatar name={displayName} size="sm" />
      </View>

      {/* Middle: Name, subject, preview, pills */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.recipientName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>{formatRelative(createdAt)}</Text>
        </View>

        <Text style={styles.subject} numberOfLines={1}>
          {subject}
        </Text>

        {bodyPreview ? (
          <Text style={styles.preview} numberOfLines={1}>
            {bodyPreview}
          </Text>
        ) : null}

        {/* Status + tone + AI pills */}
        <View style={styles.pillsRow}>
          {statusCfg && (
            <View style={[styles.pill, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.pillText, { color: statusCfg.text }]}>
                {statusCfg.label}
              </Text>
            </View>
          )}
          {toneCfg && (
            <View style={[styles.pill, styles.tonePill, { borderColor: toneCfg.borderColor }]}>
              <Text style={[styles.pillText, { color: toneCfg.textColor }]}>
                {toneCfg.label}
              </Text>
            </View>
          )}
          {aiDrafted && (
            <View style={[styles.pill, { backgroundColor: colors.plum.light }]}>
              <Sparkles size={9} color={colors.plum.DEFAULT} strokeWidth={2} />
              <Text style={[styles.pillText, { color: colors.plum.DEFAULT, marginLeft: 3 }]}>
                AI
              </Text>
            </View>
          )}
        </View>
      </View>
    </FlatRow>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    marginRight: space[3],
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientName: {
    fontSize: 13.5,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: space[2],
  },
  time: {
    fontSize: 10.5,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    flexShrink: 0,
  },
  subject: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.body,
    marginTop: 2,
  },
  preview: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  tonePill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

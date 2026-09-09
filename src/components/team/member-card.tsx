import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { colors, typography, space } from '@/src/lib/design-tokens';

interface MemberCardProps {
  name: string;
  title: string;
  avatarUrl?: string | null;
  activeTaskCount: number;
  onPress?: () => void;
  compact?: boolean;
  selected?: boolean;
  onlineStatus?: 'online' | 'busy' | 'offline';
  role?: string;
  taskCount?: number;
}

const ONLINE_STATUS_COLORS: Record<string, string> = {
  online: colors.sage.DEFAULT,
  busy: colors.velvet.light,
  offline: colors.text.muted,
};

export function MemberCard({
  name,
  title,
  avatarUrl,
  activeTaskCount,
  onPress,
  compact = false,
  selected = false,
  onlineStatus = 'offline',
  role,
  taskCount,
}: MemberCardProps) {
  const dotColor = ONLINE_STATUS_COLORS[onlineStatus] ?? colors.text.muted;
  const firstName = name.split(' ')[0];

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.compactContainer,
          selected && styles.compactSelected,
        ]}
      >
        {/* Avatar with online dot */}
        <View style={styles.avatarWrap}>
          <Avatar name={name} imageUrl={avatarUrl} size="md" />
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: dotColor },
            ]}
          />
        </View>

        {/* Name */}
        <Text numberOfLines={1} style={styles.compactName}>
          {firstName}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fullRow,
        pressed && styles.fullRowPressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar name={name} imageUrl={avatarUrl} size="md" />
        <View
          style={[
            styles.onlineDotSmall,
            { backgroundColor: dotColor },
          ]}
        />
      </View>

      <View style={styles.fullContent}>
        <Text style={styles.fullName}>{name}</Text>
        <Text style={styles.fullTitle}>{title}</Text>
      </View>

      {activeTaskCount > 0 && (
        <Text style={styles.taskCountText}>{activeTaskCount} tasks</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    width: 56,
    alignItems: 'center',
    paddingVertical: space[2],
  },
  compactSelected: {
    backgroundColor: colors.bg.hover,
    borderRadius: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bg.deep,
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bg.deep,
  },
  compactName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  fullRowPressed: {
    backgroundColor: colors.bg.hover,
  },
  fullContent: {
    flex: 1,
    marginLeft: space[3],
  },
  fullName: {
    ...typography.bodyLg,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
  },
  fullTitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  taskCountText: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
});

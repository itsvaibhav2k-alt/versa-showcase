import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { getGreeting, formatFullDate } from '@/src/utils/date';
import { colors, typography, space } from '@/src/lib/design-tokens';

interface DashboardHeaderProps {
  firstName: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  onPressBell?: () => void;
  onPressSearch?: () => void;
}

export function DashboardHeader({
  firstName,
  avatarUrl,
  unreadCount = 0,
  onPressBell,
  onPressSearch,
}: DashboardHeaderProps) {
  const greeting = getGreeting().toLowerCase() + ',';
  const dateStr = formatFullDate();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{firstName}.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onPressSearch}
            style={styles.bellContainer}
            accessibilityRole="button"
            accessibilityLabel="Search"
            testID="dashboard-search-button"
          >
            <Search size={20} color={colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={onPressBell}
            style={styles.bellContainer}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            <Bell size={20} color={colors.text.secondary} strokeWidth={1.5} />
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </Pressable>
          <Avatar name={firstName} imageUrl={avatarUrl} size="lg" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space[5],
    paddingTop: space[6],
    paddingBottom: space[2],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingBlock: {
    flex: 1,
    paddingRight: space[4],
  },
  date: {
    fontSize: typography.bodyMd.fontSize,
    fontFamily: typography.bodyMd.fontFamily,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
    lineHeight: 36,
    color: colors.text.primary,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
    lineHeight: 36,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingTop: space[2],
  },
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.coral.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.bg.deep,
  },
});

import React, { useCallback, useState } from 'react';
import { View, Text, SectionList, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Phone, CheckCircle, Bell, Mail, Newspaper, Users, Settings, type LucideIcon } from 'lucide-react-native';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '@/src/hooks/use-notifications';
import { formatRelative, isToday } from '@/src/utils/date';
import { hapticLight, hapticSelection } from '@/src/lib/haptics';
import { SkeletonCard } from '@/src/components/ui/skeleton';
import { ErrorState } from '@/src/components/ui/error-state';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';
import type { Notification } from '@/src/types/models';

const categoryConfig: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  call: { icon: Phone, color: colors.velvet.DEFAULT },
  task: { icon: CheckCircle, color: colors.sage.DEFAULT },
  reminder: { icon: Bell, color: colors.velvet.light },
  email: { icon: Mail, color: colors.sky.DEFAULT },
  digest: { icon: Newspaper, color: colors.plum.DEFAULT },
  team: { icon: Users, color: colors.velvet.DEFAULT },
  system: { icon: Settings, color: colors.text.secondary },
};

function NotificationRow({
  item,
  onPress,
  showDivider,
}: {
  item: Notification;
  onPress: () => void;
  showDivider: boolean;
}) {
  const config =
    categoryConfig[item.category ?? 'system'] ?? categoryConfig.system;
  const timeAgo = formatRelative(item.created_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowContainer,
        pressed && { backgroundColor: colors.bg.hover },
      ]}
    >
      {/* Icon — bare, no bg container */}
      <View style={styles.iconArea}>
        {React.createElement(config.icon, { size: 18, color: config.color, strokeWidth: 1.5 })}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <View style={styles.titleRow}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <Text
              style={[
                styles.rowTitle,
                {
                  fontWeight: item.is_read ? '400' : '600',
                  fontFamily: item.is_read
                    ? 'DMSans_400Regular'
                    : 'DMSans_600SemiBold',
                  color: item.is_read ? colors.text.secondary : colors.text.primary,
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <Text style={styles.rowTime}>{timeAgo}</Text>
        </View>

        <Text style={styles.rowBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      {showDivider && <View style={styles.separator} />}
    </Pressable>
  );
}

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'task', label: 'Tasks' },
  { key: 'call', label: 'Calls' },
  { key: 'email', label: 'Emails' },
  { key: 'reminder', label: 'Reminders' },
  { key: 'system', label: 'System' },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const notificationsQuery = useNotifications();
  const { data: notifications, isLoading: notificationsLoading, isError, refetch } = notificationsQuery;
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const onRefresh = async () => {
    setRefreshing(true);
    await notificationsQuery.refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      hapticLight();
      if (!notification.is_read) {
        markRead.mutate(notification.id);
      }
      switch (notification.reference_type) {
        case 'task':
          router.back();
          setTimeout(() => router.push('/(tabs)/team'), 100);
          break;
        case 'call_log':
          router.back();
          setTimeout(() => router.push(`/(tabs)/comms/${notification.reference_id}` as never), 100);
          break;
        case 'follow_up':
          router.back();
          setTimeout(() => router.push('/(tabs)/comms'), 100);
          break;
        case 'calendar_event':
          router.back();
          setTimeout(() => router.push('/(tabs)' as '/(tabs)'), 100);
          break;
        default:
          break;
      }
    },
    [markRead, router],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  const unreadCount =
    notifications?.filter((n) => !n.is_read).length ?? 0;

  const filteredNotifications = React.useMemo(() => {
    if (!notifications) return [];
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'system') {
      return notifications.filter(
        (n) => n.category === 'system' || n.category === 'team' || n.category === 'digest',
      );
    }
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const sections = React.useMemo(() => {
    if (!filteredNotifications.length) return [];
    const todayItems = filteredNotifications.filter((n) => isToday(n.created_at));
    const earlierItems = filteredNotifications.filter((n) => !isToday(n.created_at));
    const result: { title: string; data: Notification[] }[] = [];
    if (todayItems.length > 0) {
      result.push({ title: 'Today', data: todayItems });
    }
    if (earlierItems.length > 0) {
      result.push({ title: 'Earlier', data: earlierItems });
    }
    return result;
  }, [filteredNotifications]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message="Could not load notifications." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ChevronLeft size={20} color={colors.text.body} strokeWidth={1.5} />
        </Pressable>

        <Text style={styles.headerTitle}>Notifications</Text>

        {unreadCount > 0 ? (
          <Pressable
            onPress={handleMarkAllRead}
            hitSlop={8}
          >
            <Text style={styles.markAllText}>Read all</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Unread count — plain text, not pill */}
      {unreadCount > 0 && (
        <View style={styles.unreadLine}>
          <Text style={styles.unreadText}>
            {unreadCount} unread
          </Text>
        </View>
      )}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChipsScroll}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => {
                hapticSelection();
                setActiveFilter(chip.key);
              }}
              style={[
                styles.filterChip,
                isActive ? styles.filterChipActive : styles.filterChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index, section }) => (
          <NotificationRow
            item={item}
            onPress={() => handleNotificationPress(item)}
            showDivider={index < section.data.length - 1}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          notificationsLoading && !notifications ? (
            <View style={{ paddingHorizontal: space[5], gap: 10, paddingTop: space[2] }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !notificationsLoading ? (
            <View style={styles.emptyState}>
              <CheckCircle size={32} color={colors.text.muted} strokeWidth={1.5} />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.velvet.DEFAULT}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  headerTitle: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  markAllText: {
    ...typography.bodySm,
    color: colors.velvet.DEFAULT,
  },
  unreadLine: {
    paddingHorizontal: space[5],
    marginBottom: space[2],
  },
  unreadText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  filterChipsScroll: {
    flexGrow: 0,
    marginBottom: space[2],
  },
  filterChipsContainer: {
    paddingHorizontal: space[5],
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#69306D',
  },
  filterChipInactive: {
    backgroundColor: '#E8E6EE',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
  },
  filterChipTextInactive: {
    color: '#6B6889',
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    backgroundColor: colors.bg.deep,
    marginTop: space[4],
  },
  sectionHeaderText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  iconArea: {
    width: 24,
    marginTop: 2,
  },
  rowContent: {
    marginLeft: space[3],
    flex: 1,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.velvet.DEFAULT,
  },
  rowTitle: {
    ...typography.bodyMd,
    flex: 1,
  },
  rowTime: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.muted,
    marginLeft: space[2],
  },
  rowBody: {
    marginTop: 2,
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 56,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.divider,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: space[3],
    ...typography.bodyMd,
    color: colors.text.muted,
  },
});

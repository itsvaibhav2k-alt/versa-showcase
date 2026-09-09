import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Phone, CheckCircle, Bell, Mail, Newspaper, Users, Settings, type LucideIcon } from 'lucide-react-native';
import { formatRelative } from '@/src/utils/date';
import { colors } from '@/src/lib/design-tokens';
import { Card } from '@/src/components/ui/card';
import { AnimatedPress } from '@/src/components/ui/animated-press';
import type { Notification, NotificationCategory } from '@/src/types/models';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  isRead: boolean;
  timeAgo: string;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Missed call',
    body: 'Priya Sharma tried to reach you at 9:42 AM',
    category: 'call',
    isRead: false,
    timeAgo: '2h ago',
  },
  {
    id: '2',
    title: 'Task completed',
    body: 'Rahul marked "Update pitch deck" as done',
    category: 'task',
    isRead: false,
    timeAgo: '3h ago',
  },
  {
    id: '3',
    title: 'Meeting reminder',
    body: 'Client Review with Acme Corp in 30 minutes',
    category: 'reminder',
    isRead: true,
    timeAgo: '4h ago',
  },
  {
    id: '4',
    title: 'New email',
    body: 'Invoice from CloudHost Services — action required',
    category: 'email',
    isRead: true,
    timeAgo: '5h ago',
  },
];

const categoryConfig: Record<NotificationCategory, { icon: LucideIcon; color: string; bg: string }> = {
  call: { icon: Phone, color: colors.velvet.DEFAULT, bg: 'bg-velvet-wash' },
  task: { icon: CheckCircle, color: colors.sage.DEFAULT, bg: 'bg-sage-light' },
  reminder: { icon: Bell, color: colors.velvet.light, bg: 'bg-velvet-dim' },
  email: { icon: Mail, color: colors.sky.DEFAULT, bg: 'bg-sky-light' },
  digest: { icon: Newspaper, color: colors.plum.DEFAULT, bg: 'bg-plum-light' },
  team: { icon: Users, color: colors.velvet.DEFAULT, bg: 'bg-velvet-wash' },
  system: { icon: Settings, color: colors.text.secondary, bg: 'bg-versa-muted' },
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const config = categoryConfig[item.category];
  const IconComponent = config.icon;

  return (
    <AnimatedPress scaleDown={0.98} className="flex-row items-start px-4 py-2.5 active:bg-versa-hover">
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${config.bg}`}>
        <IconComponent size={15} color={config.color} strokeWidth={1.5} />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            {!item.isRead && (
              <View className="h-1.5 w-1.5 rounded-full bg-velvet" />
            )}
            <Text
              className={`text-sm ${item.isRead ? 'font-body-medium text-ink-secondary' : 'font-body-semibold text-ink'}`}
            >
              {item.title}
            </Text>
          </View>
          <Text className="text-xs font-body text-ink-muted">
            {item.timeAgo}
          </Text>
        </View>
        <Text
          className="mt-0.5 text-sm font-body text-ink-secondary"
          numberOfLines={1}
        >
          {item.body}
        </Text>
      </View>
    </AnimatedPress>
  );
}

interface NotificationFeedProps {
  notifications?: Notification[];
  limit?: number;
}

export function NotificationFeed({ notifications, limit = 3 }: NotificationFeedProps) {
  const allNotifications: NotificationItem[] = notifications
    ? notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        category: n.category ?? 'system',
        isRead: n.is_read,
        timeAgo: formatRelative(n.created_at),
      }))
    : MOCK_NOTIFICATIONS;

  const displayNotifications = allNotifications.slice(0, limit);
  const hasMore = allNotifications.length > limit;

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-body-bold uppercase tracking-widest text-ink-muted">
          Recent Activity
        </Text>
        <Text className="text-sm font-body-medium text-velvet">
          {allNotifications.length} updates
        </Text>
      </View>

      <Card className="mt-3 p-0 overflow-hidden">
        <FlatList
          data={displayNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationRow item={item} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View className="mx-4 border-b border-warm-divider" />
          )}
        />
      </Card>
      {hasMore && (
        <Pressable className="mt-2.5 self-center active:opacity-70">
          <Text className="text-sm font-body-medium text-velvet">
            See all activity
          </Text>
        </Pressable>
      )}
    </View>
  );
}

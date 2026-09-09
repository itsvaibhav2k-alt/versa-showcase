import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTeamMembers } from '@/src/hooks/use-team-members';
import { useTasks } from '@/src/hooks/use-tasks';
import { useRealtimeSubscription } from '@/src/hooks/use-realtime';
import { QUERY_KEYS } from '@/src/lib/constants';
import { MemberCard } from '@/src/components/team/member-card';
import { TaskBoard } from '@/src/components/team/task-board';
import type { Task } from '@/src/types/models';
import { Skeleton } from '@/src/components/ui/skeleton';
import { hapticLight } from '@/src/lib/haptics';
import { ErrorState } from '@/src/components/ui/error-state';
import { colors, typography, space } from '@/src/lib/design-tokens';

export default function TeamHubScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const taskBoardRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [refreshing, setRefreshing] = useState(false);
  const membersQuery = useTeamMembers();
  const { data: members, isLoading: membersLoading, isError, refetch } = membersQuery;
  const tasksQuery = useTasks();
  const { data: allTasks } = tasksQuery;

  useRealtimeSubscription('tasks', [QUERY_KEYS.tasks]);
  useRealtimeSubscription('team_members', [QUERY_KEYS.teamMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([membersQuery.refetch(), tasksQuery.refetch()]);
    setRefreshing(false);
  };

  const displayMembers = members
    ? members.map((m) => ({
        id: m.id,
        userId: m.user_id,
        name: m.user?.full_name ?? 'Unknown',
        title: m.title ?? 'Team Member',
        avatarUrl: m.user?.avatar_url,
        activeTaskCount: allTasks
          ? allTasks.filter(
              (t: Task) =>
                t.assigned_to === m.user_id &&
                (t.status === 'todo' || t.status === 'in_progress'),
            ).length
          : 0,
        onlineStatus: 'online' as const,
      }))
    : [];

  const selectedMemberName = selectedMemberId
    ? displayMembers.find((m) => m.userId === selectedMemberId)?.name ?? null
    : null;

  const filteredTasks = selectedMemberId
    ? allTasks?.filter((t: Task) => t.assigned_to === selectedMemberId)
    : allTasks;

  const filteredMembers = searchQuery
    ? displayMembers.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : displayMembers;

  const toggleSearch = () => {
    if (searchVisible) {
      setSearchQuery('');
      setSearchVisible(false);
    } else {
      setSearchVisible(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-versa-bg">
        <ErrorState message="Could not load team. Pull to refresh." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-versa-bg">
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.velvet.DEFAULT}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Team</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={toggleSearch} hitSlop={8} style={styles.searchButton}>
                {searchVisible ? (
                  <X size={20} color={colors.text.secondary} strokeWidth={1.5} />
                ) : (
                  <Search size={20} color={colors.text.secondary} strokeWidth={1.5} />
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push('/(modals)/delegate' as never)}
                hitSlop={8}
              >
                <Text style={styles.delegateLink}>+ Delegate</Text>
              </Pressable>
            </View>
          </View>

          {/* Expandable search input */}
          {searchVisible && (
            <View style={styles.searchContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search team..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          {/* Members section */}
          <View style={styles.membersSection}>
            <View style={styles.membersSectionHeader}>
              <Text style={styles.sectionLabel}>
                MEMBERS ({filteredMembers.length})
              </Text>
            </View>
            {membersLoading && !members && (
              <View style={styles.memberSkeletons}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={{ width: 64, alignItems: 'center', gap: 6 }}>
                    <Skeleton height={40} rounded className="w-10" />
                    <Skeleton height={12} className="w-12" />
                  </View>
                ))}
              </View>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.membersScroll}
              contentContainerStyle={styles.membersScrollContent}
            >
              {filteredMembers.map((item) => (
                <MemberCard
                  key={item.id}
                  name={item.name}
                  title={item.title}
                  avatarUrl={item.avatarUrl}
                  activeTaskCount={item.activeTaskCount}
                  onlineStatus={item.onlineStatus}
                  selected={selectedMemberId === item.userId}
                  compact
                  onPress={() => {
                    hapticLight();
                    router.push({
                      pathname: '/(modals)/member-detail',
                      params: { userId: item.userId },
                    } as never);
                  }}
                />
              ))}
            </ScrollView>
            {!membersLoading && filteredMembers.length === 0 && (
              <View style={styles.emptyMembers}>
                <Text style={styles.emptyText}>No team members yet</Text>
              </View>
            )}
          </View>

          {/* Selected member filter chip */}
          {selectedMemberName && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Showing {selectedMemberName}&apos;s tasks
              </Text>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setSelectedMemberId(null);
                }}
                hitSlop={8}
                style={{ marginLeft: space[2] }}
              >
                <X size={14} color={colors.text.secondary} strokeWidth={2} />
              </Pressable>
            </View>
          )}

          {/* Task board */}
          <View ref={taskBoardRef} style={styles.taskBoardContainer}>
            <TaskBoard tasks={filteredTasks ?? undefined} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space[5],
    paddingTop: space[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delegateLink: {
    ...typography.bodySm,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.velvet.DEFAULT,
  },
  searchContainer: {
    paddingHorizontal: space[5],
    marginTop: space[3],
  },
  searchInput: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: space[4],
    fontSize: typography.bodyMd.fontSize,
    fontFamily: typography.bodyMd.fontFamily,
    color: colors.text.body,
  },
  membersSection: {
    marginTop: space[5],
  },
  membersSectionHeader: {
    paddingHorizontal: space[5],
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  memberSkeletons: {
    flexDirection: 'row',
    paddingHorizontal: space[5],
    gap: space[3],
    marginTop: space[3],
  },
  membersScroll: {
    marginTop: space[3],
  },
  membersScrollContent: {
    paddingHorizontal: space[5],
    gap: space[2],
  },
  emptyMembers: {
    paddingHorizontal: space[5],
    paddingVertical: space[6],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.text.muted,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.muted,
    borderRadius: 8,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    marginHorizontal: space[5],
    marginTop: space[4],
    alignSelf: 'flex-start',
  },
  filterChipText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  taskBoardContainer: {
    paddingHorizontal: space[5],
    marginTop: space[4],
  },
});

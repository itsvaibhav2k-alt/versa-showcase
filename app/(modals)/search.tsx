import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useSearch } from '@/src/hooks/use-search';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import { PRIORITY_COLORS, TASK_STATUS_LABELS, CALL_STATUS_COLORS } from '@/src/lib/constants';

export default function SearchModal() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { data, isLoading, isFetching } = useSearch(query);

  const hasQuery = query.length >= 2;
  const hasResults =
    data &&
    (data.tasks.length > 0 ||
      data.callLogs.length > 0 ||
      data.emails.length > 0 ||
      data.teamMembers.length > 0);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="search-back-button"
        >
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Close search"
          testID="search-close-button"
        >
          <X size={20} color={colors.text.secondary} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Search size={18} color={colors.text.muted} strokeWidth={1.5} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks, calls, emails..."
            placeholderTextColor={colors.text.muted}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            testID="search-input"
          />
          {query.length > 0 && (
            <Pressable
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID="search-clear-button"
            >
              <X size={16} color={colors.text.muted} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="search-results-scroll"
      >
        {/* Initial State */}
        {!hasQuery && !isLoading && (
          <View style={styles.emptyState} testID="search-initial-state">
            <Search size={48} color={colors.text.muted} strokeWidth={1} />
            <Text style={styles.emptyStateText}>Search across your workspace</Text>
          </View>
        )}

        {/* Loading State */}
        {hasQuery && (isLoading || isFetching) && !data && (
          <View style={styles.skeletonContainer} testID="search-loading-state">
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
              </View>
            ))}
          </View>
        )}

        {/* No Results */}
        {hasQuery && data && !hasResults && (
          <View style={styles.emptyState} testID="search-no-results">
            <Text style={styles.emptyStateText}>No results for &apos;{query}&apos;</Text>
          </View>
        )}

        {/* Results Sections */}
        {data && hasResults && (
          <>
            {/* Tasks */}
            {data.tasks.length > 0 && (
              <View style={styles.section} testID="search-tasks-section">
                <Text style={styles.sectionHeader}>TASKS</Text>
                {data.tasks.map((task) => (
                  <Pressable
                    key={task.id}
                    style={styles.resultItem}
                    onPress={() =>
                      router.push({ pathname: '/task/[id]', params: { id: task.id } })
                    }
                    testID={`search-task-${task.id}`}
                  >
                    <View style={styles.resultItemContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <View style={styles.resultMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                task.status === 'done'
                                  ? colors.sage.light
                                  : task.status === 'in_progress'
                                    ? colors.sky.light
                                    : colors.bg.muted,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  task.status === 'done'
                                    ? colors.sage.DEFAULT
                                    : task.status === 'in_progress'
                                      ? colors.sky.DEFAULT
                                      : colors.text.secondary,
                              },
                            ]}
                          >
                            {TASK_STATUS_LABELS[task.status] ?? task.status}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.priorityDot,
                            {
                              backgroundColor:
                                PRIORITY_COLORS[task.priority] ?? colors.text.muted,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Calls */}
            {data.callLogs.length > 0 && (
              <View style={styles.section} testID="search-calls-section">
                <Text style={styles.sectionHeader}>CALLS</Text>
                {data.callLogs.map((call) => (
                  <Pressable
                    key={call.id}
                    style={styles.resultItem}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/comms/[id]',
                        params: { id: call.id },
                      })
                    }
                    testID={`search-call-${call.id}`}
                  >
                    <View style={styles.resultItemContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {call.caller_name ?? call.caller_phone}
                      </Text>
                      <View style={styles.resultMeta}>
                        <Text style={styles.resultSubtext} numberOfLines={1}>
                          {call.caller_phone}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                call.status === 'completed'
                                  ? colors.sage.light
                                  : call.status === 'missed'
                                    ? colors.coral.light
                                    : colors.bg.muted,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  CALL_STATUS_COLORS[call.status] ?? colors.text.secondary,
                              },
                            ]}
                          >
                            {call.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Emails */}
            {data.emails.length > 0 && (
              <View style={styles.section} testID="search-emails-section">
                <Text style={styles.sectionHeader}>EMAILS</Text>
                {data.emails.map((email) => (
                  <Pressable
                    key={email.id}
                    style={styles.resultItem}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/comms/email/[id]',
                        params: { id: email.id },
                      })
                    }
                    testID={`search-email-${email.id}`}
                  >
                    <View style={styles.resultItemContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {email.subject}
                      </Text>
                      <Text style={styles.resultSubtext} numberOfLines={1}>
                        {email.from_address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Team Members */}
            {data.teamMembers.length > 0 && (
              <View style={styles.section} testID="search-team-section">
                <Text style={styles.sectionHeader}>TEAM</Text>
                {data.teamMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={styles.resultItem}
                    onPress={() =>
                      router.push({
                        pathname: '/(modals)/member-detail',
                        params: { id: member.id },
                      })
                    }
                    testID={`search-member-${member.id}`}
                  >
                    <View style={styles.resultItemContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {member.user?.full_name ?? 'Unknown'}
                      </Text>
                      {member.title && (
                        <Text style={styles.resultSubtext} numberOfLines={1}>
                          {member.title}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.headingMd.fontSize,
    fontWeight: typography.headingMd.fontWeight,
    fontFamily: typography.headingMd.fontFamily,
    lineHeight: typography.headingMd.lineHeight,
    color: colors.text.primary,
  },
  inputContainer: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 28,
    paddingHorizontal: space[4],
  },
  inputIcon: {
    marginRight: space[2],
  },
  input: {
    flex: 1,
    fontSize: typography.bodyMd.fontSize,
    fontFamily: typography.bodyMd.fontFamily,
    lineHeight: typography.bodyMd.lineHeight,
    color: colors.text.body,
    paddingVertical: 12,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.muted,
    marginLeft: space[2],
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: space[4],
    paddingBottom: space[12],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: space[4],
  },
  emptyStateText: {
    fontSize: typography.bodyLg.fontSize,
    fontFamily: typography.bodyLg.fontFamily,
    lineHeight: typography.bodyLg.lineHeight,
    color: colors.text.muted,
  },
  skeletonContainer: {
    paddingTop: space[6],
    gap: space[4],
  },
  skeletonRow: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
    ...shadows.card,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.bg.muted,
    borderRadius: radius.sm,
    width: '80%',
  },
  skeletonLineShort: {
    width: '50%',
  },
  section: {
    marginTop: space[6],
  },
  sectionHeader: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    fontFamily: typography.caption.fontFamily,
    lineHeight: typography.caption.lineHeight,
    letterSpacing: typography.caption.letterSpacing,
    textTransform: typography.caption.textTransform,
    color: colors.text.muted,
    marginBottom: space[3],
  },
  resultItem: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[2],
    ...shadows.card,
  },
  resultItemContent: {
    gap: space[1],
  },
  resultTitle: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    lineHeight: typography.bodyMd.lineHeight,
    color: colors.text.primary,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: 2,
  },
  resultSubtext: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.bodySm.fontFamily,
    lineHeight: typography.bodySm.lineHeight,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

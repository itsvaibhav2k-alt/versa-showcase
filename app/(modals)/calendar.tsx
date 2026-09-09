import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react-native';
import { useEventsForDate } from '@/src/hooks/use-events';
import { formatTime, isToday } from '@/src/utils/date';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';
import type { CalendarEvent, EventAttendee } from '@/src/types/models';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNext7Days(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#69306D', '#2CA58D', '#F95738', '#4A6FA5', '#F46197', '#EE964B', '#A5668B',
];

function getAvatarColor(email: string): string {
  const hash = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// --- Sub-components ---

function DayButton({
  date,
  isSelected,
  isTodayDate,
  onPress,
}: {
  date: Date;
  isSelected: boolean;
  isTodayDate: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dayButton,
        isSelected && styles.dayButtonSelected,
      ]}
      testID={`calendar-day-${date.getDate()}`}
    >
      <Text
        style={[
          styles.dayName,
          isSelected && styles.dayTextSelected,
        ]}
      >
        {DAY_NAMES[date.getDay()]}
      </Text>
      <Text
        style={[
          styles.dayNumber,
          isSelected && styles.dayTextSelected,
        ]}
      >
        {date.getDate()}
      </Text>
      {isTodayDate && !isSelected && <View style={styles.todayDot} />}
    </Pressable>
  );
}

function AttendeeAvatar({
  attendee,
  index,
}: {
  attendee: EventAttendee;
  index: number;
}) {
  const bgColor = getAvatarColor(attendee.email);
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: bgColor, marginLeft: index > 0 ? -8 : 0, zIndex: 10 - index },
      ]}
    >
      <Text style={styles.avatarText}>
        {getInitials(attendee.name ?? attendee.email.split('@')[0])}
      </Text>
    </View>
  );
}

function EventCard({
  event,
  index,
}: {
  event: CalendarEvent;
  index: number;
}) {
  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const visibleAttendees = event.attendees?.slice(0, 3) ?? [];
  const remainingCount = Math.max(0, (event.attendees?.length ?? 0) - 3);

  return (
    <StaggeredFadeIn index={index}>
      <View style={styles.eventRow}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{startTime}</Text>
        </View>

        {/* Event card */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.eventDuration}>
            {startTime} – {endTime}
          </Text>

          {event.location ? (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={styles.locationText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          ) : null}

          {visibleAttendees.length > 0 ? (
            <View style={styles.attendeesRow}>
              <View style={styles.avatarStack}>
                {visibleAttendees.map((att, i) => (
                  <AttendeeAvatar
                    key={att.email}
                    attendee={att}
                    index={i}
                  />
                ))}
              </View>
              {remainingCount > 0 ? (
                <Text style={styles.moreAttendeesText}>
                  +{remainingCount} more
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </StaggeredFadeIn>
  );
}

// --- Main Screen ---

export default function CalendarScreen() {
  const router = useRouter();
  const days = useMemo(() => getNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => days[0]);

  const { data: events, isLoading } = useEventsForDate(selectedDate);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          testID="calendar-back"
          hitSlop={12}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelectorContent}
        style={styles.daySelector}
      >
        {days.map((day) => (
          <DayButton
            key={day.toISOString()}
            date={day}
            isSelected={isSameDay(day, selectedDate)}
            isTodayDate={isToday(day)}
            onPress={() => setSelectedDate(day)}
          />
        ))}
      </ScrollView>

      {/* Events list */}
      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.velvet.DEFAULT} />
          </View>
        ) : events && events.length > 0 ? (
          events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No events scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Enjoy the free time or schedule something new.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.displayMd,
    color: colors.text.primary,
    flex: 1,
    marginLeft: space[2],
  },
  headerSpacer: {
    width: 40,
  },

  // --- Day Selector ---
  daySelector: {
    flexGrow: 0,
    marginTop: space[2],
  },
  daySelectorContent: {
    paddingHorizontal: space[4],
    gap: space[2],
  },
  dayButton: {
    width: 56,
    paddingVertical: space[3],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  dayButtonSelected: {
    backgroundColor: colors.velvet.DEFAULT,
    borderColor: colors.velvet.DEFAULT,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
  },
  dayTextSelected: {
    color: colors.text.onVelvet,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.velvet.DEFAULT,
    marginTop: 4,
  },

  // --- Events List ---
  eventsList: {
    flex: 1,
    marginTop: space[6],
  },
  eventsContent: {
    paddingHorizontal: space[4],
    paddingBottom: space[12],
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: space[3],
  },
  timeColumn: {
    width: 64,
    paddingTop: space[4],
    alignItems: 'flex-end',
    paddingRight: space[3],
  },
  timeText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'JetBrainsMono_400Regular',
    color: colors.text.secondary,
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.velvet.DEFAULT,
    ...shadows.card,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
  },
  eventDuration: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space[2],
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
    flex: 1,
  },

  // --- Attendees ---
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[3],
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg.card,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: '#FFFFFF',
  },
  moreAttendeesText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
    marginLeft: space[2],
  },

  // --- Loading ---
  loadingContainer: {
    paddingTop: space[12],
    alignItems: 'center',
  },

  // --- Empty State ---
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: space[8],
  },
  emptyTitle: {
    ...typography.headingMd,
    color: colors.text.primary,
    marginTop: space[5],
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    marginTop: space[2],
    textAlign: 'center',
  },
});

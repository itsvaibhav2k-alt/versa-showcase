import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Video, Calendar } from 'lucide-react-native';
import { formatTime } from '@/src/utils/date';
import { FlatRow } from '@/src/components/ui/flat-row';
import { StaggeredFadeIn } from '@/src/components/ui/animated-press';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';
import type { CalendarEvent } from '@/src/types/models';

interface CalendarSnapshotProps {
  events?: CalendarEvent[];
  dateLabel?: string;
  onJoin?: (event: CalendarEvent) => void;
  onSeeAll?: () => void;
}

export function CalendarSnapshot({ events, dateLabel, onJoin, onSeeAll }: CalendarSnapshotProps) {
  const displayEvents = events ?? [];

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {dateLabel ?? "TODAY'S SCHEDULE"}
        </Text>
        <View style={styles.headerRight}>
          {onSeeAll && (
            <Pressable onPress={onSeeAll} testID="calendar-see-all" hitSlop={8}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          )}
          <Text style={styles.eventCount}>
            {displayEvents.length} events
          </Text>
        </View>
      </View>

      {displayEvents.length > 0 && (
        <View style={styles.timeline}>
          {displayEvents.map((event, index) => {
            const isHero = index === 0;
            const time = formatTime(event.start_time);

            return (
              <StaggeredFadeIn key={event.id} index={index}>
                <View style={styles.timelineRow}>
                  {/* Time column */}
                  <View style={styles.timeCol}>
                    <Text
                      style={[
                        styles.timeText,
                        isHero && styles.timeTextHero,
                      ]}
                    >
                      {time}
                    </Text>
                  </View>

                  {/* Vertical line */}
                  <View style={styles.lineCol}>
                    <View
                      style={[
                        styles.line,
                        isHero && styles.lineHero,
                        index === displayEvents.length - 1 && { height: '50%' },
                      ]}
                    />
                    <View
                      style={[
                        styles.lineDot,
                        isHero && styles.lineDotHero,
                      ]}
                    />
                  </View>

                  {/* Event content */}
                  <View style={[styles.eventContent, isHero && styles.eventContentHero]}>
                    <Text
                      style={[
                        styles.eventTitle,
                        isHero && styles.eventTitleHero,
                      ]}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>

                    {event.location && (
                      <View style={styles.locationRow}>
                        <Video size={12} color={colors.text.muted} strokeWidth={1.5} />
                        <Text style={styles.locationText}>{event.location}</Text>
                      </View>
                    )}

                    {/* Hero event: Join button */}
                    {isHero && (
                      <Pressable
                        onPress={() => onJoin?.(event)}
                        style={styles.joinButton}
                      >
                        <Video size={14} color={colors.text.onVelvet} strokeWidth={1.5} />
                        <Text style={styles.joinText}>Join</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </StaggeredFadeIn>
            );
          })}
        </View>
      )}

      {displayEvents.length === 0 && (
        <View style={styles.emptyState}>
          <Calendar size={32} color={colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyText}>
            No meetings scheduled. Time to focus.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: space[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[4],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.velvet.DEFAULT,
  },
  eventCount: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timeCol: {
    width: 56,
    paddingTop: 2,
  },
  timeText: {
    ...typography.monoMd,
    fontSize: 12,
    color: colors.text.secondary,
  },
  timeTextHero: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  lineCol: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border.divider,
  },
  lineHero: {
    backgroundColor: colors.velvet.DEFAULT,
  },
  lineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.DEFAULT,
    marginTop: 6,
    zIndex: 1,
  },
  lineDotHero: {
    backgroundColor: colors.velvet.DEFAULT,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventContent: {
    flex: 1,
    paddingLeft: space[3],
    paddingBottom: space[5],
  },
  eventContentHero: {
    paddingBottom: space[6],
  },
  eventTitle: {
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.body,
  },
  eventTitleHero: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: space[5],
    alignSelf: 'flex-start',
    marginTop: space[3],
    gap: 6,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.onVelvet,
  },
  emptyState: {
    paddingVertical: space[8],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: space[3],
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.muted,
  },
});

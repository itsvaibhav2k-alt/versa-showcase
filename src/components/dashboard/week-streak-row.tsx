import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getWeekDatesForDate, formatDayShort, isToday } from '@/src/utils/date';
import { colors, space } from '@/src/lib/design-tokens';

export interface DayDensity {
  taskCount: number;
  meetingCount: number;
  followUpCount: number;
}

interface WeekStreakRowProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekAnchor: Date;
  onWeekAnchorChange: (date: Date) => void;
  dayDensity?: DayDensity[];
}

export function WeekStreakRow({
  selectedDate,
  onSelectDate,
  weekAnchor,
  onWeekAnchorChange,
  dayDensity,
}: WeekStreakRowProps) {
  const weekDates = getWeekDatesForDate(weekAnchor);

  const goBack = useCallback(() => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    onWeekAnchorChange(d);
  }, [weekAnchor, onWeekAnchorChange]);

  const goForward = useCallback(() => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    onWeekAnchorChange(d);
  }, [weekAnchor, onWeekAnchorChange]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedNorm = new Date(selectedDate);
  selectedNorm.setHours(0, 0, 0, 0);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={goBack} style={styles.chevron} hitSlop={12}>
          <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>

        <View style={styles.daysRow}>
          {weekDates.map((date, index) => {
            const dayLabel = formatDayShort(date).toUpperCase();
            const dateNum = date.getDate();
            const dateNorm = new Date(date);
            dateNorm.setHours(0, 0, 0, 0);

            const isSelected = dateNorm.getTime() === selectedNorm.getTime();
            const isFuture = dateNorm > today;
            const isPast = dateNorm < today;
            const density = dayDensity?.[index];
            const hasDots = density &&
              (density.taskCount > 0 || density.meetingCount > 0 || density.followUpCount > 0);

            return (
              <Pressable
                key={index}
                style={styles.dayCell}
                onPress={() => onSelectDate(dateNorm)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && { color: colors.text.primary, fontWeight: '700' as const },
                    isFuture && !isSelected && { opacity: 0.4 },
                  ]}
                >
                  {dayLabel}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    isSelected && styles.dateCircleSelected,
                    isFuture && !isSelected && styles.dateCircleFuture,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      isSelected && styles.dateTextSelected,
                      isPast && !isSelected && styles.dateTextPast,
                      isFuture && !isSelected && { color: colors.text.muted, opacity: 0.4 },
                    ]}
                  >
                    {dateNum}
                  </Text>
                </View>
                <View style={styles.densityRow}>
                  {hasDots ? (
                    <>
                      {Array.from({ length: Math.min(density.taskCount, 3) }).map((_, i) => (
                        <View key={`t${i}`} style={[styles.densityDot, { backgroundColor: colors.velvet.DEFAULT }]} />
                      ))}
                      {Array.from({ length: Math.min(density.meetingCount, 3) }).map((_, i) => (
                        <View key={`m${i}`} style={[styles.densityDot, { backgroundColor: colors.sky.DEFAULT }]} />
                      ))}
                      {Array.from({ length: Math.min(density.followUpCount, 3) }).map((_, i) => (
                        <View key={`f${i}`} style={[styles.densityDot, { backgroundColor: colors.velvet.light }]} />
                      ))}
                    </>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={goForward} style={styles.chevron} hitSlop={12}>
          <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space[2],
    paddingVertical: space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: colors.text.primary,
  },
  dateCircleFuture: {
    backgroundColor: 'rgba(237, 234, 228, 0.5)',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text.primary,
  },
  dateTextSelected: {
    color: colors.text.onVelvet,
  },
  dateTextPast: {
    color: colors.text.secondary,
  },
  densityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    height: 6,
  },
  densityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

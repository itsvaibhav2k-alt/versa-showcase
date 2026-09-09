import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sun, CheckCircle, Calendar } from 'lucide-react-native';
import { colors } from '@/src/lib/design-tokens';
import type { Digest } from '@/src/types/models';

const MOCK_DIGEST = {
  summary:
    'You have 3 priority tasks due today, 2 meetings this afternoon, and 1 missed call from Priya Sharma. Your team completed 5 tasks yesterday.',
  tasksCount: 3,
  meetingsCount: 2,
  missedCalls: 1,
};

interface MorningBriefingProps {
  digest?: Digest;
}

export function MorningBriefing({ digest }: MorningBriefingProps) {
  const tasksCount = digest?.content?.tasks?.length ?? MOCK_DIGEST.tasksCount;
  const meetingsCount = digest?.content?.events?.length ?? MOCK_DIGEST.meetingsCount;
  const followUpsCount = digest?.content?.follow_ups?.length ?? MOCK_DIGEST.missedCalls;

  return (
    <View className="px-4">
      <View
        className="relative overflow-hidden rounded-2xl border border-warm-border bg-white"
        style={{
          shadowColor: colors.text.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Decorative background icon */}
        <View className="absolute -right-4 -top-4" style={{ opacity: 0.04 }}>
          <Sun size={140} color={colors.velvet.DEFAULT} strokeWidth={1} />
        </View>

        <View className="relative p-5">
          {/* Section label */}
          <View className="flex-row items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-velvet-wash">
              <Sun size={14} color={colors.velvet.DEFAULT} strokeWidth={1.5} />
            </View>
            <Text className="ml-2.5 text-xs font-body-bold uppercase tracking-widest text-ink-muted">
              Daily Intelligence
            </Text>
          </View>

          {/* Highlighted summary */}
          <Text className="mt-4 text-base font-body leading-relaxed text-ink-secondary">
            You have{' '}
            <Text className="font-body-bold text-ink">{tasksCount} priority tasks</Text>
            {' '}due today,{' '}
            <Text className="font-body-bold text-ink">{meetingsCount} meetings</Text>
            {' '}this afternoon, and{' '}
            <Text className="font-body-bold text-coral">{followUpsCount} follow-up{followUpsCount !== 1 ? 's' : ''}</Text>
            {' '}pending.
          </Text>

          {/* 2-Column Stats Grid */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 flex-row items-center rounded-xl bg-velvet-wash/50 p-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-velvet-wash">
                <CheckCircle size={16} color={colors.velvet.DEFAULT} strokeWidth={1.5} />
              </View>
              <View className="ml-2.5">
                <Text className="text-lg font-display text-ink">{tasksCount}</Text>
                <Text className="text-xs font-body text-ink-muted">Tasks</Text>
              </View>
            </View>
            <View className="flex-1 flex-row items-center rounded-xl bg-sky-light/50 p-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-sky-light">
                <Calendar size={16} color={colors.sky.DEFAULT} strokeWidth={1.5} />
              </View>
              <View className="ml-2.5">
                <Text className="text-lg font-display text-ink">{meetingsCount}</Text>
                <Text className="text-xs font-body text-ink-muted">Meetings</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <Pressable className="mt-4 self-start rounded-full bg-velvet px-4 py-2 active:opacity-90">
            <Text className="text-sm font-body-semibold text-white">View full digest</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

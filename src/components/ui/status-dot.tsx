import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/lib/design-tokens';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface StatusDotProps {
  color: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  label?: string;
  testID?: string;
  status?: string;
}

const SIZES = {
  sm: 6,
  md: 8,
} as const;

const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
  urgent: 'Urgent',
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

export function StatusDot({
  color,
  size = 'md',
  pulse = false,
  label,
  testID,
  status,
}: StatusDotProps) {
  const dotSize = SIZES[size];
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = 1;
    }
  }, [pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={status ? (STATUS_LABELS[status] ?? status) : label ?? 'Status indicator'}
    >
      <Animated.View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
          pulse ? animatedStyle : undefined,
        ]}
      />
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
  },
});

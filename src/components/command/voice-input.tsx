import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, typography, space } from '@/src/lib/design-tokens';

interface VoiceInputProps {
  active: boolean;
  meteringLevel?: number;
}

/**
 * Voice input indicator — no longer a standalone FAB.
 * Shows listening feedback when voice mode is active in the text input bar.
 */
export function VoiceInput({ active, meteringLevel = 0 }: VoiceInputProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!active) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.dotRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { opacity: 0.4 + Math.min(meteringLevel / 100, 0.6) },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>Listening...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: space[3],
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.velvet.DEFAULT,
  },
  label: {
    marginTop: space[2],
    ...typography.bodySm,
    color: colors.text.muted,
  },
});

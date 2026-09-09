import React, { useEffect } from 'react';
import { View, StyleSheet, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({
  width,
  height = 20,
  rounded = false,
  className = '',
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [opacity, shimmerTranslate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value * 200 }],
  }));

  return (
    <Animated.View
      style={[{ height, width }, animatedStyle, localStyles.container]}
      className={`bg-versa-muted ${rounded ? 'rounded-full' : 'rounded-xl'} ${className}`}
    >
      <Animated.View style={[localStyles.shimmerOverlay, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={localStyles.shimmerGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function SkeletonCard() {
  return (
    <View className="rounded-2xl border border-warm-border bg-white p-5">
      <Skeleton height={12} className="mb-3 w-1/3" />
      <Skeleton height={16} className="mb-2" />
      <Skeleton height={16} className="w-2/3" />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    left: '-20%',
  },
  shimmerGradient: {
    flex: 1,
  },
});

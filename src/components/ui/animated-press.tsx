import React from 'react';
import { Pressable, type PressableProps, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { animation } from '@/src/lib/design-tokens';
import { hapticLight } from '@/src/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
  scaleDown?: number;
}

export function AnimatedPress({
  children,
  className = '',
  scaleDown = 0.97,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        hapticLight();
        scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      style={animatedStyle}
      className={className}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

interface StaggeredFadeInProps extends ViewProps {
  index: number;
  children: React.ReactNode;
  className?: string;
}

export function StaggeredFadeIn({
  index,
  children,
  className,
  ...props
}: StaggeredFadeInProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(animation.stagger.duration)
        .delay(index * animation.stagger.delayPerItem)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })}
      className={className}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

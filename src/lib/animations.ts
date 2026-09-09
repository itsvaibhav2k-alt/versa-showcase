/**
 * Reanimated entering/layout animation presets for Versa.
 *
 * Usage:
 *   <Animated.View entering={listItemEntering(index)}>
 *   <Animated.View entering={heroEntering}>
 *   <Animated.View layout={layoutTransition}>
 *
 * For a wrapper component that applies stagger automatically,
 * see StaggeredFadeIn in src/components/ui/animated-press.tsx.
 */
import {
  FadeIn,
  SlideInDown,
  Layout,
  type EntryAnimationsValues,
  type AnimationCallback,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

/**
 * List item entering: fade in + slide up from 8px, staggered by index.
 * 180ms duration, 50ms stagger per item.
 */
export function listItemEntering(index: number) {
  return FadeIn.duration(180)
    .delay(index * 50)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
}

/**
 * Hero card/section entering: fade in + slide up from 12px + scale from 0.98.
 * 300ms spring animation.
 */
export const heroEntering = FadeIn.duration(300)
  .springify()
  .damping(20)
  .stiffness(150)
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: 12 }, { scale: 0.98 }],
  });

/**
 * Section header entering: simple fade in, 150ms with 50ms delay.
 */
export const sectionEntering = FadeIn.duration(150).delay(50);

/**
 * Toast entering: slide in from bottom with spring.
 */
export const toastEntering = SlideInDown.springify()
  .damping(15)
  .stiffness(150);

/**
 * Layout transition for reordering/resizing.
 * Use on Animated.View's `layout` prop.
 */
export const layoutTransition = Layout.springify()
  .damping(20)
  .stiffness(200);

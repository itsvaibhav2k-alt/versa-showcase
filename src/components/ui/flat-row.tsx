import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { colors } from '@/src/lib/design-tokens';

interface FlatRowProps {
  children: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  dividerIndent?: number;
  testID?: string;
  className?: string;
  accessibilityLabel?: string;
}

export function FlatRow({
  children,
  onPress,
  showDivider = true,
  dividerIndent = 0,
  testID,
  className,
  accessibilityLabel,
}: FlatRowProps) {
  const content = (
    <>
      <View style={styles.inner}>{children}</View>
      {showDivider ? (
        <View
          style={[
            styles.divider,
            dividerIndent > 0 ? { marginLeft: dividerIndent } : undefined,
          ]}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        className={className}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.container,
          pressed ? styles.pressed : undefined,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.container} testID={testID} className={className}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  pressed: {
    backgroundColor: colors.bg.hover,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.divider,
  },
});

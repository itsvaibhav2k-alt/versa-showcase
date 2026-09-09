import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography } from '@/src/lib/design-tokens';

interface Tab {
  key: string;
  label: string;
}

interface UnderlineTabsProps {
  tabs: Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
  testID?: string;
}

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
}) {
  const underlineWidth = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    underlineWidth.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive, underlineWidth]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underlineWidth.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      testID={`tab-${tab.key}`}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        style={[
          styles.tabText,
          isActive ? styles.tabTextActive : undefined,
        ]}
      >
        {tab.label}
      </Text>
      <Animated.View
        style={[styles.underline, underlineStyle]}
      />
    </Pressable>
  );
}

export function UnderlineTabs({
  tabs,
  activeKey,
  onSelect,
  testID,
}: UnderlineTabsProps) {
  return (
    <View style={styles.container} testID={testID}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={tab.key === activeKey}
          onPress={() => onSelect(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.divider,
  },
  tab: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: typography.bodyMd.fontSize,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.primary,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 1,
  },
});

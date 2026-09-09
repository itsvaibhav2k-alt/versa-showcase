import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/lib/design-tokens';

interface StatItem {
  value: number;
  label: string;
}

interface StatLineProps {
  items: StatItem[];
  pillColors?: { text: string; bg: string }[];
  testID?: string;
}

export function StatLine({ items, pillColors, testID }: StatLineProps) {
  return (
    <View style={styles.container} testID={testID ?? 'stat-line'}>
      {items.map((item, index) => {
        const pill = pillColors?.[index];
        const isEmpty = item.value === 0;

        return (
          <View
            key={item.label}
            style={[
              styles.pill,
              isEmpty
                ? styles.pillEmpty
                : pill
                  ? { backgroundColor: pill.bg }
                  : undefined,
              isEmpty && { opacity: 0.55 },
            ]}
          >
            <Text
              style={[
                styles.value,
                pill ? { color: pill.text } : undefined,
              ]}
            >
              {item.value}
            </Text>
            <Text
              style={[
                styles.label,
                pill ? { color: pill.text, opacity: 0.85 } : undefined,
              ]}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pillEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  value: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700',
    color: colors.text.body,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.body,
  },
});

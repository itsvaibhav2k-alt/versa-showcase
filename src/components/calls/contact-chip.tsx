import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Avatar } from '@/src/components/ui/avatar';
import { colors, typography, space } from '@/src/lib/design-tokens';

interface ContactChipProps {
  name: string;
  phone: string;
  onPress: () => void;
}

export function ContactChip({ name, onPress }: ContactChipProps) {
  const firstName = name.split(' ')[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Avatar name={name} size="xs" />
      <Text style={styles.label} numberOfLines={1}>
        {firstName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.muted,
    borderRadius: 20,
    paddingTop: space[1],
    paddingBottom: space[1],
    paddingLeft: space[1],
    paddingRight: space[3],
    gap: 6,
  },
  chipPressed: {
    backgroundColor: colors.border.DEFAULT,
  },
  label: {
    ...typography.bodySm,
    color: colors.text.body,
  },
});

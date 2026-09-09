import React from 'react';
import { View, Text } from 'react-native';

type BadgeType = 'count' | 'plan' | 'ai' | 'custom';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  className?: string;
}

const typeStyles: Record<BadgeType, { bg: string; text: string }> = {
  count: { bg: 'bg-coral', text: 'text-white' },
  plan: { bg: 'bg-velvet-wash', text: 'text-velvet' },
  ai: { bg: 'bg-plum-light', text: 'text-plum' },
  custom: { bg: 'bg-versa-muted', text: 'text-ink-secondary' },
};

export function Badge({
  label,
  type = 'custom',
  className = '',
}: BadgeProps) {
  const { bg, text } = typeStyles[type];

  return (
    <View
      className={`self-start rounded-full px-2.5 py-0.5 ${bg} ${className}`}
      accessibilityLabel={`${label} badge`}
    >
      <Text className={`text-xs font-semibold ${text}`}>
        {label}
      </Text>
    </View>
  );
}

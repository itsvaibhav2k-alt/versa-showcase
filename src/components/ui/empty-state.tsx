import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/src/lib/design-tokens';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: LucideComponent,
  title,
  description,
  className = '',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 ${className}`}>
      <LucideComponent size={40} color={colors.text.muted} strokeWidth={1.5} />
      <Text className="mt-4 font-body-semibold text-base text-ink-muted">
        {title}
      </Text>
      <Text className="mt-1 font-body text-center text-sm text-ink-muted">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            {
              backgroundColor: pressed ? '#52254F' : '#69306D',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              marginTop: 16,
            },
          ]}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'DMSans_600SemiBold',
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
